import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  MessageSquare, Search, Filter, Calendar, Star, 
  User, Briefcase, CheckCircle, Clock, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

const RESULT_COLORS = {
  SELECTED: 'bg-secondary-100 text-emerald-700 border-secondary-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  ON_HOLD: 'bg-amber-100 text-amber-700 border-amber-200',
  NEXT_ROUND: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedResult, setSelectedResult] = useState('ALL')

  useEffect(() => {
    fetchFeedbacks()
    const interval = setInterval(fetchFeedbacks, 10000)
    return () => clearInterval(interval)
  }, [page, selectedResult])

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const url = selectedResult === 'ALL' 
        ? `/api/feedback?page=${page}&size=10` 
        : `/api/feedback/result/${selectedResult}?page=${page}&size=10`
      
      const res = await axios.get(url, { headers: getHeaders() })
      setFeedbacks(res.data.data.content)
      setTotalPages(res.data.data.totalPages)
    } catch (err) {
      console.error('Failed to fetch feedback', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredFeedbacks = feedbacks.filter(f => 
    f.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.interviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.tokenId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 lg:ml-56 flex flex-col">
        <Header 
          title="Interview Feedbacks" 
          subtitle="System evaluations for" 
          user={user} 
        />

        <div className="flex-1 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="bg-white border border-blue-100 rounded-2xl p-1 flex items-center shadow-sm">
              {['ALL', 'SELECTED', 'REJECTED', 'ON_HOLD', 'NEXT_ROUND'].map(r => (
                <button
                  key={r}
                  onClick={() => { setSelectedResult(r); setPage(0); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedResult === r 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'text-slate-500 hover:text-white hover:bg-white'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by candidate, interviewer, or token ID..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-blue-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-slate-500 font-medium">Loading feedback data...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-blue-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No feedback found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your filters or search term to find what you're looking for.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {filteredFeedbacks.map((f) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={f.id}
                  className="bg-white rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex items-start space-x-5">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <User size={28} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-xl font-bold text-slate-900">{f.candidateName}</h3>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border bg-white text-slate-500">
                              {f.tokenId}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500">
                            <span className="flex items-center"><Briefcase size={14} className="mr-1.5" /> {f.applyingPosition}</span>
                            <span className="flex items-center"><User size={14} className="mr-1.5" /> Interviewer: <span className="font-semibold text-slate-900 ml-1">{f.interviewerName}</span></span>
                            <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> {new Date(f.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${RESULT_COLORS[f.result]}`}>
                          {f.result.replace('_', ' ')}
                        </div>
                        <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-lg">
                          <Star size={16} className="text-amber-400 fill-amber-400 mr-1.5" />
                          <span className="text-amber-700 font-bold">{f.rating}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                            <CheckCircle size={12} className="mr-1.5 text-secondary-500" /> Strengths
                          </p>
                          <p className="text-sm text-slate-600 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 min-h-[60px]">
                            {f.strengths || 'No strengths noted.'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                            <Clock size={12} className="mr-1.5 text-amber-500" /> Improvements
                          </p>
                          <p className="text-sm text-slate-600 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 min-h-[60px]">
                            {f.improvements || 'No improvements noted.'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                          <MessageSquare size={12} className="mr-1.5 text-blue-500" /> Interviewer Comments
                        </p>
                        <p className="text-sm text-slate-600 bg-white p-4 rounded-2xl border border-blue-100 min-h-[140px] whitespace-pre-wrap">
                          {f.comments || 'No additional comments provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-500">
                Showing page <span className="font-bold text-slate-900">{page + 1}</span> of <span className="font-bold text-slate-900">{totalPages || 1}</span>
              </p>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2.5 bg-white border border-blue-100 rounded-xl text-slate-500 hover:text-slate-900 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2.5 bg-white border border-blue-100 rounded-xl text-slate-500 hover:text-slate-900 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}
