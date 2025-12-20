"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, QrCode, Eye, EyeOff, Check, GraduationCap, UserCircle, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'student' | 'lecturer' | 'admin'>('student')
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

      // Pro redirect: Use the selected role to navigate immediately
      // The role in metadata should ideally match for a successfull UX
      toast.success(`Welcome back, ${selectedRole}!`)

      const dashboardPath = selectedRole === 'student'
        ? "/student/dashboard"
        : selectedRole === 'lecturer'
          ? "/lecturer/dashboard"
          : "/admin/dashboard"

      router.push(dashboardPath)

    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = [
    { id: 'student', label: 'Student', icon: <GraduationCap className="w-5 h-5" />, desc: 'Access courses' },
    { id: 'lecturer', label: 'Lecturer', icon: <UserCircle className="w-5 h-5" />, desc: 'Manage sessions' },
    { id: 'admin', label: 'Admin', icon: <ShieldCheck className="w-5 h-5" />, desc: 'System control' },
  ]

  return (
    <div className="min-h-screen flex bg-[#fdfdfd]">
      {/* Left Side - Visual Branding */}
      <div className="hidden lg:flex w-[45%] bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://tasued.edu.ng/web/wp-content/uploads/2024/02/DSC_5892.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />

        <div className="relative z-10 text-white p-12 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <QrCode className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl font-heading font-extrabold mb-6 leading-tight">
              Nigeria&apos;s Premier University of Education
            </h2>
            <p className="text-xl opacity-80 mb-10 font-light leading-relaxed">
              Experience seamless attendance tracking and academic management with TASUED AttendX.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <div className="text-4xl font-bold mb-1">20k+</div>
                <div className="text-sm opacity-60 uppercase tracking-wider">Active Students</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <div className="text-4xl font-bold mb-1">500+</div>
                <div className="text-sm opacity-60 uppercase tracking-wider">Lecturers</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Pro Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg space-y-10"
        >
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-4xl font-heading font-bold text-gray-900 tracking-tight">Sign In</h1>
            <p className="text-gray-500 text-lg">Access your AttendX workspace</p>
          </div>

          {verified === 'false' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800"
            >
              <Loader2 className="w-5 h-5 mt-0.5 animate-spin" />
              <div>
                <p className="font-semibold">Account Pending Verification</p>
                <p className="text-sm opacity-90">Please check your registered email to confirm your account before signing in.</p>
              </div>
            </motion.div>
          )}

          {/* Role Selector Card-style */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold uppercase tracking-widest text-gray-400">Identify as</Label>
            <div className="grid grid-cols-3 gap-4">
              {roleOptions.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id as any)}
                  className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${selectedRole === role.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${selectedRole === role.id ? "bg-primary text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                    }`}>
                    {role.icon}
                  </div>
                  <span className={`font-bold text-sm ${selectedRole === role.id ? "text-primary" : "text-gray-700"}`}>
                    {role.label}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {role.desc}
                  </span>
                  {selectedRole === role.id && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-primary rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. ibrahim@tasued.edu.ng"
                          className="h-12 px-4 rounded-xl border-gray-200 focus:border-primary focus:ring-primary transition-all"
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
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-12 px-4 rounded-xl border-gray-200 focus:border-primary focus:ring-primary transition-all pr-12"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded-md border-gray-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-600 cursor-pointer">
                  Keep me signed in
                </label>
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transform active:scale-[0.98] transition-all" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>

              <p className="text-center text-gray-600 font-medium">
                New to AttendX?{" "}
                <Link href="/register" className="text-primary font-bold hover:underline decoration-2 underline-offset-4">
                  Register Account
                </Link>
              </p>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
