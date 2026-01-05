"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, X } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

const bulkSessionSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  startDate: z.string().min(1, "Select start date"),
  endDate: z.string().min(1, "Select end date"),
  daysOfWeek: z.array(z.string()).min(1, "Select at least one day"),
  startTime: z.string().min(1, "Select start time"),
  duration: z.string().min(1, "Select duration"),
  venue: z.string().min(2, "Enter venue"),
})

type BulkSessionInput = z.infer<typeof bulkSessionSchema>

interface BulkSessionCreatorProps {
  courses: { id: string; code: string; title: string }[]
  lecturerId: string
  onSuccess?: () => void
}

const DAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
]

export function BulkSessionCreator({
  courses,
  lecturerId,
  onSuccess,
}: BulkSessionCreatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<BulkSessionInput>({
    resolver: zodResolver(bulkSessionSchema),
    defaultValues: {
      courseId: "",
      startDate: "",
      endDate: "",
      daysOfWeek: [],
      startTime: "09:00",
      duration: "120",
      venue: "",
    },
  })

  const daysOfWeek = form.watch("daysOfWeek")

  async function onSubmit(data: BulkSessionInput) {
    setIsLoading(true)
    try {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      
      // Validate date range
      if (startDate > endDate) {
        toast.error("Start date must be before end date")
        setIsLoading(false)
        return
      }
      
      const selectedDays = data.daysOfWeek.map(Number)

      const sessions = []
      let currentDate = new Date(startDate)

      // Generate sessions for each matching day in the date range
      while (currentDate <= endDate) {
        if (selectedDays.includes(currentDate.getDay())) {
          // Generate session code
          const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase()
          
          // Calculate end time based on duration
          const [hours, minutes] = data.startTime.split(':').map(Number)
          const startDateTime = new Date(currentDate)
          startDateTime.setHours(hours, minutes, 0)
          
          const endDateTime = new Date(startDateTime.getTime() + parseInt(data.duration) * 60000)
          const endTimeStr = endDateTime.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })

          sessions.push({
            course_id: data.courseId,
            lecturer_id: lecturerId,
            session_date: currentDate.toISOString().split("T")[0],
            start_time: data.startTime,
            end_time: endTimeStr,
            location: data.venue,
            session_code: sessionCode,
            status: "active",
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (sessions.length === 0) {
        toast.error("No sessions to create for selected days")
        setIsLoading(false)
        return
      }

      // Batch insert sessions
      const { error } = await supabase
        .from("lecture_sessions")
        .insert(sessions)

      if (error) throw error

      toast.success(`Created ${sessions.length} sessions successfully!`)
      form.reset()
      setIsOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to create sessions")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Multiple Sessions
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Multiple Sessions</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Selection */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
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

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-11 rounded-lg border-gray-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Days of Week */}
            <FormField
              control={form.control}
              name="daysOfWeek"
              render={() => (
                <FormItem>
                  <FormLabel>Days of Week</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="daysOfWeek"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value?.includes(day.value)}
                              onChange={(e) => {
                                const newValue = e.target.checked
                                  ? [...(field.value || []), day.value]
                                  : field.value?.filter((v) => v !== day.value) || []
                                field.onChange(newValue)
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600"
                            />
                            <label className="text-sm text-gray-700 cursor-pointer">
                              {day.label.slice(0, 3)}
                            </label>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="60">1 Hour</SelectItem>
                        <SelectItem value="90">1.5 Hours</SelectItem>
                        <SelectItem value="120">2 Hours</SelectItem>
                        <SelectItem value="180">3 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Venue */}
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Lecture Hall A, Room 201"
                      className="h-11 rounded-lg border-gray-200"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            {form.watch("startDate") &&
              form.watch("endDate") &&
              daysOfWeek.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Preview:</strong> Will create sessions for{" "}
                    <strong>{daysOfWeek.length}</strong> day(s) per week from{" "}
                    <strong>{form.watch("startDate")}</strong> to{" "}
                    <strong>{form.watch("endDate")}</strong>
                  </p>
                </div>
              )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-11 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 rounded-lg bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Sessions"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
