"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"

const sessionSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  topic: z.string().min(3, "Topic is required"),
  venue: z.string().min(2, "Venue is required"),
  duration: z.string(),
  requireLocation: z.boolean(),
})

type SessionInput = z.infer<typeof sessionSchema>

interface SessionFormProps {
  courses: { id: string; code: string; title: string }[]
  lecturerId: string
}

export function SessionForm({ courses, lecturerId }: SessionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<SessionInput>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      venue: "Lecture Theatre A",
      duration: "120",
      requireLocation: true,
      courseId: "",
      topic: "",
    },
  })

  async function onSubmit(data: SessionInput) {
    setIsLoading(true)
    try {
      const attendanceCode = nanoid(10) // Generate unique code
      const { data: session, error } = await supabase
        .from('lecture_sessions')
        .insert({
          course_id: data.courseId,
          lecturer_id: lecturerId,
          topic: data.topic,
          venue: data.venue,
          duration_minutes: parseInt(data.duration),
          attendance_code: attendanceCode,
          status: 'active',
          session_date: new Date().toISOString().split('T')[0],
          start_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Session created successfully")
      router.push(`/lecturer/sessions/${session.id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create session")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Course</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic / Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Introduction to Web Protocols" {...field} />
                </FormControl>
                <FormDescription>
                  Brief description of what will be covered today.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Enter venue" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Minutes)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="60">60 Minutes</SelectItem>
                      <SelectItem value="90">90 Minutes</SelectItem>
                      <SelectItem value="120">2 Hours</SelectItem>
                      <SelectItem value="180">3 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="requireLocation"
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
                    Require Location Verification
                  </FormLabel>
                  <FormDescription>
                    Students must be physically present within range of the venue to mark attendance.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Start Session & Generate QR
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
