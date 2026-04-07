import { useEffect, useState, useRef } from "react"
import { ShieldCheck, ArrowRightLeft, Activity, Siren, Lock, ActivitySquare } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  reqs: {
    label: "Global Hits",
    color: "hsl(var(--primary))",
  },
}

function App() {
  const [data, setData] = useState({})
  const [metrics, setMetrics] = useState({ total: 0, medium: 0, high: 0, blocked: 0 })
  const [chartData, setChartData] = useState([])
  
  const prevTotalRef = useRef(0)
  const isInitialLoad = useRef(true)

  const fetchData = async () => {
    try {
      const res = await fetch("/dashboard")
      const raw = await res.json()
      
      const ipData = {}
      let mMedium = 0
      let mHigh = 0
      let mBlocked = 0

      raw.forEach((item) => {
        const value = parseInt(item.value)
        const parts = item.key.split(":")
        if (parts.length < 4) return
        
        const type = parts[0]
        const ip = parts[3]

        if (!ipData[ip]) {
          ipData[ip] = { req: 0, endpoint: 0, risk: 0, penalty: 0 }
        }

        if (type === "req") ipData[ip].req = value
        if (type === "endpoint") ipData[ip].endpoint = value
        if (type === "risk") ipData[ip].risk = value
        if (type === "penalty") ipData[ip].penalty = value
      })

      const totalReq = Object.values(ipData).reduce((sum, user) => sum + user.req, 0)
      
      Object.keys(ipData).forEach(ip => {
        const user = ipData[ip]
        if (user.penalty > 0) mBlocked++
        else if (user.risk >= 50) mHigh++
        else if (user.risk >= 30) mMedium++
      })

      setData(ipData)
      setMetrics({ total: totalReq, medium: mMedium, high: mHigh, blocked: mBlocked })

      if (isInitialLoad.current) {
        prevTotalRef.current = totalReq
        isInitialLoad.current = false
        return
      }

      const delta = Math.max(0, totalReq - prevTotalRef.current)
      prevTotalRef.current = totalReq
      
      const now = new Date()
      const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`

      setChartData(prev => {
        const newData = [...prev, { time: timeString, reqs: delta }]
        if (newData.length > 30) newData.shift()
        return newData
      })

    } catch (error) {
      console.error("Dashboard fetch error:", error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dark min-h-screen text-foreground p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full"></div>
              <ShieldCheck className="relative h-14 w-14 text-blue-400 drop-shadow-xl" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">
                SAGE Dashboard
              </h1>
              <p className="text-slate-400 font-medium mt-1 tracking-wide">Next-Gen Real-Time API Gateway Security</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 backdrop-blur-xl px-4 py-2 rounded-full shadow-inner">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
            </span>
            <span className="text-sm font-semibold tracking-wider text-green-400 uppercase">Live Metrics</span>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 shadow-2xl hover:bg-slate-900/60 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-600 to-indigo-400"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-400 tracking-wider">NETWORK TRAFFIC</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent drop-shadow-sm">
                {metrics.total.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Total global requests captured</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 shadow-2xl hover:bg-slate-900/60 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 to-orange-400"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-400 tracking-wider">ELEVATED RISK</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                {metrics.medium.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Score 30-49: Rate Limited & Delayed</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 shadow-2xl hover:bg-slate-900/60 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-400 tracking-wider">CRITICAL THREATS</CardTitle>
              <div className="p-2 bg-red-500/10 rounded-lg relative">
                <Siren className="h-5 w-5 text-red-500 relative z-10" />
                {metrics.high > 0 && <span className="absolute inset-0 bg-red-500/30 blur-md rounded-full animate-pulse"></span>}
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent drop-shadow-sm">
                {metrics.high.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Score 50+: Danger Level</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 shadow-2xl hover:bg-slate-900/60 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-slate-600 to-zinc-400"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-400 tracking-wider">ACTIVELY BLOCKED</CardTitle>
              <div className="p-2 bg-slate-700/30 rounded-lg">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-slate-200 drop-shadow-sm">
                {metrics.blocked.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Penalized IPs (Gateway Drop)</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Network Graph Area */}
        <div className="mb-8 rounded-2xl border border-slate-800/80 bg-[#0B101E]/70 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
            <h3 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <ActivitySquare className="h-5 w-5 text-blue-400" /> Live Network Velocity
            </h3>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 font-mono tracking-widest text-xs px-3 rounded-full">
              DELTA (Δ)
            </Badge>
          </div>
          <div className="p-6 h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={(val) => val.split(":")[2]} 
                    stroke="#475569" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={20}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent indicator="line" />} 
                    cursor={{ stroke: 'rgba(59, 130, 246, 0.4)', strokeWidth: 2 }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="reqs"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReqs)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0B101E]/70 backdrop-blur-2xl text-card-foreground shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="px-8 py-6 border-b border-slate-800/80 bg-slate-900/40 hidden md:flex items-center justify-between relative z-10">
            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
               Targeted Traffic Profiles
            </h3>
          </div>

          <div className="p-0 relative z-10">
            <Table>
              <TableHeader className="bg-slate-950/60 border-b border-slate-800/80">
                <TableRow className="hover:bg-transparent border-transparent">
                  <TableHead className="w-[200px] text-slate-400 uppercase text-xs tracking-widest font-semibold text-center md:text-left py-5">IP Address</TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs tracking-widest font-semibold text-center py-5">Requests</TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs tracking-widest font-semibold text-center py-5">Endpoint Hits</TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs tracking-widest font-semibold text-center py-5">Risk Score</TableHead>
                  <TableHead className="text-slate-400 uppercase text-xs tracking-widest font-semibold text-center py-5">Penalty</TableHead>
                  <TableHead className="text-right text-slate-400 uppercase text-xs tracking-widest font-semibold py-5 px-6">Status Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(data).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 h-32 italic">System monitoring active. Awaiting traffic...</TableCell>
                  </TableRow>
                )}
                {Object.keys(data).map(ip => {
                  const user = data[ip]
                  let StatusBadge
                  let rowClasses = "border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                  
                  if (user.penalty > 0) {
                    StatusBadge = <Badge variant="secondary" className="bg-slate-900 text-slate-300 border border-slate-700 shadow-inner px-4 py-1.5 font-mono tracking-widest shadow-[0_0_10px_rgba(0,0,0,0.5)] rounded-full"><Lock className="h-3 w-3 mr-2 inline text-slate-500" /> BLOCKED</Badge>
                  } else if (user.risk >= 50) {
                    rowClasses = "border-red-900/30 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                    StatusBadge = <Badge variant="destructive" className="bg-gradient-to-r from-red-600 to-red-500 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] px-4 py-1.5 font-mono tracking-widest rounded-full"><Siren className="h-3 w-3 mr-2 animate-pulse inline"/> HIGH RISK</Badge>
                  } else if (user.risk >= 30) {
                    rowClasses = "border-orange-900/20 bg-orange-500/[0.02] hover:bg-orange-500/5 transition-colors"
                    StatusBadge = <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)] px-4 py-1.5 font-mono tracking-widest rounded-full"><Activity className="h-3 w-3 mr-2 inline"/> MEDIUM</Badge>
                  } else {
                    StatusBadge = <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 font-mono tracking-widest rounded-full"><ShieldCheck className="h-3 w-3 mr-2 inline"/> SECURE</Badge>
                  }

                  return (
                    <TableRow key={ip} className={rowClasses}>
                      <TableCell className="font-mono text-slate-300 text-center md:text-left px-6 py-4">{ip}</TableCell>
                      <TableCell className="text-center py-4"><span className="bg-slate-800/80 px-2 py-1 rounded text-slate-300">{user.req}</span></TableCell>
                      <TableCell className="text-center py-4"><span className="bg-slate-800/80 px-2 py-1 rounded text-slate-300">{user.endpoint}</span></TableCell>
                      <TableCell className="text-center py-4">
                        <span className={`font-bold ${user.risk >= 50 ? 'text-red-400' : user.risk >= 30 ? 'text-orange-400' : 'text-slate-300'}`}>
                          {user.risk}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-center py-4">{user.penalty > 0 ? `${user.penalty}s` : '-'}</TableCell>
                      <TableCell className="text-right px-6 py-4">{StatusBadge}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
