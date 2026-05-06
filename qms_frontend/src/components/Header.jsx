import { Settings, X, User as UserIcon, Mail, Phone, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import axios from 'axios'

export default function Header({ title, subtitle, user, cabin, cabinStatus }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    userName: user?.userName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    currentPassword: '',
    newPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleOpenSettings = async () => {
    setIsModalOpen(true)
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const profile = res.data
      setFormData({
        userName: profile.userName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        currentPassword: '',
        newPassword: ''
      })
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...profile }))
    } catch (err) {
      console.error('Failed to fetch profile', err)
      setFormData({
        userName: user?.userName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        currentPassword: '',
        newPassword: ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('token')
      const res = await axios.put('/api/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.setItem('user', JSON.stringify(res.data))
      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        setIsModalOpen(false)
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-teal-700 border-b border-teal-800 px-4 lg:px-8 py-2.5 flex items-center justify-between text-white shadow-lg shadow-teal-900/10">
        <div className="flex items-center gap-4">
          <div className="lg:hidden w-8" />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-lg font-black text-white tracking-tighter leading-none">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-teal-100 font-bold text-[10px] uppercase tracking-widest">
                {subtitle && <span className="opacity-60 mr-1">{subtitle}</span>}
                {user?.userName}{cabin ? ` · ${cabin.cabinName}` : ''}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          {cabinStatus && (
            <span className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cabinStatus === 'BUSY' ? 'bg-blue-400 animate-pulse' : cabinStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
              {cabinStatus}
            </span>
          )}

          <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full p-1.5">

            <button
              onClick={handleOpenSettings}
              className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <Settings size={18} />
            </button>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-teal-950/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-[101]"
            >
              <div className="relative p-5 pb-4 bg-gradient-to-br from-teal-600 to-teal-800 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-start justify-between relative z-10 mb-6">
                  <div>
                    <h2 className="text-xl font-black tracking-tight">Account Settings</h2>
                    <p className="text-teal-100 text-xs mt-0.5">Manage your profile and security</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors backdrop-blur-md"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center space-x-3 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white text-teal-700 flex items-center justify-center text-xl font-black shadow-lg">
                    {user?.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{user?.userName}</h3>
                    <p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest">{user?.role || 'User'}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-sm font-bold flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span>{success}</span>
                    </motion.div>
                  )}

                  <div className="space-y-5">
                    <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                      <UserIcon size={16} className="text-teal-600" />
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Personal Details</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
                        <input
                          type="text"
                          required
                          value={formData.userName}
                          onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-teal-500 rounded-2xl text-black focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-teal-500 rounded-2xl text-black focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                          />
                          <Mail size={16} className="text-gray-400 absolute left-4 top-3.5" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-teal-500 rounded-2xl text-black focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                          />
                          <Phone size={16} className="text-gray-400 absolute left-4 top-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 pt-2">
                    <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                      <Lock size={16} className="text-teal-600" />
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Security</h4>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      Leave these fields blank if you don't wish to change your current password.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-teal-500 rounded-2xl text-black focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium placeholder:text-gray-300"
                          placeholder="Enter to verify identity"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:border-teal-500 rounded-2xl text-black focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium placeholder:text-gray-300"
                          placeholder="Create a new secure password"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-[2] px-4 py-2.5 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

