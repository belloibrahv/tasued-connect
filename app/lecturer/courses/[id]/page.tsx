"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, Download, MoreVertical, ShieldAlert } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function LecturerCourseDetailsPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data
  const course = {
    code: "CSC 415",
    title: "Net-Centric Computing",
    totalStudents: 85,
    schedule: "Tue 2-4PM",
    students: [
      { id: "1", name: "Rasheed Malik Ayomide", matric: "20220294267", attendance: 92, status: "Excellent" },
      { id: "2", name: "Ojo Michael Ogo-Oluwakiitan", matric: "20220294317", attendance: 88, status: "Good" },
      { id: "3", name: "Ilemobayo Abraham Igbekele", matric: "20220294163", attendance: 65, status: "Warning" },
      { id: "4", name: "Kazeem Razaq Olamide", matric: "20220294178", attendance: 45, status: "Danger" },
      { id: "5", name: "User Test", matric: "20220294000", attendance: 100, status: "Excellent" },
    ]
  }

  const filteredStudents = course.students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matric.includes(searchTerm)
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/lecturer/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{course.code} - Course Management</h1>
            <p className="text-muted-foreground">{course.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="destructive">
            <ShieldAlert className="mr-2 h-4 w-4" />
            Course Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">78%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">5 Students</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Enrolled Students</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or matric..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Matric Number</th>
                  <th className="p-4">Attendance Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-gray-600">{student.matric}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${student.attendance >= 75 ? 'bg-success' :
                              student.attendance >= 60 ? 'bg-warning' : 'bg-destructive'
                              }`}
                            style={{ width: `${student.attendance}%` }}
                          />
                        </div>
                        <span className="font-bold">{student.attendance}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        student.status === 'Excellent' || student.status === 'Good' ? 'secondary' :
                          student.status === 'Warning' ? 'outline' : 'destructive'
                      } className={
                        student.status === 'Excellent' ? 'bg-success/10 text-success' :
                          student.status === 'Good' ? 'bg-primary/10 text-primary' :
                            student.status === 'Warning' ? 'bg-warning/10 text-warning border-warning/20' : ''
                      }>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Attendance History</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove from Course</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
