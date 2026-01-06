import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create a Supabase client with service role for admin operations
const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey || serviceRoleKey === 'your_service_role_key_here') {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured - using anon key (may fail due to RLS)')
    // Fall back to anon key - this may fail due to RLS but at least won't crash
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    
    const {
      id,
      email,
      role,
      first_name,
      last_name,
      matric_number,
      staff_id,
      department,
      level,
      title
    } = body

    // Validate required fields
    if (!id || !email || !role || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Note: role-specific fields are optional during registration
    // They can be updated later or generated as temporary values

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { message: 'User profile already exists', user: existingUser },
        { status: 200 }
      )
    }

    // Create user profile using service role (bypasses RLS)
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id,
        email,
        role,
        first_name,
        last_name,
        matric_number: role === 'student' ? (matric_number || `TEMP-${id.substring(0, 8)}`) : null,
        staff_id: role === 'lecturer' ? (staff_id || `STF-${id.substring(0, 8)}`) : null,
        department: department || null,
        level: role === 'student' ? level : null,
        title: role === 'lecturer' ? title : null,
        is_active: true,
        is_email_verified: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user profile:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'User profile created successfully', user: newUser },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
