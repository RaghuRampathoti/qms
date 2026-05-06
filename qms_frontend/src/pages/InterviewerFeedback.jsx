import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  MessageSquare, Star, User, Briefcase,
  CheckCircle, Clock, ChevronLeft, ChevronRight, Loader2, Calendar,
  Edit2, X, AlertCircle, CheckCircle2
} from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

const RESULT_COLORS = {
  SELECTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  ON_HOLD: 'bg-amber-100 text-amber-700 border-amber-200',
  NEXT_ROUND: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function InterviewerFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [editForm, setEditForm] = useState({
    tokenId: '',
    rating: 1,
    result: 'SELECTED',
    comments: '',
    strengths: '',
    improvements: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchMyFeedback()
    const interval = setInterval(fetchMyFeedback, 10000)
    return () => clearInterval(interval)
  }, [page])

  const fetchMyFeedback = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/feedback/my-feedback?page=${page}&size=10`, { headers: getHeaders() })
      setFeedbacks(res.data.data.content)
      setTotalPages(res.data.data.totalPages)
    } catch (err) {
      showMsg('error', 'Failed to fetch my feedback')
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const openEditModal = (f) => {
    setEditingFeedback(f)
    setEditForm({
      tokenId: f.tokenId,
      rating: f.rating,
      result: f.result,
      comments: f.comments || '',
      strengths: f.strengths || '',
      improvements: f.improvements || ''
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.put(`/api/feedback/${editingFeedback.id}`, editForm, { headers: getHeaders() })
      showMsg('success', 'Feedback updated successfully')
      setShowEditModal(false)
      fetchMyFeedback()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      <main className="flex-1 lg:ml-56 flex flex-col">
        <Header
          title="Feedback History"
          subtitle="Evaluation archives for"
          user={user}
        />

        <div className="flex-1 p-6 lg:p-12">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="fixed top-6 right-6 z-[200]"
              >
                <div className={`px-6 py-4 rounded-2xl flex items-center space-x-4 shadow-2xl border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                  {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span className="font-bold text-sm">{message.text}</span>
                  <button onClick={() => setMessage(null)}><X size={18} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-300">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-gray-500 font-medium">Loading your feedback history...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No feedback submitted yet</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-1">Feedback will appear here once you complete an interview and submit the form.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {feedbacks.map((f) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={f.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl">
                            {f.candidateName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-lg font-bold text-black">{f.candidateName}</h3>
                              <span className="font-mono text-[10px] bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-gray-400">{f.tokenId}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center"><Briefcase size={12} className="mr-1" /> {f.applyingPosition}</span>
                              <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(f.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${RESULT_COLORS[f.result]}`}>
                            {f.result.replace('_', ' ')}
                          </div>
                          <div className="flex items-center text-amber-500 font-bold text-sm">
                            <Star size={14} className="fill-amber-500 mr-1" />
                            {f.rating}/5
                          </div>
                          <button
                            onClick={() => openEditModal(f)}
                            className="p-2 bg-gray-50 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                            title="Edit Feedback"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Feedback Summary</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 flex items-center"><CheckCircle size={10} className="mr-1" /> Strengths</p>
                            <p className="text-sm text-gray-600 italic">"{f.strengths || 'N/A'}"</p>
                          </div>
                          <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center"><Clock size={10} className="mr-1" /> Improvements</p>
                            <p className="text-sm text-gray-600 italic">"{f.improvements || 'N/A'}"</p>
                          </div>
                        </div>
                        <div className="mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center"><MessageSquare size={10} className="mr-1" /> Comments</p>
                          <p className="text-sm text-gray-600">{f.comments || 'No additional comments provided.'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-500">
                  Page <span className="font-bold text-black">{page + 1}</span> of <span className="font-bold text-black">{totalPages || 1}</span>
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:border-gray-400 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:border-gray-400 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ModalWrapper isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">Edit Feedback</h2>
            <p className="text-gray-500 text-sm font-medium">Update your evaluation for {editingFeedback?.candidateName}</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Interview Result</label>
                <select
                  value={editForm.result}
                  onChange={e => setEditForm({ ...editForm, result: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-transparent rounded-[1.25rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all"
                >
                  <option value="SELECTED">SELECTED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="NEXT_ROUND">NEXT ROUND</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Rating (1-5)</label>
                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-[1.25rem]">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, rating: star })}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${editForm.rating >= star ? 'bg-amber-100 text-amber-600' : 'text-gray-300 hover:bg-gray-100'}`}
                    >
                      <Star size={20} className={editForm.rating >= star ? 'fill-amber-500' : ''} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Key Strengths</label>
              <textarea
                value={editForm.strengths}
                onChange={e => setEditForm({ ...editForm, strengths: e.target.value })}
                placeholder="What did the candidate do well?"
                className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all h-24 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Areas for Improvement</label>
              <textarea
                value={editForm.improvements}
                onChange={e => setEditForm({ ...editForm, improvements: e.target.value })}
                placeholder="Where can the candidate improve?"
                className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all h-24 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Detailed Comments</label>
              <textarea
                value={editForm.comments}
                onChange={e => setEditForm({ ...editForm, comments: e.target.value })}
                placeholder="Any additional notes..."
                className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all h-32 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 text-white py-5 rounded-[1.5rem] font-black hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 active:scale-95 disabled:opacity-60"
            >
              {submitting ? 'UPDATING...' : 'SAVE CHANGES'}
            </button>
          </form>
        </div>
      </ModalWrapper>
    </div>
  )
}

function ModalWrapper({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={onClose} className="absolute top-8 right-8 p-3 rounded-2xl text-gray-400 hover:bg-gray-50 transition-colors"><X size={20} /></button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
