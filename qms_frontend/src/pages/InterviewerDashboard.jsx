import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import Notification from '../components/Notification'
import {
  Users, UserCheck, PhoneCall, Play, AlertTriangle,
  CheckCircle, Loader2, Star, MessageSquare,
  Clock, ShieldCheck, Zap, Eye, X,
  Mail, Phone, MapPin, Briefcase, ClipboardList,
  GraduationCap, Calendar, Paperclip
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  BUSY: 'bg-blue-50 text-blue-700 border-blue-100',
  INACTIVE: 'bg-blue-50 text-slate-500 border-blue-100'
}

export default function InterviewerDashboard() {
  const [loading, setLoading] = useState(true)
  const [cabin, setCabin] = useState(null)
  const [queue, setQueue] = useState([])
  const [currentToken, setCurrentToken] = useState(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [completedToken, setCompletedToken] = useState(null)
  const [feedback, setFeedback] = useState({ result: '', rating: 5, comments: '', strengths: '', improvements: '' })
  const [fbLoading, setFbLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [viewCandidate, setViewCandidate] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 5000)
  }

  const fetchCompletedCount = useCallback(async () => {
    try {
      const res = await axios.get('/api/interviewer/completed-count', { headers: getHeaders() })
      setCompletedCount(res.data.data || 0)
    } catch (err) {
      console.error('Failed to fetch completed count', err)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [cabinRes, queueRes] = await Promise.all([
        axios.get('/api/interviewer/my-cabin', { headers: getHeaders() }),
        axios.get('/api/interviewer/queue', { headers: getHeaders() }),
      ])
      const cabinData = cabinRes.data.data
      setCabin(cabinData)
      setQueue(queueRes.data.data || [])

      if (cabinData?.status === 'BUSY' && cabinData?.currentCandidateToken && !currentToken) {
        // Fetch full token details so View Details modal has all candidate fields
        try {
          const tokenRes = await axios.get('/api/interviewer/current-token', { headers: getHeaders() })
          const fullToken = tokenRes.data.data
          if (fullToken) {
            setCurrentToken(fullToken)
          } else {
            // Fallback with basic cabin info
            setCurrentToken({
              tokenId: cabinData.currentCandidateToken,
              candidateName: cabinData.currentCandidateName,
              status: cabinData.currentCandidateStatus || 'CALLED',
            })
          }
        } catch {
          setCurrentToken({
            tokenId: cabinData.currentCandidateToken,
            candidateName: cabinData.currentCandidateName,
            status: cabinData.currentCandidateStatus || 'CALLED',
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err)
    } finally {
      setLoading(false)
    }
  }, [currentToken])

  useEffect(() => {
    fetchData()
    fetchCompletedCount()
    const interval = setInterval(() => {
      fetchData()
      fetchCompletedCount()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchData, fetchCompletedCount])

  const handleCallNext = async () => {
    setActionLoading(true)
    try {
      const res = await axios.post('/api/interviewer/call-next', {}, { headers: getHeaders() })
      setCurrentToken(res.data.data)
      fetchData()
      showMsg('success', 'Candidate called successfully.')
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to call next candidate')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStart = async () => {
    setActionLoading(true)
    try {
      await axios.post(`/api/interviewer/start/${currentToken.tokenId}`, {}, { headers: getHeaders() })
      setCurrentToken(prev => ({ ...prev, status: 'IN_PROGRESS' }))
      showMsg('success', 'Interview session started.')
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to start interview')
    } finally {
      setActionLoading(false)
    }
  }

  const handleNoShow = async () => {
    if (!confirm('Mark candidate as No Show? They will be removed from current cabin.')) return
    setActionLoading(true)
    try {
      await axios.post(`/api/interviewer/no-show/${currentToken.tokenId}`, {}, { headers: getHeaders() })
      setCurrentToken(null)
      fetchData()
      showMsg('info', 'Candidate marked as No Show.')
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    setActionLoading(true)
    try {
      await axios.post(`/api/interviewer/complete/${currentToken.tokenId}`, {}, { headers: getHeaders() })
      setCompletedToken(currentToken.tokenId)
      setShowFeedback(true)
      setCurrentToken(null)
      fetchData()
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to complete interview')
    } finally {
      setActionLoading(false)
    }
  }

  const submitFeedback = async (e) => {
    e.preventDefault()
    if (!feedback.result) {
      showMsg('error', 'Please select the overall outcome before submitting.')
      return
    }
    setFbLoading(true)
    try {
      await axios.post('/api/feedback', { ...feedback, tokenId: completedToken }, { headers: getHeaders() })
      setShowFeedback(false)
      setFeedback({ result: '', rating: 5, comments: '', strengths: '', improvements: '' })
      await fetchCompletedCount()
      showMsg('success', 'Feedback submitted successfully.')
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setFbLoading(false)
    }
  }



  const cabinStatus = cabin?.status || 'INACTIVE'

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />

      <main className="flex-1 lg:ml-56 flex flex-col">
        <Header
          title="Interviewer Dashboard"
          user={user}
          cabin={cabin}
          cabinStatus={cabinStatus}
          variant="interviewer"
        />

        <div className="flex-1 p-6 lg:p-10">
          <div className="max-w-[1400px] mx-auto">

            <AnimatePresence>
              {msg && (
                <Notification type={msg.type} message={msg.text} onClose={() => setMsg(null)} />
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 space-y-8">

                <div className="bg-white rounded-3xl border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                  <div className="p-6 border-b border-blue-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <Zap size={20} />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Session</h2>
                    </div>
                    {currentToken && (
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${currentToken.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {currentToken.status === 'IN_PROGRESS' ? 'Ã¢Å¡Â¡ In Progress' : 'Ã°Å¸â€œÅ¾ Called'}
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div className="p-32 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="animate-spin text-blue-600" size={48} />
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading...</p>
                    </div>
                  ) : !cabin ? (
                    <div className="p-20 text-center">
                      <div className="w-24 h-24 bg-white rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-slate-800">
                        <AlertTriangle size={48} />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">No Panel Assigned</h3>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                        Please coordinate with the management team to get a panel assigned.
                      </p>
                    </div>
                  ) : currentToken ? (
                    <div className="p-6 lg:p-8">
                      <div className="flex flex-col md:flex-row md:items-center gap-8 mb-8 pb-8 border-b border-blue-50">
                        <motion.div
                          layoutId="avatar"
                          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-800 text-slate-900 font-bold text-3xl flex items-center justify-center shadow-2xl shadow-primary-900/20 relative"
                        >
                          {currentToken.candidateName?.charAt(0).toUpperCase()}
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-600 border border-blue-50">
                            <UserCheck size={16} />
                          </div>
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-slate-500 rounded text-[10px] font-bold tracking-widest uppercase">Candidate</span>
                            <span className="w-1 h-1 rounded-full bg-blue-100"></span>
                            <span className="text-blue-600 font-mono font-bold text-xs">#{currentToken.tokenId}</span>
                          </div>
                          <h3 className="text-3xl font-bold text-slate-900 tracking-tighter mb-2">{currentToken.candidateName}</h3>
                          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center">
                            <Clock size={12} className="mr-1.5 text-blue-500" />
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button
                          onClick={() => setViewCandidate(currentToken)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
                          title="View candidate details"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        {currentToken.status === 'CALLED' && (
                          <button onClick={handleStart} disabled={actionLoading}
                            className="flex-1 group relative overflow-hidden bg-black text-slate-900 px-6 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 shadow-lg shadow-black/5">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative flex items-center justify-center space-x-2">
                              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                              <span className="text-base uppercase tracking-tight">Begin Interview</span>
                            </div>
                          </button>
                        )}
                        {currentToken.status === 'IN_PROGRESS' && (
                          <button onClick={handleComplete} disabled={actionLoading}
                            className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 transition-all">
                            {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                            <span className="text-base uppercase tracking-tight">Complete Interview</span>
                          </button>
                        )}
                        <button onClick={handleNoShow} disabled={actionLoading}
                          className="flex-1 flex items-center justify-center space-x-2 bg-white border border-blue-100 text-red-500 px-6 py-4 rounded-2xl font-bold hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 disabled:opacity-60">
                          <AlertTriangle size={20} />
                          <span className="text-base uppercase tracking-tight">Mark No-Show</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 lg:p-20 text-center">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-800">
                        <Users size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Awaiting Candidate</h3>
                      <p className="text-slate-500 text-sm font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                        Your panel is active. Call the next candidate when ready.
                      </p>
                      <button onClick={handleCallNext}
                        disabled={actionLoading || cabinStatus === 'INACTIVE' || queue.length === 0}
                        className="group inline-flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                        {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <PhoneCall size={20} className="group-hover:animate-bounce" />}
                        <span className="text-base tracking-tight uppercase">Call Next Token</span>
                      </button>
                      <div className="mt-6 flex items-center justify-center gap-3">
                        {cabinStatus === 'INACTIVE' && <span className="text-[10px] bg-red-50 text-red-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-red-100">Ã¢Å¡Â Ã¯Â¸Â Panel Inactive</span>}
                        {queue.length === 0 && cabinStatus !== 'INACTIVE' && <span className="text-[10px] bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-amber-100">Ã¢â€žÂ¹Ã¯Â¸Â Queue Empty</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                  <div className="p-6 border-b border-blue-50 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Queue Pipeline</h2>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Live</p>
                    </div>
                    <div className="px-4 py-1.5 bg-white rounded-xl flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-secondary-500 animate-pulse"></span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{queue.length} Waiting</span>
                    </div>
                  </div>
                  {queue.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-800">
                        <CheckCircle size={24} />
                      </div>
                      <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Queue Empty</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/30">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">#</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Candidate</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Token</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                          {queue.map((item, idx) => (
                            <tr key={item.tokenId || idx} className={`transition-all hover:bg-blue-50/30 group ${idx === 0 ? 'bg-blue-50/10' : ''}`}>
                              <td className="px-6 py-4">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-50 text-slate-500'}`}>
                                   {idx + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900 text-sm">{item.candidateName}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{item.applyingPosition || 'General Application'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100/50">{item.tokenId}</span>
                              </td>
                              <td className="px-6 py-4">
                                {idx === 0
                                  ? <span className="px-3 py-1 bg-blue-600 text-white text-[8px] font-bold rounded-full uppercase tracking-widest">Next</span>
                                  : <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Queued</span>
                                }
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => setViewCandidate(item)}
                                  className="p-2 bg-white rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                  title="View candidate details"
                                >
                                  <Eye size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-4 space-y-8">
                <div className="bg-[#111] rounded-3xl p-8 text-slate-900 shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-base font-bold uppercase tracking-tighter">Your Metrics</h2>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-blue-100 group-hover:rotate-12 transition-transform">
                        <Zap size={20} className="text-primary-400" />
                      </div>
                    </div>
                    <div className="mb-8">
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Completed Interviews</p>
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-5xl font-bold tracking-tighter leading-none">{completedCount}</h3>
                        <div className="px-2 py-0.5 bg-blue-500/20 text-primary-400 rounded text-[9px] font-bold uppercase tracking-widest">Total</div>
                      </div>
                    </div>
                    <div className="space-y-4 pt-8 border-t border-blue-50">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Goal Progress</span>
                        <span className="text-primary-400 font-bold text-xs">{Math.min(100, Math.round((completedCount / 10) * 100))}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-3 overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (completedCount / 10) * 100)}%` }}
                          className="bg-gradient-to-r from-blue-500 to-primary-300 h-full rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-50 rounded-full blur-[100px]"></div>
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-50 rounded-full blur-[100px]"></div>
                </div>

                <div className="bg-white rounded-3xl border border-blue-100 p-8 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-6 uppercase tracking-tighter flex items-center gap-3">
                    <ShieldCheck size={18} className="text-blue-600" />
                    Interview Standards
                  </h3>
                  <ul className="space-y-6">
                    {[
                      { icon: Clock, text: "Target interview duration: 20Ã¢â‚¬â€œ30 minutes per candidate.", color: "text-amber-500", bg: "bg-amber-50" },
                      { icon: MessageSquare, text: "Provide objective feedback on technical and behavioral skills.", color: "text-blue-500", bg: "bg-blue-50" },
                      { icon: Star, text: "Maintain consistent ratings across all candidates.", color: "text-blue-500", bg: "bg-blue-50" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-start space-x-4 group">
                        <div className={`mt-0.5 p-2 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                          <item.icon size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 leading-snug">{item.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <MessageSquare size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tighter">Submit Feedback</h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[9px] mt-1">Token #{completedToken}</p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Mandatory Ã¢â‚¬â€ cannot be skipped</span>
                </div>
              </div>

              <form onSubmit={submitFeedback} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Outcome <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={feedback.result}
                      onChange={e => setFeedback({ ...feedback, result: e.target.value })}
                      className="w-full px-6 py-4 bg-white border border-blue-100 rounded-2xl font-bold text-xs focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Result</option>
                      <option value="SELECTED">Selected</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="NEXT_ROUND">Next Round</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Rating</label>
                    <div className="flex items-center justify-between bg-white p-3 rounded-2xl px-6">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} type="button" onClick={() => setFeedback({ ...feedback, rating: r })}
                          className={`p-1.5 transition-all hover:scale-110 ${feedback.rating >= r ? 'text-amber-400' : 'text-slate-800'}`}>
                          <Star size={20} fill={feedback.rating >= r ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Strengths</label>
                    <textarea rows={3} value={feedback.strengths} onChange={e => setFeedback({ ...feedback, strengths: e.target.value })}
                      placeholder="Technical skills, communication..."
                      className="w-full px-6 py-4 bg-white border border-blue-100 rounded-2xl font-bold text-xs focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Areas to Improve</label>
                    <textarea rows={3} value={feedback.improvements} onChange={e => setFeedback({ ...feedback, improvements: e.target.value })}
                      placeholder="Soft skills, tools..."
                      className="w-full px-6 py-4 bg-white border border-blue-100 rounded-2xl font-bold text-xs focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Remarks</label>
                  <textarea rows={3} value={feedback.comments} onChange={e => setFeedback({ ...feedback, comments: e.target.value })}
                    placeholder="Provide a brief summary of the interview..."
                    className="w-full px-6 py-4 bg-white border border-blue-100 rounded-2xl font-bold text-xs focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none" />
                </div>

                <button
                  type="submit"
                  disabled={fbLoading || !feedback.result}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                >
                  {fbLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Candidate Detail Modal */}
      <AnimatePresence>
        {viewCandidate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => setViewCandidate(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setViewCandidate(null)}
                className="absolute top-8 right-8 p-3 rounded-2xl text-slate-500 hover:bg-white transition-colors"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="flex items-center space-x-5 mb-8 pb-8 border-b border-blue-50">
                {viewCandidate.photoUrl ? (
                  <img
                    src={viewCandidate.photoUrl}
                    alt={viewCandidate.candidateName}
                    className="w-20 h-20 rounded-[2rem] object-cover border-4 border-blue-100 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-[2rem] bg-blue-600 text-white font-black text-3xl flex items-center justify-center shadow-2xl shadow-blue-600/20">
                    {(viewCandidate.candidateName || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-none">{viewCandidate.candidateName}</h2>
                  <div className="flex items-center mt-3 gap-2">
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                      {viewCandidate.status || 'WAITING'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">#{viewCandidate.tokenId}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-5">
                {[
                  { icon: Mail,          label: 'Email',            value: viewCandidate.candidateEmail },
                  { icon: Phone,         label: 'Mobile',           value: viewCandidate.candidateMobile },
                  { icon: Briefcase,     label: 'Position',         value: viewCandidate.applyingPosition },
                  { icon: MapPin,        label: 'Location',         value: viewCandidate.currentLocation },
                  { icon: ClipboardList, label: 'Purpose',          value: viewCandidate.purposeOfVisit },
                  { icon: GraduationCap, label: 'Qualification',    value: viewCandidate.qualification },
                  { icon: Calendar,      label: 'Year of Pass Out', value: viewCandidate.yearOfPassOut },
                  { icon: UserCheck,     label: 'Reference',        value: viewCandidate.reference },
                ].map((item, i) =>
                  item.value ? (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="p-2.5 bg-white rounded-xl text-slate-500">
                        <item.icon size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{item.label}</p>
                        <p className="text-base font-bold text-slate-900">{item.value}</p>
                      </div>
                    </div>
                  ) : null
                )}

                {/* Joined At */}
                {viewCandidate.candidateCreatedAt && (
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 bg-white rounded-xl text-slate-500">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Joined At</p>
                      <p className="text-base font-bold text-slate-900">
                        {new Date(viewCandidate.candidateCreatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Photo */}
                {viewCandidate.photoUrl && (
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 bg-white rounded-xl text-slate-500">
                      <Eye size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Photo</p>
                      <div className="flex gap-3 mt-1">
                        <a
                          href={viewCandidate.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-blue-600 hover:underline"
                        >
                          View Photo
                        </a>
                        <span className="text-slate-600">|</span>
                        <a
                          href={viewCandidate.photoUrl}
                          download={`${(viewCandidate.candidateName || 'candidate').replace(/\s+/g, '_')}_photo.jpg`}
                          className="text-sm font-bold text-blue-600 hover:underline"
                        >
                          Download JPG
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resume */}
                {viewCandidate.resumeUrl && (
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 bg-white rounded-xl text-slate-500">
                      <Paperclip size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resume</p>
                      <div className="flex gap-3 mt-1">
                        <a
                          href={viewCandidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-blue-600 hover:underline"
                        >
                          View PDF
                        </a>
                        <span className="text-slate-600">|</span>
                        <a
                          href={viewCandidate.resumeUrl}
                          download={`${(viewCandidate.candidateName || 'candidate').replace(/\s+/g, '_')}_resume.pdf`}
                          className="text-sm font-bold text-blue-600 hover:underline"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
