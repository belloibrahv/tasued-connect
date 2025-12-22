"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Scan, Eye, EyeOff, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const verified = searchParams.get('verified')

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message || "Invalid email or password")
        return
      }

      // Get user role to redirect appropriately
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      toast.success("Welcome back!")
      
      if (userData?.role === 'lecturer') {
        router.push("/lecturer/dashboard")
      } else {
        router.push("/student/dashboard")
      }

    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Scan className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">FaceCheck</span>
            </Link>
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </header>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

            {verified === 'false' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <p className="font-medium">Email verification required</p>
                <p className="mt-1 text-amber-600">Please check your inbox and verify your email before logging in.</p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 pr-12"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transition-all" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>
            
            <p className="text-center text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-purple-600 font-semibold hover:text-purple-700 transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://tasued.edu.ng/web/wp-content/uploads/2020/07/DSC_0395.jpg"
            alt="TASUED Students"
            fill
            className="object-cover opacity-20"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16">
          <div className="max-w-md">
            {/* TASUED Logo */}
            <div className="flex items-center gap-4 mb-8">
              <Image 
                src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3-1.png" 
                alt="TASUED Logo"
                width={64}
                height={64}
                className="h-16 w-auto bg-white rounded-xl p-2"
              />
              <div>
                <h3 className="text-white font-bold text-xl">TASUED</h3>
                <p className="text-gray-300 text-sm">Department of Computer Science</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              Face-Verified Attendance System
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              No more proxy attendance. Verify your identity with a quick face scan and mark your attendance in seconds.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold text-white">180+</p>
                <p className="text-sm text-gray-400">Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">99.8%</p>
                <p className="text-sm text-gray-400">Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">&lt;1s</p>
                <p className="text-sm text-gray-400">Verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center animate-pulse">
            <Scan className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
