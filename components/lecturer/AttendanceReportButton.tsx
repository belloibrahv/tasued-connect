"use client"

import { useState } from "react"
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  generateSessionPDF, 
  generateSessionExcel,
  type SessionInfo,
  type AttendanceRecord 
} from "@/lib/reports"
import toast from "react-hot-toast"

interface AttendanceReportButtonProps {
  session: {
    id: string
    course_id: string
    topic?: string
    venue?: string
    session_date: string
    total_enrolled?: number
    total_present?: number
    total_absent?: number
    total_late?: number
    attendance_percentage?: number
    courses?: {
      code: string
      title: string
    }
    users?: {
      first_name: string
      last_name: string
      title?: string
    }
  }
  attendanceRecords: {
    id: string
    status: string
    check_in_time?: string
    marked_at?: string
    marking_method?: string
    location_verified?: boolean
    location_distance?: number
    users?: {
      first_name: string
      last_name: string
      matric_number: string
    }
  }[]
}

export function AttendanceReportButton({ session, attendanceRecords }: AttendanceReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const prepareData = (): { sessionInfo: SessionInfo; records: AttendanceRecord[] } => {
    const sessionInfo: SessionInfo = {
      course_code: session.courses?.code || 'N/A',
      course_title: session.courses?.title || 'N/A',
      session_date: session.session_date,
      topic: session.topic,
      venue: session.venue,
      lecturer_name: session.users 
        ? `${session.users.title || ''} ${session.users.first_name} ${session.users.last_name}`.trim()
        : 'N/A',
      total_enrolled: session.total_enrolled || 0,
      total_present: session.total_present || 0,
      total_absent: session.total_absent || 0,
      total_late: session.total_late || 0,
      attendance_percentage: session.attendance_percentage || 0
    }

    const records: AttendanceRecord[] = attendanceRecords.map(record => ({
      id: record.id,
      student_name: record.users 
        ? `${record.users.first_name} ${record.users.last_name}`
        : 'Unknown',
      matric_number: record.users?.matric_number || 'N/A',
      status: record.status as 'present' | 'absent' | 'late' | 'excused',
      check_in_time: record.check_in_time,
      marked_at: record.marked_at,
      marking_method: record.marking_method,
      location_verified: record.location_verified,
      location_distance: record.location_distance
    }))

    return { sessionInfo, records }
  }

  const handleExportPDF = async () => {
    setIsGenerating(true)
    try {
      const { sessionInfo, records } = prepareData()
      generateSessionPDF(sessionInfo, records)
      toast.success('PDF report downloaded!')
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
      const { sessionInfo, records } = prepareData()
      generateSessionExcel(sessionInfo, records)
      toast.success('Excel report downloaded!')
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
            <FileDown className="w-4 h-4 mr-2" />
          )}
          Export Report
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
