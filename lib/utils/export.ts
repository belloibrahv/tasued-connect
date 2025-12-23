import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  doc.text("TASUED FaceCheck - Attendance Report", 14, 22)
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

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    headStyles: { fillColor: [128, 58, 237] }, // Purple primary color
  })

  doc.save(`${fileName}.pdf`)
}
