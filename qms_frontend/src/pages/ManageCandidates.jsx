import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
    Plus, Search, Download, QrCode, X, CheckCircle2, AlertCircle,
    User, Mail, Phone, MapPin, Briefcase, ClipboardList,
    ChevronLeft, ChevronRight, Eye, Trash2,
    Paperclip, GraduationCap, Calendar, UserCheck, Image as ImageIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const STATUS_STYLES = {
    WAITING: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-100',
        dot: 'bg-amber-400',
        label: 'Waiting'
    },
    CALLED: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-100',
        dot: 'bg-blue-400',
        label: 'Called'
    },
    IN_PROGRESS: {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-100',
        dot: 'bg-teal-500',
        label: 'In Interview'
    },
    COMPLETED: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-100',
        dot: 'bg-emerald-400',
        label: 'Completed'
    },
    CANCELLED: {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
        label: 'Cancelled'
    },
    NO_SHOW: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-100',
        dot: 'bg-red-400',
        label: 'No Show'
    },
}

const STATUS_FILTERS = ['ALL', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

const EMPTY_FORM = {
    fullName: '', mobileNumber: '', email: '',
    currentLocation: '', applyingPosition: '', purposeOfVisit: '',
    qualification: '', yearOfPassOut: '', reference: ''
}

const QUALIFICATIONS = [
    'Post Graduate', 'Graduate', 'Diploma', 'HSC / 12th', 'SSC / 10th', 'Other'
]

export default function ManageCandidates() {
    const [candidates, setCandidates] = useState([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [dateFilter, setDateFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showQrModal, setShowQrModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(null)
    const [formData, setFormData] = useState(EMPTY_FORM)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [resumeFile, setResumeFile] = useState(null)
    const photoInputRef = useRef(null)
    const resumeInputRef = useRef(null)
    const [formLoading, setFormLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [qrUrl, setQrUrl] = useState('')

    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchCandidates = useCallback(async () => {
        setLoading(true)
        try {
            let url = statusFilter === 'ALL'
                ? `/api/candidates?page=${page}&size=15`
                : `/api/candidates/status/${statusFilter}?page=${page}&size=15`
            if (dateFilter) {
                url += `&date=${dateFilter}`
            }
            const res = await axios.get(url, { headers })
            const d = res.data.data
            setCandidates(d.content)
            setTotalPages(d.totalPages)
            setTotalElements(d.totalElements)
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Failed to fetch candidates')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, dateFilter])

    useEffect(() => {
        fetchCandidates()
        const interval = setInterval(fetchCandidates, 10000)
        return () => clearInterval(interval)
    }, [fetchCandidates])

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL || ''
        setQrUrl(`${apiBase}/api/public/qr?t=${Date.now()}`)
    }, [])

    const showMsg = (type, text) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 4000)
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const isJpg = file.type === 'image/jpeg' || file.type === 'image/jpg'
        const hasJpgExt = file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')
        if (!isJpg || !hasJpgExt) {
            showMsg('error', 'Only JPG/JPEG photo files are accepted.')
            e.target.value = ''
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            showMsg('error', 'Photo must be under 10 MB.')
            e.target.value = ''
            return
        }
        setPhotoFile(file)
        const reader = new FileReader()
        reader.onload = (ev) => setPhotoPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const handleResumeChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const isPdf = file.type === 'application/pdf'
        const hasPdfExt = file.name.toLowerCase().endsWith('.pdf')
        if (!isPdf || !hasPdfExt) {
            showMsg('error', 'Only PDF files are accepted for resume.')
            e.target.value = ''
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            showMsg('error', 'Resume must be under 10 MB.')
            e.target.value = ''
            return
        }
        setResumeFile(file)
    }

    const handleAddCandidate = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        try {
            const fd = new FormData()
            fd.append('fullName', formData.fullName.trim())
            fd.append('mobileNumber', formData.mobileNumber.trim())
            fd.append('email', formData.email.trim())
            if (formData.currentLocation?.trim()) fd.append('currentLocation', formData.currentLocation.trim())
            if (formData.applyingPosition?.trim()) fd.append('applyingPosition', formData.applyingPosition.trim())
            if (formData.purposeOfVisit?.trim()) fd.append('purposeOfVisit', formData.purposeOfVisit.trim())
            if (formData.qualification?.trim()) fd.append('qualification', formData.qualification.trim())
            if (formData.yearOfPassOut?.trim()) fd.append('yearOfPassOut', formData.yearOfPassOut.trim())
            if (formData.reference?.trim()) fd.append('reference', formData.reference.trim())
            if (photoFile) fd.append('photo', photoFile)
            if (resumeFile) fd.append('resume', resumeFile)

            await axios.post('/api/candidates', fd, { headers })
            showMsg('success', `Candidate ${formData.fullName.trim()} added successfully`)
            setShowAddModal(false)
            setFormData(EMPTY_FORM)
            setPhotoFile(null)
            setPhotoPreview(null)
            setResumeFile(null)
            fetchCandidates()
        } catch (err) {
            const errorData = err.response?.data?.data
            const errorMsg = errorData
                ? Object.entries(errorData).map(([k, v]) => `${k}: ${v}`).join(', ')
                : (err.response?.data?.message || 'Failed to add candidate')
            showMsg('error', errorMsg)
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) return
        try {
            await axios.delete(`/api/candidates/${id}`, { headers })
            showMsg('success', `${name} removed`)
            fetchCandidates()
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Delete failed')
        }
    }

    const handleExport = async () => {
        try {
            let url = '/api/candidates/export/excel'
            const params = new URLSearchParams()
            if (statusFilter && statusFilter !== 'ALL') {
                params.append('status', statusFilter)
            }
            if (dateFilter) {
                params.append('date', dateFilter)
            }
            if (params.toString()) {
                url += `?${params.toString()}`
            }

            const res = await axios.get(url, {
                headers, responseType: 'blob'
            })
            const downloadUrl = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = `candidates_${new Date().toISOString().split('T')[0]}.xlsx`
            a.click()
            window.URL.revokeObjectURL(downloadUrl)
        } catch {
            showMsg('error', 'Export failed')
        }
    }

    const filtered = searchQuery
        ? candidates.filter(c =>
            c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.mobileNumber.includes(searchQuery) ||
            (c.tokenId || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : candidates

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            <Sidebar />

            <main className="flex-1 lg:ml-56 flex flex-col">
                <Header
                    title="Candidate Pool"
                    subtitle="Recruitment pipeline for"
                    user={user}
                />

                <div className="flex-1 p-4 lg:p-6">
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="fixed top-6 right-6 z-[200]"
                            >
                                <div className={`px-6 py-4 rounded-2xl flex items-center space-x-4 shadow-2xl border ${message.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    <span className="font-bold text-sm tracking-tight">{message.text}</span>
                                    <button onClick={() => setMessage(null)} className="hover:opacity-60 transition-opacity">
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col md:flex-row md:items-center justify-end gap-2 mb-4">
                        <button
                            onClick={() => setShowQrModal(true)}
                            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all group"
                            title="Registration QR"
                        >
                            <QrCode size={20} />
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-700 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all font-bold text-sm"
                        >
                            <Download size={18} />
                            <span>Export Data</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center space-x-2 bg-teal-600 px-4 py-2 rounded-xl text-white hover:bg-teal-700 transition-all font-bold text-sm shadow-lg shadow-teal-600/25 active:scale-95"
                        >
                            <Plus size={20} />
                            <span>New Candidate</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {[
                            { label: 'Total Applicants', value: totalElements, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Waitlist', value: candidates.filter(c => c.status === 'WAITING').length, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Live Interviews', value: candidates.filter(c => c.status === 'IN_PROGRESS').length, icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-50' },
                            { label: 'Completed', value: candidates.filter(c => c.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                                    <stat.icon size={16} />
                                </div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-xl font-black text-black mt-0.5">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                            <div className="flex flex-wrap gap-2">
                                {STATUS_FILTERS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setPage(0) }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${statusFilter === s
                                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-black'
                                            }`}
                                    >
                                        {s === 'ALL' ? 'ALL CANDIDATES' : STATUS_STYLES[s]?.label.toUpperCase() || s}
                                    </button>
                                ))}
                            </div>

                            <div className="flex w-full lg:w-auto gap-4">
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={e => { setDateFilter(e.target.value); setPage(0); }}
                                    className="px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium text-gray-500"
                                />
                                <div className="relative flex-1 lg:w-96 group">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, email, or token ID..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-50 bg-gray-50/30">
                                        <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate Information</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Token & Queue</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Applying For</th>
                                        <th className="px-5 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-8 py-6 flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                                                    <div className="space-y-2">
                                                        <div className="h-4 bg-gray-100 rounded w-32" />
                                                        <div className="h-3 bg-gray-50 rounded w-48" />
                                                    </div>
                                                </td>
                                                <td colSpan={4} className="px-6 py-6"><div className="h-4 bg-gray-50 rounded w-full" /></td>
                                            </tr>
                                        ))
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-32 text-center">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <User size={32} className="text-gray-200" />
                                                </div>
                                                <h3 className="text-xl font-bold text-black mb-1">No candidates match your criteria</h3>
                                                <p className="text-gray-400 text-sm">Try broadening your search or adding a new candidate.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((c, idx) => {
                                            const style = STATUS_STYLES[c.status] || STATUS_STYLES.WAITING
                                            return (
                                                <motion.tr
                                                    key={c.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-gray-50/50 transition-colors group"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="relative">
                                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow">
                                                                    {c.fullName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${style.dot}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-black text-sm">{c.fullName}</p>
                                                                <div className="flex items-center text-gray-400 text-xs mt-0.5 space-x-3">
                                                                    <span className="flex items-center"><Mail size={12} className="mr-1.5" /> {c.email}</span>
                                                                    <span className="flex items-center"><Phone size={12} className="mr-1.5" /> {c.mobileNumber}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="space-y-1">
                                                            <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100/50">
                                                                {c.tokenId || 'NO TOKEN'}
                                                            </span>
                                                            {c.status === 'COMPLETED' ? (
                                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter pl-1 space-y-0.5">
                                                                    <p>Start: <span className="text-teal-700 font-black">{c.interviewStartTime ? new Date(c.interviewStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span></p>
                                                                    <p>End: <span className="text-emerald-700 font-black">{c.interviewEndTime ? new Date(c.interviewEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span></p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter pl-1">
                                                                    Queue Position: <span className="text-black font-black">{c.queueNumber != null ? `#${c.queueNumber}` : 'NA'}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${style.bg} ${style.text} ${style.border}`}>
                                                            {style.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center text-gray-600 font-bold text-sm">
                                                            <Briefcase size={14} className="mr-2 text-gray-400" />
                                                            {c.applyingPosition || 'General Visit'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => setShowDetailModal(c)}
                                                                className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all border border-transparent hover:border-teal-100"
                                                                title="Quick View"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(c.id, c.fullName)}
                                                                className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    Page <span className="text-black">{page + 1}</span> of {totalPages} · <span className="text-black">{totalElements}</span> Candidates
                                </p>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-500 hover:text-teal-600 hover:border-teal-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-500 hover:text-teal-600 hover:border-teal-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ModalWrapper isOpen={showQrModal} onClose={() => setShowQrModal(false)}>
                <div className="text-center">
                    <div className="w-16 h-16 bg-teal-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <QrCode size={32} className="text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-black text-black mb-2 tracking-tight">Registration Access</h2>
                    <p className="text-gray-500 text-sm mb-8 font-medium">Share this code with candidates to allow self-registration.</p>

                    <div className="bg-white p-6 rounded-[2.5rem] inline-block mb-8 shadow-inner border border-gray-100">
                        <img src={qrUrl} alt="QR" className="w-64 h-64 rounded-3xl" />
                    </div>

                    <div className="flex gap-4">
                        <a href={qrUrl} download className="flex-1 bg-teal-600 text-white py-4 rounded-[1.25rem] font-black text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">Download QR</a>
                        <button onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/register`);
                            showMsg('success', 'Link copied to clipboard!');
                        }} className="flex-1 bg-gray-50 text-gray-700 py-4 rounded-[1.25rem] font-black text-sm hover:bg-gray-100 transition-all border border-gray-100">Copy Link</button>
                    </div>
                </div>
            </ModalWrapper>

            <ModalWrapper isOpen={showAddModal} onClose={() => { setShowAddModal(false); setResumeFile(null); setPhotoFile(null); setPhotoPreview(null) }} size="max-w-xl">
                <h2 className="text-3xl font-black text-black mb-2 tracking-tight">Add Candidate</h2>
                <p className="text-gray-500 text-sm mb-8 font-medium">Manually register a candidate into the interview queue.</p>
                <form onSubmit={handleAddCandidate} className="space-y-5">

                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Photo <span className="text-gray-300 font-normal normal-case">(optional)</span>
                            </label>
                            <span className="text-[9px] font-bold text-teal-600/60 uppercase">JPG only · max 10 MB</span>
                        </div>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept=".jpg,.jpeg,image/jpeg"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                        <div className="flex items-center gap-4">
                            {photoPreview ? (
                                <div className="relative shrink-0">
                                    <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2 border-teal-200" />
                                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (photoInputRef.current) photoInputRef.current.value = '' }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-16 h-16 shrink-0 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                    <ImageIcon size={20} className="text-gray-300" />
                                </div>
                            )}
                            <button type="button" onClick={() => photoInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border border-transparent rounded-[1.25rem] text-sm font-bold text-gray-400 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-all">
                                <ImageIcon size={16} />
                                <span>{photoFile ? 'Change Photo' : 'Upload Photo (JPG)'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField icon={User} label="FULL NAME" required value={formData.fullName} onChange={v => setFormData(f => ({ ...f, fullName: v }))} placeholder="Rahul Sharma" />
                        <FormField icon={Mail} label="EMAIL ADDRESS" required type="email" value={formData.email} onChange={v => setFormData(f => ({ ...f, email: v }))} placeholder="rahul@example.com" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField icon={Phone} label="MOBILE NUMBER" required type="tel" value={formData.mobileNumber} onChange={v => setFormData(f => ({ ...f, mobileNumber: v }))} placeholder="9876543210" hint="10-digit number" />
                        <FormField icon={Briefcase} label="APPLYING POSITION" value={formData.applyingPosition} onChange={v => setFormData(f => ({ ...f, applyingPosition: v }))} placeholder="Senior Frontend Dev" />
                    </div>

                    {/* Qualification fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qualification</label>
                            <div className="relative group">
                                <GraduationCap size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                <select value={formData.qualification} onChange={e => setFormData(f => ({ ...f, qualification: e.target.value }))} className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all appearance-none">
                                    <option value="">Select Qualification</option>
                                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                            </div>
                        </div>
                        <FormField icon={Calendar} label="YEAR OF PASS OUT" value={formData.yearOfPassOut} onChange={v => setFormData(f => ({ ...f, yearOfPassOut: v }))} placeholder="e.g. 2022" />
                    </div>

                    <FormField icon={MapPin} label="CURRENT LOCATION" value={formData.currentLocation} onChange={v => setFormData(f => ({ ...f, currentLocation: v }))} placeholder="Bengaluru, KA" />
                    <FormField icon={ClipboardList} label="PURPOSE OF VISIT" value={formData.purposeOfVisit} onChange={v => setFormData(f => ({ ...f, purposeOfVisit: v }))} placeholder="Technical Interview - Round 1" />
                    <FormField icon={UserCheck} label="REFERENCE" value={formData.reference} onChange={v => setFormData(f => ({ ...f, reference: v }))} placeholder="Referred by (if any)" />

                    {/* Resume Upload - PDF only */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Resume <span className="text-gray-300 font-normal normal-case">(optional)</span>
                            </label>
                            <span className="text-[9px] font-bold text-teal-600/60 uppercase">PDF only · max 10 MB</span>
                        </div>
                        <input ref={resumeInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleResumeChange} />
                        {!resumeFile ? (
                            <button type="button" onClick={() => resumeInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] text-sm font-bold text-gray-400 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-all">
                                <Paperclip size={18} />
                                <span>Click to attach PDF resume</span>
                            </button>
                        ) : (
                            <div className="flex items-center justify-between px-6 py-4 bg-teal-50 border border-teal-200 rounded-[1.25rem]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Paperclip size={18} className="text-teal-600 shrink-0" />
                                    <span className="text-sm font-bold text-teal-800 truncate">{resumeFile.name}</span>
                                    <span className="text-xs text-teal-500 shrink-0">({(resumeFile.size / 1024).toFixed(0)} KB)</span>
                                </div>
                                <button type="button" onClick={() => { setResumeFile(null); if (resumeInputRef.current) resumeInputRef.current.value = '' }} className="ml-3 p-1.5 rounded-xl hover:bg-teal-100 text-teal-500 shrink-0">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={formLoading} className="w-full bg-teal-600 text-white py-5 rounded-3xl font-black hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 mt-4 active:scale-95 disabled:opacity-60">
                        {formLoading ? 'PROCESSING...' : 'REGISTER CANDIDATE'}
                    </button>
                </form>
            </ModalWrapper>

            <ModalWrapper isOpen={!!showDetailModal} onClose={() => setShowDetailModal(null)}>
                {showDetailModal && (
                    <>
                        <div className="flex items-center space-x-5 mb-10 pb-10 border-b border-gray-50">
                            {showDetailModal.photoUrl ? (
                                <img
                                    src={showDetailModal.photoUrl}
                                    alt={showDetailModal.fullName}
                                    className="w-20 h-20 rounded-[2rem] object-cover border-4 border-teal-100 shadow-xl"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-[2rem] bg-teal-600 text-white font-black text-3xl flex items-center justify-center shadow-2xl shadow-teal-600/20">
                                    {showDetailModal.fullName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h2 className="text-3xl font-black text-black leading-none">{showDetailModal.fullName}</h2>
                                <div className="flex items-center mt-3">
                                    <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[showDetailModal.status].bg} ${STATUS_STYLES[showDetailModal.status].text} ${STATUS_STYLES[showDetailModal.status].border}`}>
                                        {STATUS_STYLES[showDetailModal.status].label}
                                    </span>
                                    <span className="ml-3 font-mono text-sm font-bold text-gray-400">#{showDetailModal.tokenId}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { icon: Mail, label: 'Email', value: showDetailModal.email },
                                { icon: Phone, label: 'Mobile', value: showDetailModal.mobileNumber },
                                { icon: Briefcase, label: 'Position', value: showDetailModal.applyingPosition },
                                { icon: MapPin, label: 'Location', value: showDetailModal.currentLocation },
                                { icon: ClipboardList, label: 'Purpose', value: showDetailModal.purposeOfVisit },
                                { icon: GraduationCap, label: 'Qualification', value: showDetailModal.qualification },
                                { icon: Calendar, label: 'Year of Pass Out', value: showDetailModal.yearOfPassOut },
                                { icon: UserCheck, label: 'Reference', value: showDetailModal.reference },
                                { icon: Plus, label: 'Joined At', value: new Date(showDetailModal.createdAt).toLocaleString() },
                            ].map((item, i) => (
                                item.value ? (
                                    <div key={i} className="flex items-start space-x-4">
                                        <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400">
                                            <item.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                            <p className="text-base font-bold text-black">{item.value || 'N/A'}</p>
                                        </div>
                                    </div>
                                ) : null
                            ))}

                            {/* Photo Download */}
                            {showDetailModal.photoUrl && (
                                <div className="flex items-start space-x-4">
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400">
                                        <ImageIcon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Photo</p>
                                        <div className="flex gap-3 mt-1">
                                            <a
                                                href={showDetailModal.photoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-teal-600 hover:underline"
                                            >
                                                View Photo
                                            </a>
                                            <span className="text-gray-300">|</span>
                                            <a
                                                href={showDetailModal.photoUrl}
                                                download={`${showDetailModal.fullName.replace(/\s+/g, '_')}_photo.jpg`}
                                                className="text-sm font-bold text-teal-600 hover:underline"
                                            >
                                                Download JPG
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Resume Download */}
                            {showDetailModal.resumeUrl && (
                                <div className="flex items-start space-x-4">
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400">
                                        <Paperclip size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Resume</p>
                                        <div className="flex gap-3 mt-1">
                                            <a
                                                href={showDetailModal.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-teal-600 hover:underline"
                                            >
                                                View PDF
                                            </a>
                                            <span className="text-gray-300">|</span>
                                            <a
                                                href={showDetailModal.resumeUrl}
                                                download={`${showDetailModal.fullName.replace(/\s+/g, '_')}_resume.pdf`}
                                                className="text-sm font-bold text-teal-600 hover:underline"
                                            >
                                                Download PDF
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </ModalWrapper>
        </div>
    )
}

function ModalWrapper({ isOpen, onClose, children, size = "max-w-md" }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className={`bg-white w-full ${size} rounded-[3rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                        <button onClick={onClose} className="absolute top-8 right-8 p-3 rounded-2xl text-gray-400 hover:bg-gray-50 transition-colors"><X size={20} /></button>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

function FormField({ icon: Icon, label, value, onChange, placeholder, required, type = 'text', hint }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {hint && <span className="text-[9px] font-bold text-teal-600/60 uppercase">{hint}</span>}
            </div>
            <div className="relative group">
                <Icon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                <input
                    type={type}
                    required={required}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all"
                />
            </div>
        </div>
    )
}