/**
 * Attendance Report Generation Module
 * Generates PDF and Excel reports for attendance data
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export interface AttendanceRecord {
  id: string
  student_name: string
  matric_number: string
  status: 'present' | 'absent' | 'late' | 'excused'
  check_in_time?: string
  marked_at?: string
  marking_method?: string
  location_verified?: boolean
  location_distance?: number
}

export interface SessionInfo {
  course_code: string
  course_title: string
  session_date: string
  topic?: string
  venue?: string
  lecturer_name: string
  total_enrolled: number
  total_present: number
  total_absent: number
  total_late: number
  attendance_percentage: number
}

export interface CourseAttendanceSummary {
  student_name: string
  matric_number: string
  classes_attended: number
  total_classes: number
  attendance_percentage: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

/**
 * Generate PDF report for a single session
 */
export function generateSessionPDF(
  session: SessionInfo,
  records: AttendanceRecord[]
): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Attendance Report', pageWidth / 2, 20, { align: 'center' })
  
  // TASUED branding
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Tai Solarin University of Education', pageWidth / 2, 28, { align: 'center' })
  doc.text('Department of Computer Science', pageWidth / 2, 34, { align: 'center' })
  
  // Divider line
  doc.setDrawColor(128, 0, 128)
  doc.setLineWidth(0.5)
  doc.line(20, 40, pageWidth - 20, 40)
  
  // Session Info
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Session Details', 20, 50)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const sessionDetails = [
    `Course: ${session.course_code} - ${session.course_title}`,
    `Date: ${formatDate(session.session_date)}`,
    `Topic: ${session.topic || 'N/A'}`,
    `Venue: ${session.venue || 'N/A'}`,
    `Lecturer: ${session.lecturer_name}`,
  ]
  
  let yPos = 58
  sessionDetails.forEach(detail => {
    doc.text(detail, 20, yPos)
    yPos += 6
  })
  
  // Statistics Box
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(pageWidth - 80, 48, 60, 40, 3, 3, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Statistics', pageWidth - 75, 56)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Present: ${session.total_present}`, pageWidth - 75, 64)
  doc.text(`Absent: ${session.total_absent}`, pageWidth - 75, 70)
  doc.text(`Late: ${session.total_late}`, pageWidth - 75, 76)
  doc.setFont('helvetica', 'bold')
  doc.text(`Rate: ${session.attendance_percentage.toFixed(1)}%`, pageWidth - 75, 84)
  
  // Attendance Table
  const tableData = records.map((record, index) => [
    (index + 1).toString(),
    record.matric_number,
    record.student_name,
    record.status.toUpperCase(),
    record.check_in_time || '-',
    record.marking_method || '-',
    record.location_verified ? '✓' : '-'
  ])
  
  autoTable(doc, {
    startY: 95,
    head: [['#', 'Matric No.', 'Student Name', 'Status', 'Time', 'Method', 'Location']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [128, 0, 128],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 50 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 }
    },
    didParseCell: (data) => {
      // Color code status
      if (data.column.index === 3 && data.section === 'body') {
        const status = data.cell.raw?.toString().toLowerCase()
        if (status === 'present') {
          data.cell.styles.textColor = [16, 185, 129]
        } else if (status === 'absent') {
          data.cell.styles.textColor = [239, 68, 68]
        } else if (status === 'late') {
          data.cell.styles.textColor = [245, 158, 11]
        }
      }
    }
  })
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 200
  doc.setFontSize(8)
  doc.setTextColor(128)
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, finalY + 15)
  doc.text('FaceCheck Attendance System - TASUED', pageWidth - 20, finalY + 15, { align: 'right' })
  
  // Save
  const filename = `Attendance_${session.course_code}_${session.session_date}.pdf`
  doc.save(filename)
}

/**
 * Generate Excel report for a single session
 */
export function generateSessionExcel(
  session: SessionInfo,
  records: AttendanceRecord[]
): void {
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // Session info sheet
  const sessionData = [
    ['ATTENDANCE REPORT'],
    ['Tai Solarin University of Education'],
    ['Department of Computer Science'],
    [''],
    ['Course Code', session.course_code],
    ['Course Title', session.course_title],
    ['Date', formatDate(session.session_date)],
    ['Topic', session.topic || 'N/A'],
    ['Venue', session.venue || 'N/A'],
    ['Lecturer', session.lecturer_name],
    [''],
    ['STATISTICS'],
    ['Total Enrolled', session.total_enrolled],
    ['Present', session.total_present],
    ['Absent', session.total_absent],
    ['Late', session.total_late],
    ['Attendance Rate', `${session.attendance_percentage.toFixed(1)}%`],
  ]
  
  const wsInfo = XLSX.utils.aoa_to_sheet(sessionData)
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Session Info')
  
  // Attendance records sheet
  const recordsData = [
    ['#', 'Matric Number', 'Student Name', 'Status', 'Check-in Time', 'Method', 'Location Verified', 'Distance (m)']
  ]
  
  records.forEach((record, index) => {
    recordsData.push([
      (index + 1).toString(),
      record.matric_number,
      record.student_name,
      record.status.toUpperCase(),
      record.check_in_time || '-',
      record.marking_method || '-',
      record.location_verified ? 'Yes' : 'No',
      record.location_distance?.toString() || '-'
    ])
  })
  
  const wsRecords = XLSX.utils.aoa_to_sheet(recordsData)
  
  // Set column widths
  wsRecords['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 }
  ]
  
  XLSX.utils.book_append_sheet(wb, wsRecords, 'Attendance')
  
  // Save
  const filename = `Attendance_${session.course_code}_${session.session_date}.xlsx`
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)
}

