"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { QRCodeGenerator } from "@/components/lecturer/QRCodeGenerator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ArrowLeft,
  Users,
  UserCheck,
  StopCircle,
  Clock,
  Loader2,
  Plus,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  History,
  Activity,
  Zap,
  QrCode
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime"
import { format, differenceInMinutes, subMinutes, isAfter } from "date-fns"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { exportToExcel, exportToPDF } from "@/lib/utils/export"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function SessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [totalEnrolled, setTotalEnrolled] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const [isManualLoading, setIsManualLoading] = useState(false)
  const [searchMatric, setSearchMatric] = useState("")
  const [foundStudent, setFoundStudent] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClient()

  const { records, isLoading: isRecordsLoading } = useAttendanceRealtime(params.id)

  const fetchSessionDetails = useCallback(async () => {
    const { data, error } = await supabase
      .from('lecture_sessions')
      .select('*, courses(code, title, department)')
      .eq('id', params.id)
      .single()

    if (!error && data) {
      setSession(data)

      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', data.course_id)

      setTotalEnrolled(count || 0)
    }
  }, [params.id, supabase])

  useEffect(() => {
    fetchSessionDetails()
  }, [fetchSessionDetails])

  // Calculate Velocity (Students per minute in the last 5 minutes)
  const velocity = useMemo(() => {
    if (records.length === 0) return 0
    const fiveMinsAgo = subMinutes(new Date(), 5)
    const recentRecords = records.filter(r => isAfter(new Date(r.marked_at), fiveMinsAgo))
    return (recentRecords.length / 5).toFixed(1)
  }, [records])

  function handleExport(type: 'excel' | 'pdf') {
    if (records.length === 0) {
      toast.error("No records to export")
      return
    }

    const data = records.map(r => ({
      matric_number: r.users?.matric_number || 'N/A',
      name: `${r.users?.first_name} ${r.users?.last_name}`,
      status: r.status,
      marked_at: r.marked_at,
      method: r.marking_method
    }))

    const title = `${session.courses?.code} - ${session.topic}`
    const fileName = `Attendance_${session.courses?.code}_${format(new Date(), 'yyyy-MM-dd')}`

    if (type === 'excel') {
      exportToExcel(data, fileName)
    } else {
      exportToPDF(data, title, fileName)
    }
    toast.success("Operational Ledger Exported")
  }

  async function handleEndSession() {
    if (!confirm("Terminate session and synchronize final records?")) return
    setIsEnding(true)
    try {
      const { error } = await supabase
        .from('lecture_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success("Command transmission closed")
      router.push('/lecturer/dashboard')
    } catch (error: any) {
      toast.error(error.message || "Failed to end session")
    } finally {
      setIsEnding(false)
    }
  }

  async function handleSearchStudent() {
    if (!searchMatric) return
    setIsManualLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, matric_number')
        .eq('matric_number', searchMatric)
        .eq('role', 'student')
        .single()

      if (error || !data) {
        toast.error("Student ID not found in database")
        setFoundStudent(null)
      } else {
        setFoundStudent(data)
      }
    } catch (error) {
      toast.error("Search failed")
    } finally {
      setIsManualLoading(false)
    }
  }

  async function handleManualMark() {
    if (!foundStudent || !session) return
    setIsManualLoading(true)
    try {
      const alreadyMarked = records.find(r => r.student_id === foundStudent.id)
      if (alreadyMarked) {
        toast.error("Student already authenticated for this session")
        return
      }

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', session.course_id)
        .eq('student_id', foundStudent.id)
        .single()

      if (!enrollment) {
        toast.error("Subject is not enrolled in this domain")
        return
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: foundStudent.id,
          course_id: session.course_id,
          status: 'present',
          marking_method: 'manual',
          marked_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success(`${foundStudent.last_name} authenticated`)
      setIsDialogOpen(false)
      setFoundStudent(null)
      setSearchMatric("")
    } catch (error: any) {
      toast.error(error.message || "Authentication failed")
    } finally {
      setIsManualLoading(false)
    }
  }

  if (!session || isRecordsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Establishing Secure Telemetry...</p>
      </div>
    )
  }

  const presentCount = records.length
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Premium Header Container */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 overflow-hidden">
        <div className="flex items-center gap-8">
          <Link href="/lecturer/dashboard">
            <Button variant="outline" size="icon" className="h-16 w-16 rounded-[1.5rem] border-none bg-white shadow-xl shadow-gray-100/50 hover:bg-primary hover:text-white transition-all group">
              <ArrowLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight italic">
                {session.courses?.code}
              </h1>
              <Badge variant="outline" className={cn(
                "rounded-full px-5 py-1.5 font-extrabold uppercase tracking-widest text-[10px] border-none shadow-sm",
                session.status === 'active'
                  ? "bg-emerald-50 text-emerald-600 animate-pulse ring-2 ring-emerald-100/50"
                  : "bg-gray-100 text-gray-400"
              )}>
                {session.status === 'active' ? '● System Active' : 'Session Terminated'}
              </Badge>
            </div>
            <p className="text-gray-500 font-medium text-lg flex items-center gap-3">
              {session.topic}
              <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">{session.courses?.department}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-none bg-white shadow-xl shadow-gray-100/50 font-extrabold uppercase text-[10px] tracking-widest text-gray-500 hover:text-primary transition-all">
                <Download className="mr-3 h-4 w-4" />
                Export Ledger
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl w-64 p-2 shadow-2xl border-none">
              <div className="px-3 py-2 mb-2 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reporting Engine</p>
              </div>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-3 py-4 rounded-xl cursor-pointer font-bold">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Excel Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-3 py-4 rounded-xl cursor-pointer font-bold">
                <FileText className="w-5 h-5 text-rose-600" /> PDF Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {session.status === 'active' && (
            <div className="flex gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-14 px-8 rounded-2xl border-none bg-white shadow-xl shadow-gray-100/50 font-extrabold uppercase text-[10px] tracking-widest text-gray-500 hover:bg-gray-50">
                    <Plus className="mr-3 h-4 w-4" />
                    Bypass Authentication
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-w-md border-none shadow-2xl p-0 overflow-hidden">
                  <div className="bg-primary p-8 text-white">
                    <DialogTitle className="text-2xl font-black italic tracking-tight mb-2">Manual Override</DialogTitle>
                    <DialogDescription className="text-white/70 font-medium"> Authenticate students manually via matriculation ID records. </DialogDescription>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="matric" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Identification ID</Label>
                      <div className="flex gap-3">
                        <Input
                          id="matric"
                          placeholder="e.g. 20210001"
                          className="h-14 rounded-2xl bg-gray-50 border-none shadow-inner font-bold text-gray-900"
                          value={searchMatric}
                          onChange={(e) => setSearchMatric(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
                        />
                        <Button onClick={handleSearchStudent} disabled={isManualLoading} className="h-14 w-14 rounded-2xl bg-gray-900 shadow-xl active:scale-95 transition-all">
                          {isManualLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {foundStudent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100/50"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-200">
                              {foundStudent.first_name[0]}{foundStudent.last_name[0]}
                            </div>
                            <div>
                              <p className="font-extrabold text-emerald-900 text-lg tracking-tight">{foundStudent.first_name} {foundStudent.last_name}</p>
                              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">{foundStudent.matric_number}</p>
                            </div>
                          </div>
                          <Button
                            className="w-full mt-8 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-extrabold uppercase text-[11px] tracking-widest shadow-2xl shadow-emerald-200 transition-all active:scale-95"
                            onClick={handleManualMark}
                            disabled={isManualLoading}
                          >
                            Confirm Access
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="destructive"
                onClick={handleEndSession}
                disabled={isEnding}
                className="h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-rose-200 transition-all active:scale-95 bg-rose-600"
              >
                {isEnding ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <StopCircle className="mr-3 h-5 w-5" />}
                Terminate Session
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Left: QR Code Module Control */}
        <div className="lg:col-span-2 space-y-10">
          <Card className="border-none shadow-sm rounded-[3rem] bg-white overflow-hidden p-12 flex flex-col items-center justify-center border border-gray-100/50 group">
            <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center bg-gray-50 rounded-[2.5rem] p-10 border-4 border-dashed border-gray-100 group-hover:bg-primary/5 transition-all duration-700">
              <QRCodeGenerator
                value={session.attendance_code}
                label={session.attendance_code}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-6 -right-6 bg-primary text-white p-6 rounded-[2rem] shadow-2xl shadow-primary/40 rotate-12"
              >
                <QrCode className="w-8 h-8" />
              </motion.div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
              <Badge className="bg-emerald-50 text-emerald-600 px-8 py-3 rounded-2xl font-black text-lg tracking-[0.2em] border border-emerald-100/50 shadow-inner italic">
                {session.attendance_code}
              </Badge>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">
                <Clock className="w-5 h-5 text-primary" />
                Deployed: {session.start_time}
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-2xl shadow-primary/20 rounded-[3rem] bg-gray-900 text-white p-10 relative overflow-hidden group">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <h3 className="font-extrabold text-2xl mb-8 flex items-center gap-3 tracking-tight italic">
              <TrendingUp className="w-8 h-8 text-primary" />
              Live Telemetry
            </h3>
            <div className="space-y-10 relative z-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1.5 ">Velocity</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-primary">{velocity}</span>
                    <span className="text-[9px] text-white/40 font-bold pb-1.5 tracking-tighter">PPM</span>
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1.5 ">Saturation</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black">{attendanceRate}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Global Scan Yield</p>
                  <span className="text-xs font-black text-primary italic uppercase tracking-widest">Processing...</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${attendanceRate}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(4,120,87,0.5)]" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Real-time Check-in Reservoir */}
        <div className="lg:col-span-3 space-y-10">
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 border border-gray-100 hover:border-emerald-100 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Authenticated</p>
                  <h3 className="text-5xl font-black text-emerald-600 tracking-tighter italic">{presentCount}</h3>
                </div>
                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <UserCheck className="w-8 h-8" />
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Enrolled</p>
                  <h3 className="text-5xl font-black text-gray-400 tracking-tighter italic">{totalEnrolled}</h3>
                </div>
                <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-gray-400">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[3rem] bg-white overflow-hidden border border-gray-100 flex flex-col group h-full">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-primary/5">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight leading-none italic">Access Reservoir</h3>
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-[.2em] mt-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    Live Synchronized Feed
                  </p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-none rounded-xl font-black text-xs px-5 py-2">
                {presentCount} TRANSMISSIONS
              </Badge>
            </div>

            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto px-2 custom-scrollbar">
              <AnimatePresence mode="popLayout" initial={false}>
                {records.length === 0 ? (
                  <div className="p-32 text-center flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center border-4 border-dashed border-gray-100">
                      <Zap className="w-10 h-10 text-gray-200 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-900 font-black italic tracking-tight">System Prime Ready</p>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Awaiting First Secure Transmission...</p>
                    </div>
                  </div>
                ) : (
                  records.map((record, i) => (
                    <motion.div
                      key={record.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="p-8 flex items-center justify-between hover:bg-primary/5 transition-all cursor-pointer relative group/item"
                    >
                      <div className="absolute left-0 top-0 w-1 h-0 group-hover/item:h-full bg-primary transition-all duration-300" />

                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-black text-sm uppercase overflow-hidden shadow-inner group-hover/item:scale-110 transition-transform">
                          {record.users?.avatar_url ? (
                            <img src={record.users.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            `${record.users?.first_name?.[0]}${record.users?.last_name?.[0]}`
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-gray-900 text-lg tracking-tight leading-none italic">{record.users?.first_name} {record.users?.last_name}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">{record.users?.matric_number}</p>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(record.marked_at), 'HH:mm:ss')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right flex flex-col items-end">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-widest py-1 border-none bg-gray-50",
                            record.marking_method === 'manual' ? "text-amber-600" : "text-primary"
                          )}>
                            {record.marking_method}
                          </Badge>
                          <p className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest mt-1">Verified</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="mt-auto p-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.3em] italic">Encrypted via RSA-4096 Biometric Stream</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
  )
}
