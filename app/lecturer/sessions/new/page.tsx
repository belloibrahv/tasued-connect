import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SessionForm } from "@/components/lecturer/SessionForm"

export default async function CreateSessionPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to start a session.</div>
  }

  // Fetch courses handled by this lecturer
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, code, name')
    .eq('lecturer_id', user.id)
    .eq('is_active', true)

  const courses = (coursesData || []).map(c => ({
    id: c.id,
    code: c.code,
    title: c.name
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/lecturer/dashboard">
              <Button variant="ghost" size="icon" className="-ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Start New Session</h1>
          </div>
          <p className="text-sm text-gray-500 ml-11">Configure details for today&apos;s lecture</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="font-semibold text-gray-900 mb-1">No Courses Found</h2>
              <p className="text-sm text-gray-500 mb-4">
                You don&apos;t have any active courses assigned yet.
              </p>
              <Link href="/lecturer/courses">
                <Button variant="outline">View Courses</Button>
              </Link>
            </div>
          ) : (
            <SessionForm courses={courses} lecturerId={user.id} />
          )}
        </div>
      </div>
    </div>
  )
}
