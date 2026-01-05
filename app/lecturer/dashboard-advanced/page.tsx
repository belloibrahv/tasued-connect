"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  Plus,
  Clock,
  CheckCircle,
  Loader2,
  LogOut,
  Scan,
  Copy,
  X,
  TrendingUp,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { BulkSessionCreator } from "@/components/lecturer/BulkSessionCreator"
import { StudentEnrollmentManager } from "@/components/lecturer/StudentEnrollmentManager"

interface Course {
  id: string
  code: string
  title: string
  level: string
  semester: string
  min_attendance_percentage: number
}

interface Session {
  id: string
  course_id: string
  session_code: string
  session_date: string
  start_time: string
  status: string
  total_enrolled: number
  total_present: number
  total_absent: number
  courses: { code: string; title: string }
}

interface CourseStats {
  courseId: string
  courseName: string
  totalEnrolled: number
  totalSessions: number
  activeSessions: number
  averageAttendance: number
  atRiskStudents: number
}

export default function LecturerDashboardAdvancedPage() {
  const [lecturer, setLecturer] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [activeSession, setActiveSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [codeCopied, setCodeCopied] = useState(false)
  const [selectedEnrollmentCourse, setSelectedEnrollmentCourse] = useState<string>("")
  const [showEnrollmentManager, setShowEnrollmentManager] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Fetch lecturer data
      let { data: lecturerData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!lecturerData) {
        const metadata = user.user_metadata || {}
        const response = await fetch("/api/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            role: "lecturer",
            first_name: metadata.first_name || "Lecturer",
            last_name: metadata.last_name || "User",
            staff_id: metadata.staff_id || `STF-${user.id.substring(0, 8)}`,
            title: metadata.title || null,
          }),
        })

        if (response.ok) {
          const { data: newLecturerData } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single()
          lecturerData = newLecturerData
        }
      }

      setLecturer(lecturerData)

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("lecturer_id", user.id)
        .order("created_at", { ascending: false })

      setCourses(coursesData || [])

      // Fetch all sessions for this lecturer
      const { data: sessionsData } = await supabase
        .from("lecture_sessions")
        .select("*, courses(code, title)")
        .eq("lecturer_id", user.id)
        .order("session_date", { ascending: false })

      setSessions(sessionsData || [])

      // Find active session
      const active = sessionsData?.find((s) => s.status === "active")
      setActiveSession(active)

      // Calculate course statistics
      if (coursesData && coursesData.length > 0) {
        const stats = await Promise.all(
          coursesData.map(async (course) => {
            const { count: enrolledCount } = await supabase
              .from("course_enrollments")
              .select("*", { count: "exact", head: true })
              .eq("course_id", course.id)
              .eq("status", "active")

            const { data: courseSessionsData } = await supabase
              .from("lecture_sessions")
              .select("*")
              .eq("course_id", course.id)

            const activeSessions = courseSessionsData?.filter(
              (s) => s.status === "active"
            ).length || 0

            const { data: attendanceData } = await supabase
              .from("attendance_records")
              .select("student_id, is_present")
              .in("session_id", (courseSessionsData || []).map(s => s.id))

            // Calculate attendance percentage for each enrolled student
            const enrolledStudents = await supabase
              .from("course_enrollments")
              .select("student_id")
              .eq("course_id", course.id)
              .eq("status", "active")

            let avgAttendance = 0
            let atRisk = 0

            if (enrolledStudents.data && enrolledStudents.data.length > 0) {
              const studentAttendance = enrolledStudents.data.map(enrollment => {
                const studentRecords = attendanceData?.filter(r => r.student_id === enrollment.student_id) || []
                const presentCount = studentRecords.filter(r => r.is_present).length
                const totalSessions = courseSessionsData?.length || 1
                const percentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0
                return percentage
              })

              avgAttendance = studentAttendance.length > 0
                ? Math.round(studentAttendance.reduce((a, b) => a + b, 0) / studentAttendance.length)
                : 0

              atRisk = studentAttendance.filter(p => p < 75).length
            }

            return {
              courseId: course.id,
              courseName: `${course.code} - ${course.title}`,
              totalEnrolled: enrolledCount || 0,
              totalSessions: courseSessionsData?.length || 0,
              activeSessions,
              averageAttendance: Math.round(avgAttendance),
              atRiskStudents: atRisk,
            }
          })
        )

        setCourseStats(stats)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const startSession = async () => {
    if (!selectedCourse) return

    setIsCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const code = generateCode()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      const { count: enrolledCount } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", selectedCourse)
        .eq("status", "active")

      const { data, error } = await supabase
        .from("lecture_sessions")
        .insert({
          course_id: selectedCourse,
          lecturer_id: user.id,
          session_code: code,
          session_date: now.toISOString().split("T")[0],
          start_time: now.toTimeString().split(" ")[0],
          status: "active",
          started_at: now.toISOString(),
          total_enrolled: enrolledCount || 0,
        })
        .select("*, courses(code, title)")
        .single()

      if (error) throw error

      setActiveSession(data)
      setShowCreateModal(false)
      setSelectedCourse("")
      toast.success("Session started!")
    } catch (error: any) {
      toast.error(error.message || "Failed to start session")
    } finally {
      setIsCreating(false)
    }
  }

  const endSession = async () => {
    if (!activeSession) return

    try {
      await supabase
        .from("lecture_sessions")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", activeSession.id)

      setActiveSession(null)
      toast.success("Session ended")
    } catch (error: any) {
      toast.error("Failed to end session")
    }
  }

  const copyCode = () => {
    if (activeSession?.attendance_code) {
      navigator.clipboard.writeText(activeSession.attendance_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  const title = lecturer?.title || ""
  const lastName = lecturer?.last_name || "Lecturer"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Scan className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">FaceCheck</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="bg-white border-b border-gray-100 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {title} {lastName}
          </h1>
          <p className="text-gray-500 mt-1">Manage your courses and sessions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Active Session Card */}
        {activeSession && (
          <div className="mb-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-emerald-100 text-sm uppercase tracking-wide mb-1">
                  Active Session
                </p>
                <p className="text-2xl font-bold">
                  {activeSession.courses?.code}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <p className="text-emerald-100 text-xs mb-2">Session Code</p>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold font-mono tracking-widest">
                  {activeSession.attendance_code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  {codeCopied ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={endSession}
                className="flex-1 h-10 rounded-lg bg-white text-emerald-600 hover:bg-emerald-50 font-medium"
              >
                End Session
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {!activeSession && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Start Session</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Begin attendance marking
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Create Multiple Sessions
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Schedule recurring sessions
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500 font-medium">Courses</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500 font-medium">Sessions</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 font-medium">
                Total Enrolled
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {courseStats.reduce((sum, s) => sum + s.totalEnrolled, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500 font-medium">
                Avg Attendance
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {courseStats.length > 0
                ? Math.round(
                    courseStats.reduce((sum, s) => sum + s.averageAttendance, 0) /
                      courseStats.length
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Course Performance
            </h2>
            <Link href="/lecturer/courses" className="text-xs text-purple-600 font-medium">
              View All
            </Link>
          </div>

          {courseStats.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {courseStats.map((stat) => (
                <div key={stat.courseId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{stat.courseName}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {stat.totalEnrolled} students • {stat.totalSessions} sessions
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEnrollmentCourse(stat.courseId)
                        setShowEnrollmentManager(true)
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Manage Students
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Avg Attendance</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              stat.averageAttendance >= 75
                                ? "bg-emerald-500"
                                : stat.averageAttendance >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${stat.averageAttendance}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-10">
                          {stat.averageAttendance}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Active Sessions</p>
                      <p className="text-lg font-bold text-gray-900">
                        {stat.activeSessions}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">At Risk</p>
                      <div className="flex items-center gap-2">
                        {stat.atRiskStudents > 0 && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <p className="text-lg font-bold text-gray-900">
                          {stat.atRiskStudents}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No courses yet</p>
              <Link href="/lecturer/courses/new">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Sessions
            </h2>
          </div>

          {sessions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.courses?.code}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(session.session_date).toLocaleDateString()} at{" "}
                        {session.start_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : session.status === "closed"
                              ? "bg-gray-50 text-gray-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {session.total_present}/{session.total_enrolled} present
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No sessions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Start Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Start Session</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              {courses.length > 0 ? (
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    You have not created any courses yet
                  </p>
                  <Link href="/lecturer/courses/new">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-11 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={startSession}
                disabled={!selectedCourse || isCreating || courses.length === 0}
                className="flex-1 h-11 rounded-lg bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Start Session"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Manager Modal */}
      {showEnrollmentManager && (
        <StudentEnrollmentManager
          courseId={selectedEnrollmentCourse}
          onClose={() => {
            setShowEnrollmentManager(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
