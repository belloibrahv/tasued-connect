"use client"

import { useState, useEffect, useCallback } from "react"
import { Camera, CheckCircle, Clock, User, ChevronRight, Loader2, LogOut, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<any>(null)
  const [recentAttendance, setRecentAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: studentData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setStudent(studentData)

      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('*, lecture_sessions(course_id, courses(code, title))')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentAttendance(attendanceData || [])

    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  const firstName = student?.first_name || "Student"
  const faceEnrolled = !!student?.profile_photo_url

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Scan className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">FaceCheck</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Welcome */}
      <div className="bg-white px-4 pt-5 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Welcome back</p>
          <h1 className="text-xl font-bold text-gray-900">{firstName}</h1>
        </div>
      </div>

      <div className="px-4 pb-8">
        <div className="max-w-lg mx-auto space-y-4 -mt-2">
          
          {/* Face Enrollment Alert */}
          {!faceEnrolled && (
            <Link href="/student/enroll-face">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900">Enroll your face first</p>
                  <p className="text-xs text-amber-600">Required before marking attendance</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </div>
            </Link>
          )}

          {/* Main Action - Mark Attendance */}
          <Link href={faceEnrolled ? "/student/mark-attendance" : "/student/enroll-face"}>
            <div className={`rounded-2xl p-5 text-white shadow-lg ${faceEnrolled ? 'bg-gray-900' : 'bg-gray-400'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold mb-0.5">Mark Attendance</h2>
                  <p className="text-white/70 text-sm">
                    {faceEnrolled ? "Scan your face to verify" : "Enroll face first"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>

          {/* Status Card */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${faceEnrolled ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                {faceEnrolled ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {faceEnrolled ? "Face enrolled" : "Face not enrolled"}
                </p>
                <p className="text-xs text-gray-500">
                  {faceEnrolled ? "Ready to mark attendance" : "Complete setup to continue"}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Attendance</h3>
            </div>
            
            {recentAttendance.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentAttendance.map((record, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.lecture_sessions?.courses?.code || "Class"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(record.created_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      Present
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">No attendance yet</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {faceEnrolled ? "Mark your first attendance" : "Enroll your face to start"}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
