"use client"

import { useState, useEffect } from "react"
import { Loader2, X, Search, UserCheck, UserX, Mail, Download } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface StudentEnrollmentManagerProps {
  courseId: string
  onClose: () => void
}

interface Enrollment {
  id: string
  student_id: string
  status: string
  attendance_percentage: number
  classes_attended: number
  total_classes: number
  student: {
    id: string
    first_name: string
    last_name: string
    matric_number: string
    email: string
  }
}

export function StudentEnrollmentManager({
  courseId,
  onClose,
}: StudentEnrollmentManagerProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchEnrollments()
  }, [courseId])

  useEffect(() => {
    const filtered = enrollments.filter(
      (e) =>
        e.student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.student.matric_number.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEnrollments(filtered)
  }, [searchTerm, enrollments])

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(
          `
          id,
          student_id,
          status,
          attendance_percentage,
          classes_attended,
          total_classes,
          users!student_id (
            id,
            first_name,
            last_name,
            matric_number,
            email
          )
        `
        )
        .eq("course_id", courseId)

      if (error) throw error

      const formatted = data?.map((e: any) => ({
        ...e,
        student: e.users,
      })) || []

      setEnrollments(formatted)
      setFilteredEnrollments(formatted)
    } catch (error: any) {
      toast.error("Failed to load enrollments")
    } finally {
      setIsLoading(false)
    }
  }

  const updateEnrollmentStatus = async (
    enrollmentId: string,
    newStatus: string
  ) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("course_enrollments")
        .update({ status: newStatus })
        .eq("id", enrollmentId)

      if (error) throw error

      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollmentId ? { ...e, status: newStatus } : e
        )
      )

      toast.success(
        `Student ${newStatus === "active" ? "re-enrolled" : "dropped"}`
      )
    } catch (error: any) {
      toast.error("Failed to update enrollment")
    } finally {
      setIsUpdating(false)
    }
  }

  const exportEnrollments = () => {
    const csv = [
      ["Matric Number", "Name", "Email", "Status", "Attendance %"],
      ...filteredEnrollments.map((e) => [
        e.student.matric_number,
        `${e.student.first_name} ${e.student.last_name}`,
        e.student.email,
        e.status,
        `${Math.round(e.attendance_percentage)}%`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "enrollments.csv"
    a.click()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Enrollments</h2>
            <p className="text-sm text-gray-500 mt-1">
              {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Export */}
        <div className="flex gap-3 p-6 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or matric number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-200"
            />
          </div>
          <Button
            onClick={exportEnrollments}
            variant="outline"
            size="sm"
            className="h-10 rounded-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Enrollments List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEnrollments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {enrollment.student.first_name}{" "}
                        {enrollment.student.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {enrollment.student.matric_number}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {enrollment.student.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {Math.round(enrollment.attendance_percentage)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {enrollment.classes_attended}/{enrollment.total_classes}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {enrollment.status === "active" ? (
                          <Button
                            onClick={() =>
                              updateEnrollmentStatus(enrollment.id, "dropped")
                            }
                            disabled={isUpdating}
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              updateEnrollmentStatus(enrollment.id, "active")
                            }
                            disabled={isUpdating}
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No enrollments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
