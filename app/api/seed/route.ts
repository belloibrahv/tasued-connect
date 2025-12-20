import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  try {
    // 1. Get current user if logged in to assign as default lecturer for some courses
    const { data: { user } } = await supabase.auth.getUser()
    const lecturerId = user?.id || null

    // Check if courses exist
    const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true })

    if (count && count > 0) {
      return NextResponse.json({ message: "Database already seeded" })
    }

    // Seed Courses
    const courses = [
      {
        code: "CSC 415",
        title: "Net-Centric Computing",
        description: "Introduction to web technologies, protocols, and architecture.",
        credits: 3,
        department: "Computer Science",
        level: "400",
        semester: "Rain",
        academic_year: "2023/2024",
        schedule: JSON.stringify({ days: ["Tue", "Thu"], times: ["14:00-16:00", "10:00-12:00"] }),
        lecturer_id: lecturerId,
        is_active: true
      },
      {
        code: "CSC 412",
        title: "Computer Graphics and Animation",
        description: "Principles of computer graphics, rendering pipelines, and 3D modeling.",
        credits: 3,
        department: "Computer Science",
        level: "400",
        semester: "Rain",
        academic_year: "2023/2024",
        schedule: JSON.stringify({ days: ["Mon"], times: ["10:00-13:00"] }),
        lecturer_id: lecturerId,
        is_active: true
      },
      {
        code: "CSC 301",
        title: "Structured Programming",
        description: "Advanced programming concepts using C++ and Java.",
        credits: 3,
        department: "Computer Science",
        level: "300",
        semester: "Harmattan",
        academic_year: "2023/2024",
        schedule: JSON.stringify({ days: ["Wed"], times: ["08:00-10:00"] }),
        is_active: true
      },
      {
        code: "GNS 201",
        title: "Information Retrieval",
        description: "Library studies and information sourcing techniques.",
        credits: 2,
        department: "General Studies",
        level: "200",
        semester: "Harmattan",
        academic_year: "2023/2024",
        schedule: JSON.stringify({ days: ["Fri"], times: ["09:00-11:00"] }),
        is_active: true
      },
      {
        code: "EDU 411",
        title: "Methods of Teaching Computer Science",
        description: "Pedagogical approaches for CS education.",
        credits: 2,
        department: "Education",
        level: "400",
        semester: "Rain",
        academic_year: "2023/2024",
        schedule: JSON.stringify({ days: ["Mon"], times: ["14:00-16:00"] }),
        is_active: true
      }
    ]

    const { error: courseError } = await supabase.from('courses').insert(courses)

    if (courseError) {
      console.error("Error seeding courses:", courseError)
      return NextResponse.json({ error: courseError.message }, { status: 500 })
    }

    // 2. Seed some default enrollments if user is a student
    if (user && user.user_metadata?.role === 'student') {
      const { data: createdCourses } = await supabase.from('courses').select('id').limit(3)
      if (createdCourses) {
        const enrollments = createdCourses.map(c => ({
          course_id: c.id,
          student_id: user.id,
          status: 'active'
        }))
        await supabase.from('course_enrollments').upsert(enrollments, { onConflict: 'course_id,student_id' })
      }
    }

    return NextResponse.json({
      message: "Seeding successful",
      coursesCreated: courses.length,
      assignedToUser: lecturerId ? "Yes" : "No (Logged out)",
      enrollmentsCreated: user?.user_metadata?.role === 'student' ? "Yes" : "No"
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

