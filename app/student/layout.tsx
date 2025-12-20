import { StudentNav } from "@/components/student/StudentNav"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
