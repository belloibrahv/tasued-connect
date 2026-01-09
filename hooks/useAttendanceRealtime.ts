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
  const [error, setError] = useState<string | null>(null)
  const userCache = useRef<Map<string, any>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    if (!sessionId) return

    const init = async () => {
      try {
        setError(null)
        
        // First, get the course_id for this session to fetch enrolled students
        const { data: sessionData, error: sessionError } = await supabase
          .from('lecture_sessions')
          .select('course_id')
          .eq('id', sessionId)
          .single()

        if (sessionError) {
          console.error('Error fetching session:', sessionError)
          setError('Failed to load session data')
          setIsLoading(false)
          return
        }

        if (sessionData) {
          // PRE-CACHE: Fetch all enrolled students once to avoid N+1 queries during live scans
          const { data: enrollments, error: enrollError } = await supabase
            .from('course_enrollments')
            .select('users(id, first_name, last_name, matric_number)')
            .eq('course_id', sessionData.course_id)

          if (enrollError) {
            console.error('Error fetching enrollments:', enrollError)
          } else {
            enrollments?.forEach((e: any) => {
              if (e.users) userCache.current.set(e.users.id, e.users)
            })
          }
        }

        // Fetch existing records
        const { data, error: recordsError } = await supabase
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

        if (recordsError) {
          console.error('Error fetching attendance records:', recordsError)
          setError('Failed to load attendance records')
        } else if (data) {
          setRecords(data as unknown as AttendanceRecord[])
        }
      } catch (err: any) {
        console.error('Initialization error:', err)
        setError('An error occurred while loading attendance data')
      } finally {
        setIsLoading(false)
      }
    }

    init()

    // Subscribe to new records with error handling
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
          try {
            const newRecord = payload.new

            // Try local cache first
            let userInfo = userCache.current.get(newRecord.student_id)

            if (!userInfo) {
              // Fallback for students not in initial enrollment sync
              const { data, error: userError } = await supabase
                .from('users')
                .select('first_name, last_name, matric_number')
                .eq('id', newRecord.student_id)
                .single()
              
              if (userError) {
                console.error('Error fetching user info:', userError)
              } else {
                userInfo = data
                if (userInfo) userCache.current.set(newRecord.student_id, userInfo)
              }
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
          } catch (err: any) {
            console.error('Error processing new attendance record:', err)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Attendance subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Subscription error')
          setError('Real-time updates unavailable')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase])

  return { records, isLoading, error }
}
