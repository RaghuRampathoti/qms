import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  Search,
  Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    waiting: 0,
    inProgress: 0,
    completed: 0,
    averageInterviewMinutes: 0,
    selectedCount: 0,
    rejectedCount: 0,
    onHoldCount: 0,
    nextRoundCount: 0
  })
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }

        const [statsRes, queueRes] = await Promise.all([
          axios.get('/api/dashboard/stats', { headers }),
          axios.get('/api/candidates/queue', { headers })
        ])

        setStats(statsRes.data)
        setQueue(queueRes.data.data || [])
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    { label: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Currently Waiting', value: stats.waiting, icon: Clock, color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Interview', value: stats.inProgress, icon: TrendingUp, color: 'bg-teal-500', text: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Completed', value: stats.completed, icon: UserCheck, color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />

      <main className="flex-1 lg:ml-56 flex flex-col">
        <Header
          title="Management Hub"
          subtitle="System oversight for"
          user={user}
        />

        <div className="flex-1 p-4 lg:p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {statCards.map((card, idx) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                    <h3 className="text-2xl font-bold text-black mt-1">
                      {loading ? '...' : card.value}
                    </h3>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.bg} ${card.text}`}>
                    <card.icon size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-bold text-black">Live Queue State</h2>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{queue.length} Candidates Waiting</p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-300">Loading queue...</div>
              ) : queue.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={20} />
                  </div>
                  <p className="text-sm">No active candidates in the queue at the moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pos</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Token</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Applied For</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Wait Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {queue.map((item, idx) => (
                        <tr key={item.tokenId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-gray-100 text-gray-500'}`}>
                              {item.queueNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-black">{item.fullName}</p>
                            <p className="text-[10px] text-gray-400">{item.mobileNumber}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100/50">
                              {item.tokenId}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{item.applyingPosition}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {Math.max(0, (item.queueNumber - 1) * 20)} mins
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-teal-600 rounded-xl p-4 text-white shadow-lg shadow-teal-600/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-sm font-bold mb-1">Interview Efficiency</h2>
                  <p className="text-teal-100 text-[10px] mb-3">Average time per interview based on today's data.</p>

                  <div className="text-3xl font-bold mb-2">
                    {loading ? '...' : stats.averageInterviewMinutes} <span className="text-sm font-normal opacity-80">min</span>
                  </div>

                  <div className="w-full bg-teal-500/30 rounded-full h-1.5 mt-4 mb-1">
                    <div className="bg-white h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-teal-100">75% capacity utilized</p>
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <h2 className="text-lg font-bold text-black mb-4">Interview Outcomes</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Selected', value: stats.selectedCount, color: 'bg-emerald-500' },
                    { label: 'Rejected', value: stats.rejectedCount, color: 'bg-red-500' },
                    { label: 'On Hold', value: stats.onHoldCount, color: 'bg-amber-500' },
                    { label: 'Next Round', value: stats.nextRoundCount, color: 'bg-blue-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                        <span className="text-sm text-gray-600">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-black">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
