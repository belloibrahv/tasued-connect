import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const studentEmail = "adesina@tasued.edu.ng"
  const studentPassword = "Student123!"

  try {
    // First, clean up any existing data
    await supabase.from('users').delete().eq('email', studentEmail)

    // Create the auth user using Supabase Admin (sign up)
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

    if (authError) {
      // If user already exists in auth, try to get their ID
      if (authError.message.includes('already registered')) {
        // Sign in to get the user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: studentEmail,
          password: studentPassword
        })

        if (signInError) {
          return NextResponse.json({ 
            error: "User exists but password may be different. Please reset in Supabase Dashboard.",
            details: signInError.message 
          }, { status: 400 })
        }

        if (signInData.user) {
          // Update/insert the users table entry
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: signInData.user.id,
              email: studentEmail,
              first_name: 'Adesina',
              last_name: 'Oluwaseun',
              role: 'student',
              matric_number: 'CSC/2020/001',
              department: 'Computer Science',
              level: '400',
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })

          if (upsertError) {
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
          }

          // Sign out
          await supabase.auth.signOut()

          return NextResponse.json({
            success: true,
            message: "Student account updated!",
            credentials: {
              email: studentEmail,
              password: studentPassword
            }
          })
        }
      }
      
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Insert into public.users table
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: studentEmail,
        first_name: 'Adesina',
        last_name: 'Oluwaseun',
        role: 'student',
        matric_number: 'CSC/2020/001',
        department: 'Computer Science',
        level: '400'
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Sign out after creating
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: "Student account created successfully!",
      credentials: {
        email: studentEmail,
        password: studentPassword
      },
      note: "You can now login with these credentials"
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}