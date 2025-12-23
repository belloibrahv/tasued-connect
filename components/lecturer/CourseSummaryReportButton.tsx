"use client"

import { useState } from "react"
import { FileDown, FileSpreadsheet, Loader2, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  generateCourseSummaryPDF, 
  generateCourseSummaryExcel,
  getAttendanceStatus,
  type CourseAttendanceSummary 
} from "@/lib/reports"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

interface CourseSummaryReportButtonProps {
  courseId: string
  courseCode: string
  courseTitle: string
  lecturerName: string
}

export function CourseSummaryReportButton({ 
  courseId, 
  courseCode, 
  courseTitle, 
  lecturerName 
}: CourseSummaryReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const supabase = createClient()

  const fetchSummaryData = async (): Promise<{ summary: CourseAttendanceSummary[]; totalSessions: number }> => {
    // Get all sessions for this course
    const { data: sessions, error: sessionsError } = await supabase
      .from('lecture_sessions')
      .select('id')
      .eq('course_id', courseId)
      .in('status', ['active', 'closed'])

    if (sessionsError) throw sessionsError

    const totalSessions = sessions?.length || 0

    // Get all enrollments with attendance data
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        student_id,
        classes_attended,
        total_classes,
        attendance_percentage,
        users (
          first_name,
          last_name,
          matric_number
        )
      `)
      .eq('course_id', courseId)

    if (enrollmentsError) throw enrollmentsError

    const summary: CourseAttendanceSummary[] = (enrollments || []).map(enrollment => ({
      student_name: enrollment.users 
        ? `${(enrollment.users as any).first_name} ${(enrollment.users as any).last_name}`
        : 'Unknown',
      matric_number: (enrollment.users as any)?.matric_number || 'N/A',
      classes_attended: enrollment.classes_attended || 0,
      total_classes: enrollment.total_classes || totalSessions,
      attendance_percentage: enrollment.attendance_percentage || 0,
      status: getAttendanceStatus(enrollment.attendance_percentage || 0)
    }))

    // Sort by attendance percentage (descending)
    summary.sort((a, b) => b.attendance_percentage - a.attendance_percentage)

    return { summary, totalSessions }
  }

  const handleExportPDF = async () => {
    setIsGenerating(true)
    try {
      const { summary, totalSessions } = await fetchSummaryData()
      generateCourseSummaryPDF(courseCode, courseTitle, lecturerName, summary, totalSessions)
      toast.success('Course summary PDF downloaded!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportExcel = async () => {
    setIsGenerating(true)
    try {
      const { summary, totalSessions } = await fetchSummaryData()
      generateCourseSummaryExcel(courseCode, courseTitle, lecturerName, summary, totalSessions)
      toast.success('Course summary Excel downloaded!')
    } catch (error) {
      console.error('Excel generation error:', error)
      toast.error('Failed to generate Excel report')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4 mr-2" />
          )}
          Course Summary
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileDown className="w-4 h-4 mr-2 text-red-500" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
          Download Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
