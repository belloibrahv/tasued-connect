"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin, Search, User, XCircle } from "lucide-react"
import Link from "next/link"

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  // In real app, fetch course details by ID
  const course = {
    id: params.id,
    code: "CSC 415",
    title: "Net-Centric Computing",
    lecturer: "Dr. Ogunsanwo",
    units: 3,
    status: "Active",
    schedule: "Tue 2-4PM, Thu 10-12PM",
    venue: "Ogd Hall 2",
    attendance: {
      percentage: 85,
      present: 24,
      absent: 2,
      late: 2,
      total: 28
    },
    students: "85 Enrolled"
  }

  const history = [
    { date: "2024-03-28", status: "Present", time: "1:55 PM" },
    { date: "2024-03-26", status: "Present", time: "2:05 PM" },
    { date: "2024-03-21", status: "Absent", time: "-" },
    { date: "2024-03-19", status: "Late", time: "2:25 PM" },
    { date: "2024-03-14", status: "Present", time: "1:50 PM" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/student/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {course.code}
            <Badge variant="outline">{course.units} Units</Badge>
          </h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((record, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${record.status === 'Present' ? 'bg-success' :
                        record.status === 'Absent' ? 'bg-destructive' :
                          'bg-warning'
                        }`} />
                      <div>
                        <p className="font-medium">{record.date}</p>
                        <p className="text-xs text-muted-foreground">{record.time}</p>
                      </div>
                    </div>
                    <Badge variant={
                      record.status === 'Present' ? 'secondary' :
                        record.status === 'Absent' ? 'destructive' :
                          'outline'
                    } className={
                      record.status === 'Present' ? 'bg-success/10 text-success hover:bg-success/20' :
                        record.status === 'Late' ? 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20' : ''
                    }>
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-bold">{course.attendance.percentage}%</span>
                <span className={`text-sm font-medium ${course.attendance.percentage >= 75 ? 'text-success' : 'text-destructive'
                  }`}>
                  {course.attendance.percentage >= 75 ? 'Good Standing' : 'Risk of Drop'}
                </span>
              </div>
              <Progress value={course.attendance.percentage} className="h-2" />

              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{course.attendance.present}</div>
                  <div className="text-xs text-muted-foreground">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{course.attendance.absent}</div>
                  <div className="text-xs text-muted-foreground">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{course.attendance.late}</div>
                  <div className="text-xs text-muted-foreground">Late</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{course.lecturer}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{course.venue}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{course.schedule}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
