import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  Plus, Users, MapPin, X, CheckCircle2, AlertCircle,
  Pencil, Minus, ChevronUp, ChevronDown, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const STATUS_STYLE = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300' },
  BUSY: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
}

export default function ManageCabins() {
  const [interviewers, setInterviewers] = useState([])
  const [cabins, setCabins] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCabinModal, setShowCabinModal] = useState(false)
  const [editCabin, setEditCabin] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const [userData, setUserData] = useState({ userName: '', email: '', phoneNumber: '', password: '', role: 'INTERVIEWER' })
  const [cabinData, setCabinData] = useState({ cabinName: '', panelSize: 1 })

  const [editUser, setEditUser] = useState(null)
  const [editUserData, setEditUserData] = useState({ userName: '', email: '', phoneNumber: '', password: '' })

  const [editForm, setEditForm] = useState({ cabinName: '', panelSize: 1, interviewerIds: [] })

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { 
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [intRes, cabRes] = await Promise.all([
        axios.get('/api/users/interviewers', { headers }),
        axios.get('/api/cabins', { headers }),
      ])
      setInterviewers(intRes.data)
      setCabins(cabRes.data)
    } catch { }
  }

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/users', userData, { headers })
      showMsg('success', 'Interviewer created successfully!')
      setShowUserModal(false)
      setUserData({ userName: '', email: '', phoneNumber: '', password: '', role: 'INTERVIEWER' })
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to create interviewer.')
    } finally { setLoading(false) }
  }

  const handleCreateCabin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/cabins', cabinData, { headers })
      showMsg('success', 'Cabin created successfully!')
      setShowCabinModal(false)
      setCabinData({ cabinName: '', panelSize: 1 })
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to create cabin.')
    } finally { setLoading(false) }
  }

  const openEdit = (cabin) => {
    setEditCabin(cabin)
    setEditForm({
      cabinName: cabin.cabinName,
      panelSize: cabin.panelSize,
      interviewerIds: cabin.interviewers.map(i => i.id),
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put(`/api/cabins/${editCabin.id}`, editForm, { headers })
      showMsg('success', `${editForm.cabinName} updated successfully!`)
      setEditCabin(null)
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Update failed.')
    } finally { setLoading(false) }
  }

  const decreasePanelSize = () => {
    const newSize = Math.max(1, editForm.panelSize - 1)
    setEditForm(f => ({
      ...f,
      panelSize: newSize,
      interviewerIds: f.interviewerIds.slice(0, newSize),
    }))
  }
  const increasePanelSize = () => {
    setEditForm(f => ({ ...f, panelSize: f.panelSize + 1 }))
  }

  const setSlotInterviewer = (slotIndex, interviewerId) => {
    setEditForm(f => {
      const ids = [...f.interviewerIds]
      if (interviewerId === '') {
        ids.splice(slotIndex, 1)
      } else {
        ids[slotIndex] = Number(interviewerId)
      }
      return { ...f, interviewerIds: ids }
    })
  }

  const removeSlotInterviewer = (slotIndex) => {
    setEditForm(f => {
      const ids = [...f.interviewerIds]
      ids.splice(slotIndex, 1)
      return { ...f, interviewerIds: ids }
    })
  }

  const handleAssign = async (cabinId, interviewerId) => {
    if (!interviewerId) return
    try {
      await axios.patch(`/api/cabins/${cabinId}/assign/${interviewerId}`, {}, { headers })
      showMsg('success', 'Interviewer assigned to cabin!')
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Assignment failed.')
    }
  }

  const handleRemoveInterviewer = async (cabinId, interviewerId) => {
    try {
      await axios.patch(`/api/cabins/${cabinId}/remove/${interviewerId}`, {}, { headers })
      showMsg('success', 'Interviewer removed from cabin.')
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Removal failed.')
    }
  }

  const handleToggleCabin = async (cabin) => {
    try {
      const ep = cabin.status === 'ACTIVE' || cabin.status === 'BUSY' ? 'deactivate' : 'activate'
      await axios.patch(`/api/cabins/${cabin.id}/${ep}`, {}, { headers })
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Toggle failed.')
    }
  }

  const handleToggleUser = async (userId) => {
    try {
      await axios.patch(`/api/users/${userId}/toggle`, {}, { headers })
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Toggle failed.')
    }
  }

  const openEditUser = (user) => {
    setEditUser(user)
    setEditUserData({
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      password: ''
    })
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put(`/api/users/${editUser.id}`, editUserData, { headers })
      showMsg('success', 'Interviewer updated successfully!')
      setEditUser(null)
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update interviewer.')
    } finally { setLoading(false) }
  }

  const availableForSlot = (currentSlotId) =>
    interviewers.filter(i =>
      i.active &&
      (i.id === currentSlotId || !editForm.interviewerIds.includes(i.id))
    )

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />

      <main className="flex-1 lg:ml-56 flex flex-col">
        <Header
          title="Infrastructure"
          subtitle="Manage interviewers and cabins for"
          user={user}
        />

        <div className="flex-1 p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 mb-8">
            <button onClick={() => setShowUserModal(true)} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white border border-gray-100 px-5 py-3 rounded-2xl text-black hover:bg-gray-50 transition-all font-bold text-sm shadow-sm">
              <Users size={18} className="text-teal-600" />
              <span>Add Interviewer</span>
            </button>
            <button onClick={() => setShowCabinModal(true)} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-teal-600 px-6 py-3 rounded-2xl text-white hover:bg-teal-700 transition-all font-bold text-sm shadow-lg shadow-teal-600/20 active:scale-95">
              <Plus size={18} />
              <span>New Cabin</span>
            </button>
          </div>
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
              >
                {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="font-medium">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={18} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-black flex items-center">
                  <MapPin size={20} className="mr-2 text-teal-600" />Cabins
                </h2>
                <span className="text-xs text-gray-400 font-medium">{cabins.length} total</span>
              </div>

              <div className="divide-y divide-gray-50">
                {cabins.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">No cabins found</div>
                ) : cabins.map(cabin => {
                  const s = STATUS_STYLE[cabin.status] || STATUS_STYLE.INACTIVE
                  const needsInterviewer = cabin.status === 'INACTIVE' && cabin.interviewers.length === 0

                  return (
                    <div key={cabin.id} className="p-5 hover:bg-gray-50/40 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-bold text-black">{cabin.cabinName}</h3>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${s.bg} ${s.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                <span>{cabin.status}</span>
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">
                                {cabin.interviewers.length}/{cabin.panelSize} members
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEdit(cabin)}
                            disabled={cabin.status === 'BUSY'}
                            title={cabin.status === 'BUSY' ? 'Cannot edit during interview' : 'Edit cabin'}
                            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => handleToggleCabin(cabin)}
                            disabled={cabin.status === 'BUSY' || (cabin.status === 'INACTIVE' && cabin.interviewers.length === 0)}
                            title={
                              cabin.status === 'BUSY' ? 'Interview in progress' :
                                cabin.interviewers.length === 0 ? 'Assign an interviewer first' : ''
                            }
                            className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${cabin.status === 'ACTIVE' || cabin.status === 'BUSY' ? 'bg-teal-600' : 'bg-gray-200'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${cabin.status === 'ACTIVE' || cabin.status === 'BUSY' ? 'left-6' : 'left-1'
                              }`} />
                          </button>
                        </div>
                      </div>

                      {needsInterviewer && (
                        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
                          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                          <p className="text-xs text-amber-700 font-medium">
                            No interviewers assigned — cabin cannot be activated
                          </p>
                        </div>
                      )}
                      <div className="bg-gray-50/60 rounded-2xl border border-gray-100 p-3">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">
                          Panel ({cabin.interviewers.length}/{cabin.panelSize})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {cabin.interviewers.map(int => (
                            <div key={int.id} className={`flex items-center space-x-2 pl-2.5 pr-1.5 py-1.5 rounded-xl border text-sm font-medium group/int transition-all ${int.active ? 'bg-white border-gray-100 text-black' : 'bg-red-50 border-red-100 text-red-500 line-through'}`}>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${int.active ? 'bg-teal-600 text-white' : 'bg-red-200 text-red-600'}`}>
                                {int.userName.charAt(0).toUpperCase()}
                              </div>
                              <span className="max-w-[90px] truncate">{int.userName}</span>
                              {!int.active && <span className="text-[10px] text-red-400 font-normal no-underline ml-0.5">(inactive)</span>}
                              <button
                                onClick={() => handleRemoveInterviewer(cabin.id, int.id)}
                                className="p-0.5 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors ml-0.5"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {cabin.interviewers.length === 0 && (
                            <span className="text-xs text-gray-400 italic">None assigned</span>
                          )}
                        </div>

                        {cabin.interviewers.length < cabin.panelSize && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <select
                              onChange={e => handleAssign(cabin.id, e.target.value)}
                              value=""
                              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 outline-none w-full transition-all"
                            >
                              <option value="">+ Add panel member</option>
                              {interviewers
                                .filter(i => i.active && !cabin.interviewers.find(ci => ci.id === i.id))
                                .map(int => (
                                  <option key={int.id} value={int.id}>{int.userName}</option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-black flex items-center">
                  <Users size={20} className="mr-2 text-teal-600" />Interviewers
                </h2>
                <span className="text-xs text-gray-400 font-medium">{interviewers.length} total</span>
              </div>
              <div className="divide-y divide-gray-50">
                {interviewers.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">No interviewers found</div>
                ) : interviewers.map(user => (
                  <div key={user.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${user.active ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}>
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-bold truncate ${user.active ? 'text-black' : 'text-gray-400'}`}>{user.userName}</h3>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-3">
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-200 transition-all"
                        title="Edit interviewer"
                      >
                        <Pencil size={15} />
                      </button>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {user.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <button
                        onClick={() => handleToggleUser(user.id)}
                        className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${user.active ? 'bg-teal-600' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${user.active ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {editCabin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditCabin(null)} />

            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 lg:p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setEditCabin(null)} className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center">
                  <Pencil size={18} className="text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-black">Edit Cabin</h2>
                  <p className="text-xs text-gray-400">Changes take effect immediately</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-6">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cabin Name</label>
                  <input
                    required
                    value={editForm.cabinName}
                    onChange={e => setEditForm(f => ({ ...f, cabinName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Panel Size</label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={decreasePanelSize}
                      disabled={editForm.panelSize <= 1}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} />
                    </button>

                    <div className="flex-1 text-center">
                      <span className="text-3xl font-black text-black">{editForm.panelSize}</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {editForm.panelSize === 1 ? 'Single interviewer' : `${editForm.panelSize}-member panel`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={increasePanelSize}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {editForm.panelSize < editCabin.interviewers.length && (
                    <div className="mt-2 flex items-start space-x-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Reducing panel size will remove the last{' '}
                        <span className="font-bold">{editCabin.interviewers.length - editForm.panelSize}</span>{' '}
                        assigned interviewer{editCabin.interviewers.length - editForm.panelSize > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Panel Members
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {editForm.interviewerIds.length}/{editForm.panelSize} assigned
                    </span>
                  </label>

                  <div className="space-y-2">
                    {Array.from({ length: editForm.panelSize }).map((_, idx) => {
                      const assignedId = editForm.interviewerIds[idx] ?? null
                      const assignedUser = assignedId
                        ? interviewers.find(i => i.id === assignedId)
                        : null

                      return (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>

                          <select
                            value={assignedId ?? ''}
                            onChange={e => setSlotInterviewer(idx, e.target.value)}
                            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                          >
                            <option value="">— Unassigned —</option>
                            {availableForSlot(assignedId).map(i => (
                              <option key={i.id} value={i.id}>{i.userName}</option>
                            ))}
                          </select>

                          {assignedId && (
                            <button
                              type="button"
                              onClick={() => removeSlotInterviewer(idx)}
                              className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {interviewers.filter(i => i.active).length === 0 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center space-x-1">
                      <AlertTriangle size={12} />
                      <span>No active interviewers available. Add one first.</span>
                    </p>
                  )}
                </div>

                {editForm.interviewerIds.length === 0 && (
                  <div className="flex items-start space-x-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Saving with no panel members will set this cabin to <span className="font-bold">INACTIVE</span>
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditCabin(null)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-60"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowUserModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 lg:p-8 relative z-10 shadow-2xl"
            >
              <button onClick={() => setShowUserModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-black mb-6">Add New Interviewer</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {[
                  { label: 'Username', key: 'userName', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Phone Number', key: 'phoneNumber', type: 'text' },
                  { label: 'Password', key: 'password', type: 'password' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input required type={type} value={userData[key]}
                      onChange={e => setUserData({ ...userData, [key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all focus:border-teal-500"
                    />
                  </div>
                ))}
                <button disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold mt-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 text-sm">
                  {loading ? 'Creating...' : 'Create Interviewer'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCabinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowCabinModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 lg:p-8 relative z-10 shadow-2xl"
            >
              <button onClick={() => setShowCabinModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-black mb-6">Create New Cabin</h2>
              <form onSubmit={handleCreateCabin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Name</label>
                  <input required value={cabinData.cabinName}
                    onChange={e => setCabinData({ ...cabinData, cabinName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all focus:border-teal-500"
                    placeholder="e.g. Cabin A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Panel Size</label>
                  <select value={cabinData.panelSize}
                    onChange={e => setCabinData({ ...cabinData, panelSize: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all focus:border-teal-500"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} Member Panel</option>
                    ))}
                  </select>
                </div>
                <button disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold mt-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 text-sm">
                  {loading ? 'Creating...' : 'Create Cabin'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditUser(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 lg:p-8 relative z-10 shadow-2xl"
            >
              <button onClick={() => setEditUser(null)} className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-black mb-1">Edit Interviewer</h2>
              <p className="text-sm text-gray-400 mb-6">Update interviewer information and credentials</p>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input required type="text" value={editUserData.userName}
                    onChange={e => setEditUserData({ ...editUserData, userName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" value={editUserData.email}
                    onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="text" value={editUserData.phoneNumber}
                    onChange={e => setEditUserData({ ...editUserData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                    <span className="text-[10px] text-gray-400 font-normal ml-2">(leave blank to keep current)</span>
                  </label>
                  <input type="password" value={editUserData.password}
                    onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm transition-all focus:border-teal-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setEditUser(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button disabled={loading} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 text-sm">
                    {loading ? 'Saving...' : 'Save Changes'}
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