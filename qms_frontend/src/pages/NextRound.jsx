import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
    ArrowRight, Search, User, Briefcase, Mail, Phone,
    Calendar, Clock, MapPin, Star, MessageSquare,
    ChevronLeft, ChevronRight, Loader2, X, CheckCircle2,
    Send, FileText, AlertCircle
} from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

export default function NextRound() {
    const [feedbacks, setFeedbacks] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [scheduleModal, setScheduleModal] = useState(null) // holds feedback object
    const [form, setForm] = useState({ interviewDate: '', interviewTime: '', venue: '', additionalNote: '' })
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState(null)

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        fetchNextRound()
    }, [page])

    const fetchNextRound = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`/api/feedback/result/NEXT_ROUND?page=${page}&size=10`, {
                headers: getHeaders()
            })
            setFeedbacks(res.data.data.content)
            setTotalPages(res.data.data.totalPages)
        } catch (err) {
            showToast('error', 'Failed to load next round candidates')
        } finally {
            setLoading(false)
        }
    }

    const showToast = (type, text) => {
        setToast({ type, text })
        setTimeout(() => setToast(null), 4000)
    }

    const openScheduleModal = (feedback) => {
        setScheduleModal(feedback)
        setForm({ 
            interviewDate: feedback.nextRoundDate || '', 
            interviewTime: feedback.nextRoundTime || '', 
            venue: feedback.nextRoundVenue || '', 
            additionalNote: '' 
        })
    }

    const handleSchedule = async (e) => {
        e.preventDefault()
        if (!form.interviewDate || !form.interviewTime) {
            showToast('error', 'Please fill in date and time')
            return
        }
        setSubmitting(true)
        try {
            await axios.post('/api/feedback/schedule-next-round', {
                feedbackId: scheduleModal.id,
                interviewDate: form.interviewDate,
                interviewTime: form.interviewTime,
                venue: form.venue,
                additionalNote: form.additionalNote
            }, { headers: getHeaders() })
            showToast('success', `Email sent to ${scheduleModal.candidateName}!`)
            setScheduleModal(null)
            fetchNextRound()
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to schedule interview')
        } finally {
            setSubmitting(false)
        }
    }

    const filtered = feedbacks.filter(f =>
        f.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.applyingPosition || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex min-h-screen bg-white">
            <Sidebar />
            <main className="flex-1 lg:ml-56 flex flex-col">
                <Header
                    title="Next Round Candidates"
                    subtitle="Schedule second interviews for"
                    user={user}
                />

                <div className="flex-1 p-6 lg:p-8">
                    {/* Stats bar */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3">
                            <ArrowRight size={18} className="text-blue-600" />
                            <span className="text-sm font-bold text-blue-700">
                                {loading ? '…' : feedbacks.length} candidate{feedbacks.length !== 1 ? 's' : ''} awaiting next round
                            </span>
                        </div>
                        <div className="ml-auto relative w-full max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name, token, position…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-blue-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Toast */}
                    <AnimatePresence>
                        {toast && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
                                    toast.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                            >
                                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                {toast.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Content */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="font-medium">Loading candidates…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-blue-100 p-20 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ArrowRight size={28} className="text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No next round candidates</h3>
                            <p className="text-slate-400 text-sm">Candidates marked as Next Round by interviewers will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {filtered.map(f => (
                                <motion.div
                                    key={f.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                                            {/* Left: Candidate info */}
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                                    <User size={26} className="text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-bold text-slate-900">{f.candidateName}</h3>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-700 border border-blue-200">
                                                            NEXT ROUND
                                                        </span>
                                                        {f.nextRoundScheduled && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                SCHEDULED
                                                            </span>
                                                        )}
                                                        <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border">
                                                            {f.tokenId}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                                        {f.applyingPosition && (
                                                            <span className="flex items-center gap-1">
                                                                <Briefcase size={13} /> {f.applyingPosition}
                                                            </span>
                                                        )}
                                                        {f.candidateEmail && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail size={13} /> {f.candidateEmail}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <User size={13} /> Interviewed by <strong className="text-slate-700 ml-1">{f.interviewerName}</strong>
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={13} /> {new Date(f.submittedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Rating + Schedule button */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="flex items-center bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                                                    <Star size={15} className="text-amber-400 fill-amber-400 mr-1.5" />
                                                    <span className="text-amber-700 font-bold text-sm">{f.rating}/5</span>
                                                </div>
                                                <button
                                                    onClick={() => openScheduleModal(f)}
                                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                                                        f.nextRoundScheduled
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-emerald-600/10'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                                                    }`}
                                                >
                                                    <Calendar size={15} />
                                                    {f.nextRoundScheduled ? 'Reschedule' : 'Schedule Interview'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Feedback details */}
                                        <div className={`mt-6 grid grid-cols-1 gap-4 ${f.nextRoundScheduled ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
                                            <FeedbackBox
                                                icon={<CheckCircle2 size={12} className="text-emerald-500" />}
                                                label="Strengths"
                                                text={f.strengths}
                                                bg="bg-emerald-50/60"
                                                border="border-emerald-100"
                                            />
                                            <FeedbackBox
                                                icon={<Clock size={12} className="text-amber-500" />}
                                                label="Improvements"
                                                text={f.improvements}
                                                bg="bg-amber-50/60"
                                                border="border-amber-100"
                                            />
                                            <FeedbackBox
                                                icon={<MessageSquare size={12} className="text-blue-500" />}
                                                label="Comments"
                                                text={f.comments}
                                                bg="bg-white"
                                                border="border-blue-100"
                                            />
                                            {f.nextRoundScheduled && (
                                                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-blue-500" /> SCHEDULED FOR
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-700 leading-tight mb-1">
                                                        {f.nextRoundDate ? new Date(f.nextRoundDate).toLocaleDateString() : 'Date TBD'} at {f.nextRoundTime || 'Time TBD'}
                                                    </p>
                                                    {f.nextRoundVenue && (
                                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                                                            <MapPin size={10} /> {f.nextRoundVenue}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-sm text-slate-500">
                                        Page <span className="font-bold text-slate-900">{page + 1}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                                            className="p-2.5 bg-white border border-blue-100 rounded-xl text-slate-500 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
                                            className="p-2.5 bg-white border border-blue-100 rounded-xl text-slate-500 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Schedule Modal */}
            <AnimatePresence>
                {scheduleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                        onClick={e => e.target === e.currentTarget && setScheduleModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="h-1.5 bg-blue-600 w-full" />
                            <div className="p-7">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Schedule Next Round</h2>
                                        <p className="text-sm text-slate-500 mt-0.5">An email will be sent to the candidate</p>
                                    </div>
                                    <button onClick={() => setScheduleModal(null)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Candidate summary */}
                                <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <User size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{scheduleModal.candidateName}</p>
                                        <p className="text-xs text-slate-500">{scheduleModal.candidateEmail} · {scheduleModal.tokenId}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSchedule} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                Interview Date *
                                            </label>
                                            <div className="relative">
                                                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    required
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={form.interviewDate}
                                                    onChange={e => setForm(f => ({ ...f, interviewDate: e.target.value }))}
                                                    className="w-full pl-9 pr-3 py-3 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                Interview Time *
                                            </label>
                                            <div className="relative">
                                                <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    type="time"
                                                    required
                                                    value={form.interviewTime}
                                                    onChange={e => setForm(f => ({ ...f, interviewTime: e.target.value }))}
                                                    className="w-full pl-9 pr-3 py-3 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                            Venue / Location <span className="font-normal normal-case text-slate-400">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Conference Room B, 3rd Floor"
                                                value={form.venue}
                                                onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                                                className="w-full pl-9 pr-4 py-3 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                            Additional Note <span className="font-normal normal-case text-slate-400">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Any special instructions for the candidate…"
                                            value={form.additionalNote}
                                            onChange={e => setForm(f => ({ ...f, additionalNote: e.target.value }))}
                                            className="w-full px-4 py-3 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setScheduleModal(null)}
                                            className="flex-1 py-3.5 border border-blue-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={submitting}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20">
                                            {submitting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Send size={15} />
                                                    Send Schedule Email
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function FeedbackBox({ icon, label, text, bg, border }) {
    return (
        <div className={`${bg} border ${border} rounded-2xl p-4`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                {icon} {label}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">{text || `No ${label.toLowerCase()} noted.`}</p>
        </div>
    )
}
