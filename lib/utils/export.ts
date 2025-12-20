import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface AttendanceData {
  matric_number: string
  name: string
  status: string
  marked_at: string
  method: string
}

export const exportToExcel = (data: AttendanceData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export const exportToPDF = (data: AttendanceData[], title: string, fileName: string) => {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text("TASUED AttendX - Attendance Report", 14, 22)
  doc.setFontSize(11)
  doc.text(`Course/Session: ${title}`, 14, 30)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38)

  const tableColumn = ["S/N", "Matric Number", "Student Name", "Status", "Marked At", "Method"]
  const tableRows = data.map((item, index) => [
    index + 1,
    item.matric_number,
    item.name,
    item.status.toUpperCase(),
    new Date(item.marked_at).toLocaleTimeString(),
    item.method
  ])

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87] }, // Primary color variant
  })

  doc.save(`${fileName}.pdf`)
}
