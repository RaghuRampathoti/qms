import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Mail, Phone, MapPin, Briefcase,
    ClipboardList, CheckCircle2, ArrowRight,
    Hash, Clock, Users, Paperclip, X as XIcon,
    GraduationCap, Calendar, UserCheck, Image as ImageIcon
} from 'lucide-react'
import axios from 'axios'

const EMPTY = {
    fullName: '', mobileNumber: '', email: '',
    currentLocation: '', applyingPosition: '', purposeOfVisit: '',
    qualification: '', customQualification: '', yearOfPassOut: '', reference: ''
}

const QUALIFICATIONS = [
    'Post Graduate',
    'Graduate',
    'Diploma',
    'HSC / 12th',
    'SSC / 10th',
    'Other'
]

export default function CandidateRegisterPage() {
    const [step, setStep] = useState('form')
    const [form, setForm] = useState(EMPTY)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [resumeFile, setResumeFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)
    const photoInputRef = useRef(null)
    const resumeInputRef = useRef(null)

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const isJpg = file.type === 'image/jpeg' || file.type === 'image/jpg'
        const hasJpgExt = file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')
        if (!isJpg || !hasJpgExt) {
            setError('Only JPG/JPEG photo files are accepted.')
            e.target.value = ''
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Photo must be under 10 MB.')
            e.target.value = ''
            return
        }
        setError('')
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
            setError('Only PDF files are accepted for resume.')
            e.target.value = ''
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Resume must be under 10 MB.')
            e.target.value = ''
            return
        }
        setError('')
        setResumeFile(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/i;
        if (!emailRegex.test(form.email.trim())) {
            setError('Wrong email address or invalid address. Email must end with .com (e.g., gmail.com)');
            return;
        }

        setLoading(true)
        setError('')
        try {
            const fd = new FormData()
            fd.append('fullName', form.fullName.trim())
            fd.append('mobileNumber', form.mobileNumber.trim())
            fd.append('email', form.email.trim())
            if (form.currentLocation?.trim()) fd.append('currentLocation', form.currentLocation.trim())
            if (form.applyingPosition?.trim()) fd.append('applyingPosition', form.applyingPosition.trim())
            if (form.purposeOfVisit?.trim()) fd.append('purposeOfVisit', form.purposeOfVisit.trim())
            const finalQual = form.qualification === 'Other' ? form.customQualification?.trim() : form.qualification?.trim()
            if (finalQual) fd.append('qualification', finalQual)
            if (form.yearOfPassOut?.trim()) fd.append('yearOfPassOut', form.yearOfPassOut.trim())
            if (form.reference?.trim()) fd.append('reference', form.reference.trim())
            if (photoFile) fd.append('photo', photoFile)
            if (resumeFile) fd.append('resume', resumeFile)

            const res = await axios.post('/api/public/candidates/register', fd)
            setResult(res.data.data)
            setStep('success')
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-50 blur-[120px] opacity-60" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50 blur-[120px] opacity-40" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25 mb-4">
                        <Users size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Registration</h1>
                    <p className="text-slate-500 text-sm mt-1">Fill in your details to get a queue token</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-3xl border border-blue-100 shadow-2xl shadow-blue-900/5 overflow-hidden"
                        >
                            <div className="h-1.5 bg-blue-600 w-full" />

                            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Photo Upload */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                        Photo <span className="text-slate-600 font-normal normal-case">(optional JPG only)</span>
                                    </p>
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
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/30 shadow"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPhotoFile(null)
                                                        setPhotoPreview(null)
                                                        if (photoInputRef.current) photoInputRef.current.value = ''
                                                    }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                                                >
                                                    <XIcon size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 shrink-0 rounded-2xl bg-white border-2 border-dashed border-blue-100 flex items-center justify-center">
                                                <ImageIcon size={24} className="text-slate-600" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <button
                                                type="button"
                                                onClick={() => photoInputRef.current?.click()}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-100 rounded-xl text-sm text-slate-500 hover:border-primary-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                                            >
                                                <ImageIcon size={16} />
                                                <span>{photoFile ? 'Change Photo' : 'Upload Photo'}</span>
                                            </button>
                                            <p className="text-xs text-slate-600 mt-1 text-center">JPG format only Stored & viewed as JPG</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Required Fields */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Required Information</p>
                                    <div className="space-y-4">
                                        <Field icon={User} placeholder="Full Name" required value={form.fullName} onChange={set('fullName')} />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field icon={Phone} placeholder="Mobile Number" required type="tel" value={form.mobileNumber} onChange={set('mobileNumber')} pattern="^[6-9]\d{9}$" title="Enter valid 10-digit mobile number" />
                                            <Field icon={Mail} placeholder="Email Address" required type="email" value={form.email} onChange={set('email')} pattern="^[a-zA-Z0-9._%+\-]+@gmail\.com$" title="Please enter a valid @gmail.com address (e.g., name@gmail.com)" />
                                        </div>
                                    </div>
                                </div>

                                {/* Qualification */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                        Qualification
                                    </p>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                                            <select
                                                required
                                                value={form.qualification}
                                                onChange={set('qualification')}
                                                className="w-full pl-11 pr-4 py-3.5 border border-blue-100 rounded-xl text-sm bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                                            >
                                                <option value="">Select Qualification</option>
                                                {QUALIFICATIONS.map(q => (
                                                    <option key={q} value={q}>{q}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <AnimatePresence>
                                            {form.qualification === 'Other' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-4">
                                                        <Field icon={GraduationCap} placeholder="Please specify your qualification" required value={form.customQualification} onChange={set('customQualification')} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <Field icon={Calendar} placeholder="Year of Pass Out (e.g. 2022)" value={form.yearOfPassOut} onChange={set('yearOfPassOut')} required />
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                        Additional Details
                                    </p>
                                    <div className="space-y-4">
                                        <Field icon={MapPin} placeholder="Current Location" value={form.currentLocation} onChange={set('currentLocation')} required />
                                        <Field icon={Briefcase} placeholder="Applying For (Position)" value={form.applyingPosition} onChange={set('applyingPosition')} required />
                                        <Field icon={ClipboardList} placeholder="Purpose of Visit" value={form.purposeOfVisit} onChange={set('purposeOfVisit')} required />
                                        <Field icon={UserCheck} placeholder="Reference (optional)" value={form.reference} onChange={set('reference')} />

                                        {/* Resume Upload - PDF only */}
                                        <div>
                                            <input
                                                ref={resumeInputRef}
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                className="hidden"
                                                onChange={handleResumeChange}
                                            />
                                            {!resumeFile ? (
                                                <button
                                                    type="button"
                                                    onClick={() => resumeInputRef.current?.click()}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-blue-100 rounded-xl text-sm text-slate-500 hover:border-primary-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                                                >
                                                    <Paperclip size={16} />
                                                    <span>Upload Resume <span className="text-slate-600">(PDF only max 10 MB)</span></span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-between px-4 py-3.5 border border-blue-500/30 bg-blue-50 rounded-xl">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Paperclip size={16} className="text-blue-600 shrink-0" />
                                                        <span className="text-sm font-medium text-blue-800 truncate">{resumeFile.name}</span>
                                                        <span className="text-xs text-blue-500 shrink-0">({(resumeFile.size / 1024).toFixed(0)} KB)</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setResumeFile(null); if (resumeInputRef.current) resumeInputRef.current.value = '' }}
                                                        className="ml-2 p-1 rounded-full hover:bg-blue-100 text-blue-500 shrink-0"
                                                    >
                                                        <XIcon size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-600/25 hover:bg-blue-700 transition-all flex items-center justify-center space-x-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Get My Token</span>
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>

                                <p className="text-center text-xs text-slate-500">
                                    Your information is only used for today's interview scheduling
                                </p>
                            </form>
                        </motion.div>
                    )}

                    {step === 'success' && result && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl border border-blue-100 shadow-2xl shadow-blue-900/5 overflow-hidden"
                        >
                            <div className="h-1.5 bg-secondary-500 w-full" />
                            <div className="p-6 sm:p-10">
                                <div className="text-center mb-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                        className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100"
                                    >
                                        <CheckCircle2 size={36} className="text-secondary-500" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-slate-900">You're Registered!</h2>
                                    <p className="text-slate-500 text-sm mt-1">Please keep your token details handy</p>
                                </div>

                                <div className="bg-blue-600 rounded-2xl p-6 text-white text-center mb-6 shadow-xl shadow-blue-600/25 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-10">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="absolute rounded-full border border-white"
                                                style={{ width: 80 + i * 40, height: 80 + i * 40, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                                        ))}
                                    </div>
                                    <p className="text-blue-800 text-xs font-bold uppercase tracking-widest mb-2">Your Token</p>
                                    <p className="text-3xl font-black font-mono tracking-wider mb-1">{result.tokenId}</p>
                                    <p className="text-blue-800 text-xs">{result.status}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <StatCard icon={Hash} label="Queue #" value={`#${result.queueNumber}`} />
                                    <StatCard icon={Users} label="Ahead" value={result.candidatesAhead} />
                                    <StatCard icon={Clock} label="Est. Wait" value={`~${result.estimatedWaitMinutes}m`} />
                                </div>

                                <div className="bg-blue-50 rounded-2xl p-5 text-center mb-2 border border-blue-100">
                                    <p className="text-sm text-blue-800 font-bold leading-relaxed">
                                        You will receive an email notification when the interviewer calls you.
                                        Please ensure you are available near the assigned panel.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-center text-slate-600 mt-8 text-xs">
                    &copy; {new Date().getFullYear()} QMS Queue Management System
                </p>
            </motion.div>
        </div>
    )
}

function Field({ icon: Icon, placeholder, value, onChange, required, type = 'text', pattern, title }) {
    return (
        <div className="relative">
            <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
                type={type}
                required={required}
                value={value}
                onChange={onChange}
                placeholder={placeholder + (required ? ' *' : '')}
                pattern={pattern}
                title={title}
                className="w-full pl-11 pr-4 py-3.5 border border-blue-100 rounded-xl text-sm bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
        </div>
    )
}

function StatCard({ icon: Icon, label, value }) {
    return (
        <div className="bg-white rounded-2xl p-3 text-center border border-blue-100">
            <Icon size={16} className="text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    )
}
