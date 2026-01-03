"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, CheckCircle, Camera, Bell, Phone } from "lucide-react"
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
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { studentOnboardingSchema, type StudentOnboardingInput } from "@/lib/validations/onboarding"

const STEPS = [
  { id: 1, title: "Face Enrollment", description: "Register your face for attendance" },
  { id: 2, title: "Emergency Contact", description: "Add emergency contact information" },
  { id: 3, title: "Preferences", description: "Set your notification preferences" },
]

export default function StudentOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<StudentOnboardingInput>({
    resolver: zodResolver(studentOnboardingSchema),
    defaultValues: {
      emergencyContact: "",
      emergencyContactName: "",
      preferredLanguage: "en",
      notificationsEnabled: true,
    },
  })

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Try to fetch student data with a timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const { data: studentData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        clearTimeout(timeoutId)

        if (error || !studentData) {
          console.error("Failed to fetch student data:", error)
          // Create the profile if it doesn't exist
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email,
              role: 'student',
              first_name: user.user_metadata?.first_name || 'Student',
              last_name: user.user_metadata?.last_name || 'User',
              matric_number: user.user_metadata?.matric_number || `TEMP-${user.id.substring(0, 8)}`,
              department: user.user_metadata?.department || null,
              level: user.user_metadata?.level || null,
              is_active: true,
              is_email_verified: true
            })

          if (insertError) {
            console.error("Failed to create student profile:", insertError)
            // Set a minimal student object to allow onboarding to proceed
            setStudent({
              id: user.id,
              email: user.email,
              role: 'student',
              first_name: user.user_metadata?.first_name || 'Student',
              last_name: user.user_metadata?.last_name || 'User',
            })
            return
          }

          // Fetch again after creating
          const { data: newStudentData } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single()
          
          setStudent(newStudentData)
        } else {
          setStudent(studentData)
        }
      } catch (err) {
        console.error("Error in fetchStudent:", err)
        // Still allow onboarding to proceed with minimal data
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setStudent({
            id: user.id,
            email: user.email,
            role: 'student',
            first_name: user.user_metadata?.first_name || 'Student',
            last_name: user.user_metadata?.last_name || 'User',
          })
        }
      }
    }

    fetchStudent()
  }, [supabase, router])

  const handleSkipFaceEnrollment = async () => {
    setCurrentStep(2)
  }

  const handleCompleteFaceEnrollment = async () => {
    setCurrentStep(2)
  }

  async function onSubmit(data: StudentOnboardingInput) {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user profile with onboarding data
      const { error } = await supabase
        .from("users")
        .update({
          phone_number: data.emergencyContact,
          other_names: data.emergencyContactName,
          is_active: true,
        })
        .eq("id", user.id)

      if (error) throw error

      // Mark onboarding as complete
      const { error: settingsError } = await supabase
        .from("system_settings")
        .upsert({
          key: `onboarding_complete_${user.id}`,
          value: { completed_at: new Date().toISOString(), role: "student" },
          category: "onboarding",
        })

      if (settingsError) console.error("Settings error:", settingsError)

      toast.success("Onboarding complete!")
      router.push("/student/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to FaceCheck</h1>
          <p className="text-gray-500 text-sm mt-1">Let's get you set up in just a few steps</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.id ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {STEPS[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Enroll Your Face</h3>
                <p className="text-gray-600 text-sm mb-4">
                  We'll use your face to verify your identity when marking attendance. This takes less than 30 seconds.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={handleCompleteFaceEnrollment}
                    className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Face Enrollment
                  </Button>
                  <Button
                    onClick={handleSkipFaceEnrollment}
                    variant="outline"
                    className="w-full h-11 rounded-lg"
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Emergency Contact Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., John Doe"
                            className="h-11 rounded-lg border-gray-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Emergency Contact Phone
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+234 (0) 123 456 7890"
                            className="h-11 rounded-lg border-gray-200"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          We'll only contact this number in case of emergency
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 h-11 rounded-lg"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 h-11 rounded-lg bg-purple-600 hover:bg-purple-700"
                  >
                    Next
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 3 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Preferred Language
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-lg border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="yo">Yoruba</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notificationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-gray-200 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-purple-600" />
                              Enable Notifications
                            </div>
                          </FormLabel>
                          <FormDescription>
                            Get alerts about attendance, courses, and important updates
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 h-11 rounded-lg"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-lg bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  )
}
