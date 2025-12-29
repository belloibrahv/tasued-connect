import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const lecturerEmail = "ogunsanwo@tasued.edu.ng"
  const lecturerPassword = "Lecturer123!"

  try {
    // First, clean up any existing data
    await supabase.from('users').delete().eq('email', lecturerEmail)

    // Create the auth user using Supabase Admin (sign up)
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

    if (authError) {
      // If user already exists in auth, try to get their ID
      if (authError.message.includes('already registered')) {
        // Sign in to get the user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: lecturerEmail,
          password: lecturerPassword
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
              email: lecturerEmail,
              first_name: 'Ganiyu',
              last_name: 'Ogunsanwo',
              role: 'lecturer',
              title: 'Dr.',
              staff_id: 'STF/CSC/001',
              department: 'Computer Science',
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })

          if (upsertError) {
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
          }

          // Sign out
          await supabase.auth.signOut()

          return NextResponse.json({
            success: true,
            message: "Lecturer account updated!",
            credentials: {
              email: lecturerEmail,
              password: lecturerPassword
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
        email: lecturerEmail,
        first_name: 'Ganiyu',
        last_name: 'Ogunsanwo',
        role: 'lecturer',
        title: 'Dr.',
        staff_id: 'STF/CSC/001',
        department: 'Computer Science'
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Sign out after creating
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: "Lecturer account created successfully!",
      credentials: {
        email: lecturerEmail,
        password: lecturerPassword
      },
      note: "You can now login with these credentials"
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
