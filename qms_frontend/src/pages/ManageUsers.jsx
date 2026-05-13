import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Power, PowerOff, Shield, Users, Mail, Phone, Lock, X } from 'lucide-react'
import axios from 'axios'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const [activeTab, setActiveTab] = useState(currentUser.role === 'SUPER_ADMIN' ? 'ADMIN' : 'INTERVIEWER')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('CREATE')
  const [formData, setFormData] = useState({
    id: null,
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'ADMIN'
  })


  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 10000)
    return () => clearInterval(interval)
  }, [])

  const filteredUsers = users.filter(u => u.role === activeTab)

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode)
    if (mode === 'EDIT' && user) {
      setFormData({
        id: user.id,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        password: '',
        role: user.role
      })
    } else {
      setFormData({
        id: null,
        userName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: activeTab
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const payload = {
        userName: formData.userName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      }

      if (modalMode === 'CREATE') {
        payload.password = formData.password
        payload.role = formData.role
        await axios.post('/api/users', payload, { headers })
      } else {
        if (formData.password) payload.password = formData.password
        await axios.put(`/api/users/${formData.id}`, payload, { headers })
      }

      setIsModalOpen(false)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/api/users/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
    } catch (err) {
      alert('Failed to toggle status')
    }
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      <main className="flex-1 lg:ml-56 flex flex-col">
        <Header title="Manage Users" subtitle="Administrators & Interviewers" user={currentUser} />

        <div className="flex-1 p-6 lg:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex space-x-2 bg-blue-50 p-1 rounded-2xl w-full sm:w-auto">
              {currentUser.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'ADMIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Shield size={18} />
                  <span>Admins</span>
                </div>
              </button>
              )}
              <button
                onClick={() => setActiveTab('INTERVIEWER')}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'INTERVIEWER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users size={18} />
                  <span>Interviewers</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => handleOpenModal('CREATE')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus size={20} />
              <span>Add {activeTab === 'ADMIN' ? 'Admin' : 'Interviewer'}</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Info</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">Loading users...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">No users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className={`hover:bg-white transition-colors ${!u.active ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-900 font-bold ${u.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'
                              }`}>
                              {u.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{u.userName}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">{u.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1 text-sm text-slate-600">
                            <div className="flex items-center space-x-2">
                              <Mail size={14} className="text-slate-500" />
                              <span>{u.email}</span>
                            </div>
                            {u.phoneNumber && (
                              <div className="flex items-center space-x-2">
                                <Phone size={14} className="text-slate-500" />
                                <span>{u.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${u.active
                              ? 'bg-emerald-50 text-secondary-600 border-secondary-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenModal('EDIT', u)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Edit User"
                            >
                              <Edit2 size={18} />
                            </button>
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleActive(u.id)}
                                className={`p-2 rounded-xl transition-colors ${u.active
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-secondary-600 hover:bg-emerald-50'
                                  }`}
                                title={u.active ? 'Deactivate User' : 'Activate User'}
                              >
                                {u.active ? <PowerOff size={18} /> : <Power size={18} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden z-[70]"
            >
              <div className="p-6 border-b border-blue-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {modalMode === 'CREATE' ? 'Add New' : 'Edit'} {formData.role === 'ADMIN' ? 'Admin' : 'Interviewer'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    {modalMode === 'CREATE' ? 'Password' : 'New Password (Optional)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required={modalMode === 'CREATE'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder={modalMode === 'CREATE' ? "Create a secure password" : "Leave blank to keep current"}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-blue-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    {modalMode === 'CREATE' ? 'Create User' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
