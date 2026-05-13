import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import axios from 'axios'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/auth/login', { username, password })
      const { token, role, userName } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify({ role, userName }))

      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        window.location.href = '/admin/dashboard'
      } else if (role === 'INTERVIEWER') {
        window.location.href = '/interviewer/dashboard'
      } else {
        setError('Access denied: Unauthorized role')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-blue-50 text-slate-900 font-sans overflow-hidden selection:bg-blue-600/30 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMzIsIDIyNywgMTc4LCAwLjE1KSIvPjwvc3ZnPg==')] opacity-50" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 p-8 sm:p-10 rounded-3xl bg-white border border-blue-100 shadow-xl shadow-blue-900/5"
      >
        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/30 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold tracking-tight text-slate-900 block mb-2">QMS Portal</span>
            <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2 overflow-hidden"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username or Email</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-blue-100 rounded-xl text-slate-900 placeholder:text-gray-500 focus:bg-blue-50 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-blue-100 rounded-xl text-slate-900 placeholder:text-gray-500 focus:bg-blue-50 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer hidden" />
                <div className="w-5 h-5 border border-blue-200 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <span className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">Remember me</span>
            </label>
            <button type="button" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors">
              Forgot password?
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-10">
          Protected by SecureLayer 2.0 &bull; &copy; 2026 QMS Systems
        </p>
      </motion.div>
    </div>
  )
}
