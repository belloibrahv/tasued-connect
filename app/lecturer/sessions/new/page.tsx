import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
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
    .select('id, code, title')
    .eq('lecturer_id', user.id)

  const courses = coursesData || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/lecturer/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading">Start New Session</h1>
          <p className="text-muted-foreground">Configure details for today&apos;s lecture</p>
        </div>
      </div>

      <SessionForm courses={courses} lecturerId={user.id} />
    </div>
  )
}
