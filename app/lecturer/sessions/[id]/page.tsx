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
  QrCode,
  Activity,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime"
import { format, subMinutes, isAfter } from "date-fns"
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
    toast.success("Attendance report exported")
  }

  async function handleEndSession() {
    if (!confirm("Are you sure you want to end this session?")) return
    setIsEnding(true)
    try {
      const { error } = await supabase
        .from('lecture_sessions')
        .update({
          status: 'completed',
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success("Session ended successfully")
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
        toast.error("Student not found")
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
        toast.error("Student already marked present")
        return
      }

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', session.course_id)
        .eq('student_id', foundStudent.id)
        .single()

      if (!enrollment) {
        toast.error("Student is not enrolled in this course")
        return
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: foundStudent.id,
          marking_method: 'manual',
          marked_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success(`${foundStudent.last_name} marked present`)
      setIsDialogOpen(false)
      setFoundStudent(null)
      setSearchMatric("")
    } catch (error: any) {
      toast.error(error.message || "Failed to mark attendance")
    } finally {
      setIsManualLoading(false)
    }
  }

  if (!session || isRecordsLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const presentCount = records.length
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lecturer/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{session.courses?.code}</h1>
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                {session.status === 'active' ? 'Active' : 'Completed'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{session.topic}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {session.status === 'active' && (
            <>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Manual Entry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manual Attendance</DialogTitle>
                    <DialogDescription>
                      Enter student matriculation number to mark them present.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Matric Number"
                        value={searchMatric}
                        onChange={(e) => setSearchMatric(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
                      />
                      <Button onClick={handleSearchStudent} disabled={isManualLoading}>
                        {isManualLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>

                    {foundStudent && (
                      <div className="rounded-lg border p-4 flex flex-col gap-4">
                        <div>
                          <p className="font-semibold">{foundStudent.first_name} {foundStudent.last_name}</p>
                          <p className="text-sm text-muted-foreground">{foundStudent.matric_number}</p>
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleManualMark}
                          disabled={isManualLoading}
                        >
                          Mark Present
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="destructive"
                onClick={handleEndSession}
                disabled={isEnding}
              >
                {isEnding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <StopCircle className="mr-2 h-4 w-4" />}
                End Session
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Attendance QR Code</CardTitle>
              <CardDescription>Students scan this to mark attendance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-xl border-4 border-slate-50 shadow-sm">
                <QRCodeGenerator
                  value={session.session_code}
                  label={session.session_code}
                />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tracking-widest text-primary">{session.session_code}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" /> Started: {session.start_time}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Velocity</p>
                  <p className="text-2xl font-bold text-primary">{velocity} <span className="text-xs font-normal text-slate-400">ppm</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Rate</p>
                  <p className="text-2xl font-bold">{attendanceRate}%</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span>{presentCount} / {totalEnrolled}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Present</p>
                    <h3 className="text-3xl font-bold text-emerald-600">{presentCount}</h3>
                  </div>
                  <UserCheck className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enrolled</p>
                    <h3 className="text-3xl font-bold">{totalEnrolled}</h3>
                  </div>
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="flex flex-col h-[600px]">
            <CardHeader className="bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Recent Check-ins</CardTitle>
                </div>
                <Badge variant="outline">{presentCount} Total</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto p-0">
              {records.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-10 space-y-4">
                  <QrCode className="h-12 w-12 text-slate-200" />
                  <div>
                    <p className="font-semibold">Ready to scan</p>
                    <p className="text-sm text-muted-foreground">Waiting for students to check in...</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {records.map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold">
                          {record.users?.first_name?.[0]}{record.users?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{record.users?.first_name} {record.users?.last_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{record.users?.matric_number}</span>
                            <span>•</span>
                            <span>{format(new Date(record.marked_at), 'HH:mm:ss')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {record.marking_method}
                        </Badge>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
