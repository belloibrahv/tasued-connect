"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowRight, ArrowLeft, Check, Upload, GraduationCap, UserCircle, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"

const STEPS = [
  { id: 1, title: "Account Type" },
  { id: 2, title: "Personal Info" },
  { id: 3, title: "Security" },
  { id: 4, title: "Verification" },
]

export function RegisterForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "student",
      terms: false,
    },
    mode: "onChange",
  })

  // Check if current step is valid before proceeding
  const validateStep = async (currentStep: number) => {
    let fieldsToValidate: (keyof RegisterInput)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["role"]
        break
      case 2:
        fieldsToValidate = ["firstName", "lastName", "email", "phone"]
        if (form.getValues("role") === "student") {
          fieldsToValidate.push("matricNumber", "department", "level")
        } else if (form.getValues("role") === "lecturer") {
          fieldsToValidate.push("staffId", "title", "officeLocation")
        }
        break
      case 3:
        fieldsToValidate = ["password", "confirmPassword", "securityQuestion", "securityAnswer", "terms"]
        break
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setStep(currentStep + 1)
    }
  }

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
            matric_number: data.matricNumber,
            department: data.department,
            level: data.level,
            staff_id: data.staffId,
            phone_number: data.phone,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Account created! Redirecting to success page...")
      // Pro redirect: move to the success landing page
      router.push("/register/success?role=" + data.role)

    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const role = form.watch("role")

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`text-xs font-semibold ${step >= s.id ? "text-primary" : "text-gray-400"
                }`}
            >
              {s.title}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">

            {/* Step 1: Account Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-gray-900">I am a...</h2>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { value: "student", label: "Student", icon: <GraduationCap className="w-8 h-8" />, desc: "Track courses" },
                          { value: "lecturer", label: "Lecturer", icon: <UserCircle className="w-8 h-8" />, desc: "Manage sessions" },
                          { value: "admin", label: "Admin", icon: <ShieldCheck className="w-8 h-8" />, desc: "System control" },
                        ].map((option) => (
                          <div
                            key={option.value}
                            className={`cursor-pointer relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 group hover:shadow-md ${field.value === option.value
                              ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                              : "border-gray-100 bg-white hover:border-gray-200"
                              }`}
                            onClick={() => field.onChange(option.value)}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${field.value === option.value ? "bg-primary text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                              }`}>
                              {option.icon}
                            </div>
                            <span className={`font-bold text-base mb-1 ${field.value === option.value ? "text-primary" : "text-gray-700"}`}>
                              {option.label}
                            </span>
                            <span className="text-[10px] text-center text-gray-400 font-medium leading-tight">
                              {option.desc}
                            </span>
                            {field.value === option.value && (
                              <div className="absolute top-3 right-3">
                                <div className="bg-primary rounded-full p-0.5">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@student.tasued.edu.ng" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+234..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === "student" && (
                  <>
                    <FormField
                      control={form.control}
                      name="matricNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matriculation Number</FormLabel>
                          <FormControl>
                            <Input placeholder="2022..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      {/* Department Select - simplified for now */}
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="Physics">Physics</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="100">100 Level</SelectItem>
                                <SelectItem value="200">200 Level</SelectItem>
                                <SelectItem value="300">300 Level</SelectItem>
                                <SelectItem value="400">400 Level</SelectItem>
                                <SelectItem value="500">500 Level</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {role === "lecturer" && (
                  <>
                    <FormField
                      control={form.control}
                      name="staffId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Staff ID</FormLabel>
                          <FormControl>
                            <Input placeholder="STF..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mr">Mr.</SelectItem>
                              <SelectItem value="Mrs">Mrs.</SelectItem>
                              <SelectItem value="Dr">Dr.</SelectItem>
                              <SelectItem value="Prof">Prof.</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Security */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-gray-900">Security & Password</h2>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Security Question</h3>
                  <FormField
                    control={form.control}
                    name="securityQuestion"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a question" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mother_maiden_name">What is your mother&apos;s maiden name?</SelectItem>
                            <SelectItem value="first_pet">What was your first pet&apos;s name?</SelectItem>
                            <SelectItem value="first_school">What was the name of your first school?</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="securityAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Your answer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the terms and privacy policy
                        </FormLabel>
                        <FormDescription>
                          You agree to our Terms of Service and Privacy Policy.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {/* Step 4: Verification (Success State usually, but here we just show submission state or success) */}

          </AnimatePresence>

          <div className="flex justify-between pt-6 border-t mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                className="ml-auto"
                onClick={() => validateStep(step)}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="ml-auto bg-success hover:bg-success/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
