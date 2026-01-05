import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/(auth)/login',
  '/(auth)/register',
  '/auth/callback',
  '/(auth)/verify-email',
]

// Onboarding routes
const onboardingRoutes = [
  '/onboarding/student',
  '/onboarding/lecturer',
]

// Dashboard paths for each role
const dashboardPaths: Record<string, string> = {
  student: '/student/dashboard',
  lecturer: '/lecturer/dashboard',
  admin: '/admin/dashboard',
  hod: '/admin/dashboard',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Check if route is public or onboarding
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/')
  )
  const isOnboardingRoute = onboardingRoutes.some(route => pathname.startsWith(route))

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/(auth)/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated user tries to access login/register, redirect to dashboard or onboarding
  if (session && (pathname === '/(auth)/login' || pathname === '/(auth)/register')) {
    // Get user role and check onboarding status
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = userData?.role || 'student'
    
    // Check if onboarding is complete
    const { data: onboardingData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', `onboarding_complete_${session.user.id}`)
      .single()

    if (!onboardingData) {
      // Redirect to onboarding
      const onboardingPath = role === 'lecturer' ? '/onboarding/lecturer' : '/onboarding/student'
      return NextResponse.redirect(new URL(onboardingPath, request.url))
    }

    const dashboardPath = dashboardPaths[role] || '/student/dashboard'
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // If on onboarding route, check if already completed
  if (session && isOnboardingRoute) {
    const { data: onboardingData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', `onboarding_complete_${session.user.id}`)
      .single()

    if (onboardingData) {
      // Onboarding already complete, redirect to dashboard
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = userData?.role || 'student'
      const dashboardPath = dashboardPaths[role] || '/student/dashboard'
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }
  }

  // Role-based access control for protected routes
  if (session && !isPublicRoute) {
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const userRole = userData?.role || 'student'
    const userDashboard = dashboardPaths[userRole] || '/student/dashboard'

    // Check if user is accessing a route they're not authorized for
    if (pathname.startsWith('/student') && !['student'].includes(userRole)) {
      return NextResponse.redirect(new URL(userDashboard, request.url))
    }

    if (pathname.startsWith('/lecturer') && !['lecturer'].includes(userRole)) {
      return NextResponse.redirect(new URL(userDashboard, request.url))
    }

    if (pathname.startsWith('/admin') && !['admin', 'hod'].includes(userRole)) {
      return NextResponse.redirect(new URL(userDashboard, request.url))
    }
  }

  return response
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
