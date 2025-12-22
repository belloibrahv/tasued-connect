"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Plus, Clock, CheckCircle, Loader2, LogOut, Scan, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

      const [
        { data: lecturerData },
        { data: coursesData },
        { data: sessionData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('courses').select('*').eq('lecturer_id', user.id),
        supabase.from('lecture_sessions')
          .select('*, courses(code, title)')
          .eq('lecturer_id', user.id)
          .eq('status', 'active')
          .single()
      ])

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
      
      const { data, error } = await supabase
        .from('lecture_sessions')
        .insert({
          course_id: selectedCourse,
          lecturer_id: user.id,
          attendance_code: code,
          session_date: now.toISOString().split('T')[0],
          start_time: now.toTimeString().split(' ')[0],
          status: 'active',
          started_at: now.toISOString()
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
    if (activeSession?.attendance_code) {
      navigator.clipboard.writeText(activeSession.attendance_code)
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-gray-900 rounded-2xl p-5 text-white text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold mb-0.5">Start Attendance Session</h2>
                  <p className="text-white/70 text-sm">Generate a code for students</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </button>
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
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Your Courses</h3>
            </div>
            
            {courses.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {courses.map((course) => (
                  <div key={course.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">
                        {course.code.substring(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{course.code}</p>
                      <p className="text-xs text-gray-400 truncate">{course.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No courses assigned</p>
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
            </div>
            
            <Button 
              onClick={startSession}
              disabled={!selectedCourse || isCreating}
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