/**
 * Generate course summary PDF (all sessions)
 */
export function generateCourseSummaryPDF(
  courseCode: string,
  courseTitle: string,
  lecturerName: string,
  summary: CourseAttendanceSummary[],
  totalSessions: number
): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Course Attendance Summary', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Tai Solarin University of Education', pageWidth / 2, 28, { align: 'center' })
  
  // Divider
  doc.setDrawColor(128, 0, 128)
  doc.setLineWidth(0.5)
  doc.line(20, 35, pageWidth - 20, 35)
  
  // Course Info
  doc.setFontSize(11)
  doc.text(`Course: ${courseCode} - ${courseTitle}`, 20, 45)
  doc.text(`Lecturer: ${lecturerName}`, 20, 52)
  doc.text(`Total Sessions: ${totalSessions}`, 20, 59)
  doc.text(`Total Students: ${summary.length}`, 20, 66)
  
  // Summary Table
  const tableData = summary.map((student, index) => [
    (index + 1).toString(),
    student.matric_number,
    student.student_name,
    student.classes_attended.toString(),
    student.total_classes.toString(),
    `${student.attendance_percentage.toFixed(1)}%`,
    getStatusLabel(student.status)
  ])
  
  autoTable(doc, {
    startY: 75,
    head: [['#', 'Matric No.', 'Student Name', 'Attended', 'Total', 'Rate', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [128, 0, 128],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === 'body') {
        const status = data.cell.raw?.toString().toLowerCase()
        if (status === 'excellent') {
          data.cell.styles.textColor = [16, 185, 129]
        } else if (status === 'good') {
          data.cell.styles.textColor = [59, 130, 246]
        } else if (status === 'warning') {
          data.cell.styles.textColor = [245, 158, 11]
        } else if (status === 'critical') {
          data.cell.styles.textColor = [239, 68, 68]
        }
      }
    }
  })
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 200
  doc.setFontSize(8)
  doc.setTextColor(128)
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, finalY + 15)
  doc.text('FaceCheck Attendance System - TASUED', pageWidth - 20, finalY + 15, { align: 'right' })
  
  // Legend
  doc.setFontSize(7)
  doc.text('Status: Excellent (≥90%) | Good (75-89%) | Warning (60-74%) | Critical (<60%)', 20, finalY + 22)
  
  const filename = `Course_Summary_${courseCode}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Generate course summary Excel
 */
export function generateCourseSummaryExcel(
  courseCode: string,
  courseTitle: string,
  lecturerName: string,
  summary: CourseAttendanceSummary[],
  totalSessions: number
): void {
  const wb = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = [
    ['COURSE ATTENDANCE SUMMARY'],
    ['Tai Solarin University of Education'],
    [''],
    ['Course Code', courseCode],
    ['Course Title', courseTitle],
    ['Lecturer', lecturerName],
    ['Total Sessions', totalSessions],
    ['Total Students', summary.length],
    [''],
    ['#', 'Matric Number', 'Student Name', 'Classes Attended', 'Total Classes', 'Attendance %', 'Status']
  ]
  
  summary.forEach((student, index) => {
    summaryData.push([
      (index + 1).toString(),
      student.matric_number,
      student.student_name,
      student.classes_attended.toString(),
      student.total_classes.toString(),
      `${student.attendance_percentage.toFixed(1)}%`,
      getStatusLabel(student.status)
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData)
  ws['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, 'Summary')
  
  const filename = `Course_Summary_${courseCode}_${new Date().toISOString().split('T')[0]}.xlsx`
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'excellent': return 'Excellent'
    case 'good': return 'Good'
    case 'warning': return 'Warning'
    case 'critical': return 'Critical'
    default: return status
  }
}

/**
 * Calculate attendance status based on percentage
 */
export function getAttendanceStatus(percentage: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 75) return 'good'
  if (percentage >= 60) return 'warning'
  return 'critical'
}
