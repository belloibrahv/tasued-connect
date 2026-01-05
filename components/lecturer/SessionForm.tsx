"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Clock, MapPin, Navigation, AlertCircle, CheckCircle } from "lucide-react"
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
import { 
  getCurrentLocation, 
  formatCoordinates, 
  isGeolocationAvailable,
  getAvailableVenues,
  getVenueCoordinates,
  type Coordinates 
} from "@/lib/geolocation"

const sessionSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  topic: z.string().min(3, "Topic is required"),
  venue: z.string().min(2, "Venue is required"),
  duration: z.string(),
  requireLocation: z.boolean(),
  locationRadius: z.string(),
})

type SessionInput = z.infer<typeof sessionSchema>

interface SessionFormProps {
  courses: { id: string; code: string; title: string }[]
  lecturerId: string
}

export function SessionForm({ courses, lecturerId }: SessionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [useCurrentLocation, setUseCurrentLocation] = useState(true)
  const supabase = createClient()

  const form = useForm<SessionInput>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      venue: "",
      duration: "120",
      requireLocation: true,
      locationRadius: "100",
      courseId: "",
      topic: "",
    },
  })

  const requireLocation = form.watch("requireLocation")
  const selectedVenue = form.watch("venue")

  // Get current location when component mounts
  useEffect(() => {
    if (requireLocation && useCurrentLocation && isGeolocationAvailable()) {
      // Don't auto-capture on mount, let user click the button
      // This gives them time to grant permission
    }
  }, [requireLocation, useCurrentLocation])

  const captureLocation = async () => {
    setIsGettingLocation(true)
    setLocationError(null)
    
    try {
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      toast.success("Location captured successfully")
    } catch (error: any) {
      setLocationError(error.message)
      toast.error(error.message)
    } finally {
      setIsGettingLocation(false)
    }
  }

  // Get location from predefined venue
  const handleVenueSelect = (venue: string) => {
    form.setValue("venue", venue)
    
    if (!useCurrentLocation) {
      const venueCoords = getVenueCoordinates(venue)
      if (venueCoords) {
        setCurrentLocation(venueCoords)
        setLocationError(null)
      }
    }
  }

  async function onSubmit(data: SessionInput) {
    // Validate location if required
    if (data.requireLocation && !currentLocation) {
      toast.error("Please capture your location first")
      return
    }

    setIsLoading(true)
    try {
      // Generate session code (6-char alphanumeric)
      const sessionCode = nanoid(6).toUpperCase()
      
      // Calculate start and end times
      const now = new Date()
      const startTime = now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
      
      // Calculate end time based on duration
      const durationMinutes = parseInt(data.duration)
      const endDate = new Date(now.getTime() + durationMinutes * 60000)
      const endTime = endDate.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
      
      // Build location string if required
      let locationString = data.venue
      if (data.requireLocation && currentLocation) {
        locationString = `${data.venue} (${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}, radius: ${data.locationRadius}m)`
      }
      
      const sessionData = {
        course_id: data.courseId,
        lecturer_id: lecturerId,
        session_date: now.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        location: locationString,
        session_code: sessionCode,
        status: 'active',
      }

      const { data: session, error } = await supabase
        .from('lecture_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) throw error

      toast.success(`Session created! Code: ${sessionCode}`)
      router.push(`/lecturer/sessions/${session.id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create session")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const availableVenues = getAvailableVenues()

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Select Course</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-lg border-gray-200">
                      <SelectValue placeholder="Select a course..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No courses available</div>
                    ) : (
                      courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </SelectItem>
                      ))
                    )}
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
                <FormLabel className="text-gray-700 font-medium">Topic / Description</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Introduction to Web Protocols" 
                    className="h-11 rounded-lg border-gray-200"
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500">
                  Brief description of what will be covered today.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Venue</FormLabel>
                  <Select onValueChange={handleVenueSelect} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200">
                        <SelectValue placeholder="Select or enter venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableVenues.map(venue => (
                        <SelectItem key={venue} value={venue}>
                          {venue}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Location</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedVenue === "custom" && (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Custom Venue Name</FormLabel>
                <Input 
                  placeholder="Enter venue name"
                  className="h-11 rounded-lg border-gray-200"
                  onChange={(e) => form.setValue("venue", e.target.value)}
                />
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200">
                        <SelectValue placeholder="Select duration" />
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

          {/* Location Verification Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <FormField
              control={form.control}
              name="requireLocation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium text-gray-900">
                      Require Location Verification
                    </FormLabel>
                    <FormDescription className="text-xs text-gray-500">
                      Students must be physically present within range to mark attendance.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {requireLocation && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {/* Location Source Toggle */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Choose location source:</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={useCurrentLocation ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCurrentLocation(true)}
                      className="flex-1 h-10 rounded-lg text-sm"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      My Location
                    </Button>
                    <Button
                      type="button"
                      variant={!useCurrentLocation ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCurrentLocation(false)}
                      className="flex-1 h-10 rounded-lg text-sm"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Venue Location
                    </Button>
                  </div>
                </div>

                {/* Current Location Display */}
                {useCurrentLocation && (
                  <div className="space-y-3">
                    {currentLocation ? (
                      <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-900">Location Captured</p>
                          <p className="text-xs text-emerald-700 font-mono break-all">
                            {formatCoordinates(currentLocation)}
                            {currentLocation.accuracy && ` (±${Math.round(currentLocation.accuracy)}m)`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={captureLocation}
                          disabled={isGettingLocation}
                          className="flex-shrink-0"
                        >
                          {isGettingLocation ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Refresh"
                          )}
                        </Button>
                      </div>
                    ) : locationError ? (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-900">Location Error</p>
                          <p className="text-xs text-red-700 mb-2">{locationError}</p>
                          <p className="text-xs text-red-600 mb-2">
                            <strong>To fix this:</strong>
                          </p>
                          <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                            <li>Check your browser&apos;s location settings</li>
                            <li>Make sure location permission is enabled for this site</li>
                            <li>Try using &quot;Venue Location&quot; instead</li>
                          </ul>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={captureLocation}
                          disabled={isGettingLocation}
                          className="flex-shrink-0"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={captureLocation}
                        disabled={isGettingLocation}
                        className="w-full h-11 rounded-lg"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 mr-2" />
                            Capture Current Location
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Location Radius */}
                <FormField
                  control={form.control}
                  name="locationRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Allowed Radius</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-lg border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="50">50 meters (Strict)</SelectItem>
                          <SelectItem value="100">100 meters (Standard)</SelectItem>
                          <SelectItem value="200">200 meters (Relaxed)</SelectItem>
                          <SelectItem value="500">500 meters (Very Relaxed)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-gray-500">
                        Maximum distance students can be from the class location.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" 
              disabled={isLoading || (requireLocation && !currentLocation)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-5 w-5" />
                  Start Session & Generate Code
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
