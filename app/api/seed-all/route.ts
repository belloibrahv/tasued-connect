import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  try {
    // Check if already seeded
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    
    if (userCount && userCount > 2) {
      return NextResponse.json({ message: "Database already seeded with users" })
    }

    // Seed Lecturer Account
    const lecturerEmail = "ogunsanwo@tasued.edu.ng"
    const lecturerPassword = "Lecturer123!"
    
    let lecturerId: string | null = null
    
    try {
      // Clean up existing lecturer
      await supabase.from('users').delete().eq('email', lecturerEmail)
      
      // Create lecturer auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: lecturerEmail,
        password: lecturerPassword,
        options: {
          data: {
            first_name: 'Ganiyu',
            last_name: 'Ogunsanwo',
            role: 'lecturer'
          }
        }
      })

      if (authData?.user) {
        lecturerId = authData.user.id
        
        // Insert into users table
        await supabase.from('users').insert({
          id: lecturerId,
          email: lecturerEmail,
          first_name: 'Ganiyu',
          last_name: 'Ogunsanwo',
          role: 'lecturer',
          title: 'Dr.',
          staff_id: 'STF/CSC/001',
          department: 'Computer Science'
        })
        
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.log("Lecturer seeding skipped or already exists")
    }

    // Seed Student Account
    const studentEmail = "adesina@tasued.edu.ng"
    const studentPassword = "Student123!"
    
    let studentId: string | null = null
    
    try {
      // Clean up existing student
      await supabase.from('users').delete().eq('email', studentEmail)
      
      // Create student auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: {
          data: {
            first_name: 'Adesina',
            last_name: 'Oluwaseun',
            role: 'student'
          }
        }
      })

      if (authData?.user) {
        studentId = authData.user.id
        
        // Insert into users table
        await supabase.from('users').insert({
          id: studentId,
          email: studentEmail,
          first_name: 'Adesina',
          last_name: 'Oluwaseun',
          role: 'student',
          matric_number: 'CSC/2020/001',
          department: 'Computer Science',
          level: '400'
        })
        
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.log("Student seeding skipped or already exists")
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
      }
    ]

    const { data: createdCourses } = await supabase.from('courses').insert(courses).select()

    // Seed Course Enrollment
    if (studentId && createdCourses && createdCourses.length > 0) {
      const enrollments = createdCourses.map(course => ({
        course_id: course.id,
        student_id: studentId,
        status: 'active'
      }))
      
      await supabase.from('course_enrollments').insert(enrollments)
    }

    return NextResponse.json({
      success: true,
      message: "All accounts and data seeded successfully!",
      accounts: {
        lecturer: {
          email: lecturerEmail,
          password: lecturerPassword,
          name: "Dr. Ganiyu Ogunsanwo"
        },
        student: {
          email: studentEmail,
          password: studentPassword,
          name: "Adesina Oluwaseun"
        }
      },
      coursesCreated: createdCourses?.length || 0,
      enrollmentStatus: studentId ? "Created" : "Skipped"
    })

  } catch (error: any) {
    console.error("Seeding error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}