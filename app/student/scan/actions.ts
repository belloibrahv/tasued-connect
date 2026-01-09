"use client"

import { createClient } from "@/lib/supabase/client"

export async function markAttendance(attendanceCode: string) {
  const supabase = createClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Please log in to mark attendance")

  // 2. Find the session
  const { data: session, error: sessionError } = await supabase
    .from('lecture_sessions')
    .select('*, courses(*)')
    .eq('session_code', attendanceCode)
    .eq('status', 'active')
    .single()

  if (sessionError || !session) {
    throw new Error("Invalid or expired attendance code")
  }

  // 3. Check if student is enrolled
  const { data: enrollment, error: enrollError } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('course_id', session.course_id)
    .eq('student_id', user.id)
    .single()

  if (enrollError || !enrollment) {
    throw new Error(`You are not enrolled in ${session.courses.code}`)
  }

  // 4. Check if already marked
  const { data: existingRecord } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('session_id', session.id)
    .eq('student_id', user.id)
    .single()

  if (existingRecord) {
    throw new Error("You have already marked attendance for this session")
  }

  // 5. Insert attendance record
  const { error: insertError } = await supabase
    .from('attendance_records')
    .insert({
      session_id: session.id,
      student_id: user.id,
      is_present: true,
      marking_method: 'qr',
      marked_at: new Date().toISOString()
    })

  if (insertError) throw insertError

  // Optional: Update session counts if not handled by triggers
  // We'll rely on our SQL triggers if we added them, otherwise we increment here.

  return {
    success: true,
    courseCode: session.courses.code,
    topic: session.topic
  }
}
