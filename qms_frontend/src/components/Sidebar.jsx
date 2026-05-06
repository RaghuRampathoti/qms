import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  LogOut,
  ShieldCheck,
  MessageSquare,
  MapPin,
  Menu,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const adminItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Manage Candidates', path: '/admin/candidates' },
  { icon: MapPin, label: 'Cabins', path: '/admin/cabins' },
  { icon: Users, label: 'Manage Users', path: '/admin/users' },
  { icon: MessageSquare, label: 'Feedback', path: '/admin/feedback' },
]

const interviewerItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/interviewer/dashboard' },
  { icon: MessageSquare, label: 'My Feedbacks', path: '/interviewer/feedback' },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const role = user.role || 'ADMIN'

  const menuItems = role === 'ADMIN' ? adminItems : interviewerItems
  const brandName = role === 'ADMIN' ? 'QMS Admin' : 'QMS Interviewer'

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <>
      <div className="lg:hidden fixed top-3 left-3 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white border border-gray-100 rounded-xl shadow-xl text-teal-600 active:scale-95 transition-all"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`
        w-56 h-screen bg-teal-600 flex flex-col fixed left-0 top-0 z-50 
        transition-transform duration-300 ease-in-out border-r border-teal-700
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        <div className="px-4 py-4 flex items-center space-x-2.5 border-b border-teal-700/50">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-teal-600 shadow-lg shadow-black/10 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <span className="text-base font-black text-black tracking-tighter">{brandName}</span>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-white text-teal-600 shadow-md shadow-black/10'
                  : 'text-black hover:bg-teal-500/30'
                  }`}
              >
                <item.icon size={17} className={isActive ? 'text-teal-600' : 'text-black group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-[13px] tracking-tight">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-600"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-teal-500/50">
          <div className="flex items-center space-x-2.5 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-black font-black border border-white/10 text-sm shrink-0">
              {user.userName?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-black truncate leading-tight">{user.userName}</p>
              <p className="text-[10px] text-black/60 font-bold uppercase tracking-widest">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-black hover:bg-red-500 hover:text-white transition-all duration-200 font-bold text-[13px] group"
          >
            <LogOut size={17} className="group-hover:rotate-12 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
