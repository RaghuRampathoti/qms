import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react'

const NOTIFICATION_TYPES = {
  success: {
    bg: 'bg-emerald-500',
    icon: CheckCircle,
    label: 'Success'
  },
  error: {
    bg: 'bg-red-500',
    icon: AlertTriangle,
    label: 'Error'
  },
  info: {
    bg: 'bg-blue-500',
    icon: Info,
    label: 'Note'
  }
}

export default function Notification({ type = 'success', message, onClose }) {
  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="fixed bottom-10 right-10 z-[1000] flex items-center"
    >
      <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-2 flex items-center min-w-[320px] max-w-md overflow-hidden">
        <div className={`${config.bg} p-4 rounded-[1.5rem] text-white flex-shrink-0 shadow-lg`}>
          <Icon size={24} />
        </div>
        <div className="px-6 py-2 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
            {config.label}
          </p>
          <p className="text-sm font-bold text-black leading-snug">
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-4 text-gray-300 hover:text-black transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  )
}
