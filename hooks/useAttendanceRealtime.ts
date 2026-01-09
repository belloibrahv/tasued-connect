import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AttendanceRecord = {
  id: string
  student_id: string
  is_present: boolean
  marked_at: string
  marking_method: string
  users: {
    first_name: string
    last_name: string
    matric_number: string
  }
}

export function useAttendanceRealtime(sessionId: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const userCache = useRef<Map<string, any>>(new Map()) // Local cache for student names
  const supabase = createClient()

  useEffect(() => {
    if (!sessionId) return

    // 1. Initial fetch of session and existing records
    const init = async () => {
      // First, get the course_id for this session to fetch enrolled students
      const { data: sessionData } = await supabase
        .from('lecture_sessions')
        .select('course_id')
        .eq('id', sessionId)
        .single()

      if (sessionData) {
        // PRE-CACHE: Fetch all enrolled students once to avoid N+1 queries during live scans
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('users(id, first_name, last_name, matric_number)')
          .eq('course_id', sessionData.course_id)

        enrollments?.forEach((e: any) => {
          if (e.users) userCache.current.set(e.users.id, e.users)
        })
      }

      // Fetch existing records
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          student_id,
          is_present,
          marked_at,
          marking_method,
          users (
            first_name,
            last_name,
            matric_number
          )
        `)
        .eq('session_id', sessionId)
        .order('marked_at', { ascending: false })

      if (!error && data) {
        setRecords(data as unknown as AttendanceRecord[])
      }
      setIsLoading(false)
    }

    init()

    // 2. Subscribe to new records with HIGH-EFFICIENCY cache lookup
    const channel = supabase
      .channel(`attendance_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          const newRecord = payload.new

          // Try local cache first (Ultra fast, zero API cost)
          let userInfo = userCache.current.get(newRecord.student_id)

          if (!userInfo) {
            // Fallback for students not in initial enrollment sync (e.g. late additions)
            const { data } = await supabase
              .from('users')
              .select('first_name, last_name, matric_number')
              .eq('id', newRecord.student_id)
              .single()
            userInfo = data
            if (userInfo) userCache.current.set(newRecord.student_id, userInfo)
          }

          if (userInfo) {
            const fullRecord: AttendanceRecord = {
              id: newRecord.id,
              student_id: newRecord.student_id,
              is_present: newRecord.is_present,
              marked_at: newRecord.marked_at,
              marking_method: newRecord.marking_method,
              users: userInfo
            }
            setRecords((prev) => [fullRecord, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase])

  return { records, isLoading }
}
