"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Plus, Clock, CheckCircle, Loader2, LogOut, Scan, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LecturerDashboardPage() {
  const [lecturer, setLecturer] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [codeCopied, setCodeCopied] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // First try to get lecturer data - explicitly include face_descriptor fields
      let { data: lecturerData, error: lecturerError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, staff_id, department, title, face_descriptor, profile_photo_url')
        .eq('id', user.id)
        .single()

      // If user doesn't exist in public.users, create them via API (bypasses RLS)
      if (lecturerError || !lecturerData) {
        console.log("User not found in public.users, creating via API...")
        
        const metadata = user.user_metadata || {}
        const role = metadata.role || 'lecturer'
        
        try {
          const response = await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              role: role,
              first_name: metadata.first_name || 'Lecturer',
              last_name: metadata.last_name || 'User',
              matric_number: role === 'student' ? (metadata.matric_number || `TEMP-${user.id.substring(0, 8)}`) : null,
              staff_id: role === 'lecturer' ? (metadata.staff_id || `STF-${user.id.substring(0, 8)}`) : null,
              department: metadata.department || null,
              level: role === 'student' ? (metadata.level || null) : null,
              title: role === 'lecturer' ? (metadata.title || null) : null,
            })
          })
          
          const result = await response.json()
          
          if (response.ok) {
            console.log("User profile created successfully:", result)
            // Re-fetch the user data
            const { data: newLecturerData } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
            lecturerData = newLecturerData
          } else {
            console.error("API error creating profile:", result.error)
          }
        } catch (apiError) {
          console.error("Failed to create profile via API:", apiError)
        }
      }

      const [
        { data: coursesData },
        { data: sessionData }
      ] = await Promise.all([
        supabase.from('courses').select('*').eq('lecturer_id', user.id),
        supabase.from('lecture_sessions')
          .select('*, courses(code, title)')
          .eq('lecturer_id', user.id)
          .eq('status', 'active')
          .single()
      ])

      console.log("Lecturer data fetched:", lecturerData);
      console.log("Face enrolled check:", {
        hasFaceDescriptor: !!lecturerData?.face_descriptor,
        hasProfilePhoto: !!lecturerData?.profile_photo_url,
        faceEnrolled: !!(lecturerData?.face_descriptor || lecturerData?.profile_photo_url)
      });

      setLecturer(lecturerData)
      setCourses(coursesData || [])
      setActiveSession(sessionData)

    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
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
      
      // Set code expiration to 2 hours from now
      const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      
      // Get enrolled students count for this course
      const { count: enrolledCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', selectedCourse)
        .eq('status', 'active')
      
      const { data, error } = await supabase
        .from('lecture_sessions')
        .insert({
          course_id: selectedCourse,
          lecturer_id: user.id,
          attendance_code: code,
          code_expires_at: expiresAt.toISOString(),
          session_date: now.toISOString().split('T')[0],
          start_time: now.toTimeString().split(' ')[0],
          status: 'active',
          started_at: now.toISOString(),
          total_enrolled: enrolledCount || 0
        })
        .select('*, courses(code, title)')
        .single()

      if (error) throw error
      
      setActiveSession(data)
      setShowCreateModal(false)
      setSelectedCourse("")
      
    } catch (error) {
      console.error("Error starting session:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const endSession = async () => {
    if (!activeSession) return
    
    try {
      await supabase
        .from('lecture_sessions')
        .update({ 
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', activeSession.id)
      
      setActiveSession(null)
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  const copyCode = () => {
    if (activeSession?.session_code) {
      navigator.clipboard.writeText(activeSession.session_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

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

  const title = lecturer?.title || ""
  const lastName = lecturer?.last_name || "Lecturer"
  // Check for face_descriptor (the actual face data) OR profile_photo_url
  // face_descriptor is the reliable indicator since it's what's used for verification
  const faceEnrolled = !!lecturer?.face_descriptor || !!lecturer?.profile_photo_url

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
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Welcome */}
      <div className="bg-white px-4 pt-5 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Welcome back</p>
          <h1 className="text-xl font-bold text-gray-900">{title} {lastName}</h1>
        </div>
      </div>

      <div className="px-4 pb-8">
        <div className="max-w-lg mx-auto space-y-4 -mt-2">
          
          {/* Face Enrollment Alert */}
          {!faceEnrolled && (
            <Link href="/lecturer/enroll-face">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Scan className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900">Enroll your face first</p>
                  <p className="text-xs text-amber-600">Required for face verification</p>
                </div>
              </div>
            </Link>
          )}
          
          {/* Active Session Card */}
          {activeSession ? (
            <div className="bg-emerald-600 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wide mb-0.5">Active Session</p>
                  <p className="font-semibold">{activeSession.courses?.code}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              
              {/* Session Code */}
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-emerald-100 text-xs mb-2">Session Code</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold font-mono tracking-widest">
                    {activeSession.attendance_code}
                  </span>
                  <button 
                    onClick={copyCode}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    {codeCopied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <p className="text-emerald-100 text-xs mb-3">
                Share this code with students to mark attendance
              </p>
              
              <Button 
                onClick={endSession}
                variant="secondary"
                className="w-full h-10 rounded-full font-medium bg-white text-emerald-600 hover:bg-emerald-50"
              >
                End Session
              </Button>
            </div>
          ) : (
            <Link href={faceEnrolled ? "#" : "/lecturer/enroll-face"}>
              <button
                onClick={faceEnrolled ? () => setShowCreateModal(true) : undefined}
                className={`w-full rounded-2xl p-5 text-white text-left ${faceEnrolled ? 'bg-gray-900' : 'bg-gray-400'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold mb-0.5">Start Attendance Session</h2>
                    <p className="text-white/70 text-sm">
                      {faceEnrolled ? "Generate a code for students" : "Enroll face first"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                </div>
              </button>
            </Link>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Courses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">Status</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {activeSession ? "Live" : "Idle"}
              </p>
            </div>
          </div>

          {/* Courses List */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Your Courses</h3>
              <Link href="/lecturer/courses" className="text-xs text-purple-600 font-medium">
                Manage
              </Link>
            </div>
            
            {courses.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {courses.map((course) => (
                  <Link key={course.id} href={`/lecturer/courses/${course.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">
                        {course.code.substring(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{course.code}</p>
                      <p className="text-xs text-gray-400 truncate">{course.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 mb-3">No courses assigned</p>
                <Link href="/lecturer/courses/claim">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Claim or Create Course
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Create Session Modal */}
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
                  <p className="text-sm text-gray-500 mb-3">You haven&apos;t created any courses yet</p>
                  <Link href="/lecturer/courses/new">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <Button 
              onClick={startSession}
              disabled={!selectedCourse || isCreating || courses.length === 0}
              className="w-full h-11 rounded-full font-medium"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Start Session"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
