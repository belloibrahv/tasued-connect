"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, CheckCircle, Building2, Clock, Bell } from "lucide-react"
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
import { lecturerOnboardingSchema, type LecturerOnboardingInput } from "@/lib/validations/onboarding"

const STEPS = [
  { id: 1, title: "Office Details", description: "Set your office location and hours" },
  { id: 2, title: "Research Interests", description: "Tell us about your research" },
  { id: 3, title: "Preferences", description: "Set your notification preferences" },
]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export default function LecturerOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [lecturer, setLecturer] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<LecturerOnboardingInput>({
    resolver: zodResolver(lecturerOnboardingSchema),
    defaultValues: {
      officeLocation: "",
      officeHours: {
        day: "Monday",
        startTime: "09:00",
        endTime: "17:00",
      },
      researchInterests: "",
      notificationsEnabled: true,
    },
  })

  useEffect(() => {
    const fetchLecturer = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Try to fetch lecturer data with a timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const { data: lecturerData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        clearTimeout(timeoutId)

        if (error || !lecturerData) {
          console.error("Failed to fetch lecturer data:", error)
          // Create the profile if it doesn't exist
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email,
              role: 'lecturer',
              first_name: user.user_metadata?.first_name || 'Lecturer',
              last_name: user.user_metadata?.last_name || 'User',
              staff_id: user.user_metadata?.staff_id || `TEMP-${user.id.substring(0, 8)}`,
              department: user.user_metadata?.department || null,
              title: user.user_metadata?.title || null,
              is_active: true,
              is_email_verified: true
            })

          if (insertError) {
            console.error("Failed to create lecturer profile:", insertError)
            // Set a minimal lecturer object to allow onboarding to proceed
            setLecturer({
              id: user.id,
              email: user.email,
              role: 'lecturer',
              first_name: user.user_metadata?.first_name || 'Lecturer',
              last_name: user.user_metadata?.last_name || 'User',
            })
            return
          }

          // Fetch again after creating
          const { data: newLecturerData } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single()
          
          setLecturer(newLecturerData)
        } else {
          setLecturer(lecturerData)
        }
      } catch (err) {
        console.error("Error in fetchLecturer:", err)
        // Still allow onboarding to proceed with minimal data
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setLecturer({
            id: user.id,
            email: user.email,
            role: 'lecturer',
            first_name: user.user_metadata?.first_name || 'Lecturer',
            last_name: user.user_metadata?.last_name || 'User',
          })
        }
      }
    }

    fetchLecturer()
  }, [supabase, router])

  async function onSubmit(data: LecturerOnboardingInput) {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user profile with onboarding data
      const { error } = await supabase
        .from("users")
        .update({
          office_location: data.officeLocation,
          bio: data.researchInterests || null,
          is_active: true,
        })
        .eq("id", user.id)

      if (error) throw error

      // Store office hours in system settings
      const { error: settingsError } = await supabase
        .from("system_settings")
        .upsert({
          key: `office_hours_${user.id}`,
          value: data.officeHours,
          category: "lecturer_settings",
        })

      if (settingsError) console.error("Settings error:", settingsError)

      // Mark onboarding as complete
      await supabase
        .from("system_settings")
        .upsert({
          key: `onboarding_complete_${user.id}`,
          value: { completed_at: new Date().toISOString(), role: "lecturer" },
          category: "onboarding",
        })

      toast.success("Onboarding complete!")
      router.push("/lecturer/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  if (!lecturer) {
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {lecturer.title} {lecturer.last_name}</h1>
          <p className="text-gray-500 text-sm mt-1">Let us set up your teaching profile</p>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="officeLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            Office Location
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Block A, Room 201"
                            className="h-11 rounded-lg border-gray-200"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Where students can find you during office hours
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Office Hours (Optional)
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="officeHours.day"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10 rounded-lg border-gray-200 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DAYS.map((day) => (
                                  <SelectItem key={day} value={day}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="officeHours.startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                className="h-10 rounded-lg border-gray-200 text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="officeHours.endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                className="h-10 rounded-lg border-gray-200 text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <FormField
                  control={form.control}
                  name="researchInterests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Research Interests (Optional)
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Tell us about your research interests and specializations..."
                          className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This helps students understand your expertise
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === 3 && (
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
                          Get alerts about attendance, student enrollments, and system updates
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 h-11 rounded-lg"
                  >
                    Back
                  </Button>
                )}
                {currentStep < 3 && (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className={`${currentStep === 1 ? "w-full" : "flex-1"} h-11 rounded-lg bg-purple-600 hover:bg-purple-700`}
                  >
                    Next
                  </Button>
                )}
                {currentStep === 3 && (
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
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
