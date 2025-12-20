"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"

interface DashboardStatsProps {
  totalAttendance: number
  attendedClasses: number
  totalSessions: number
  missedClasses: number
  lateArrivals: number
}

export function DashboardStats({
  totalAttendance,
  attendedClasses,
  totalSessions,
  missedClasses,
  lateArrivals,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "Total Attendance",
      value: `${totalAttendance}%`,
      label: totalAttendance >= 75 ? "Excellent" : "Needs Improvement",
      icon: CheckCircle,
      color: totalAttendance >= 75 ? "text-success" : "text-warning",
      progress: totalAttendance,
    },
    {
      title: "Classes Attended",
      value: attendedClasses.toString(),
      label: `Out of ${totalSessions} sessions`,
      icon: Clock,
      color: "text-primary",
      progress: totalSessions > 0 ? (attendedClasses / totalSessions) * 100 : 0,
    },
    {
      title: "Missed Classes",
      value: missedClasses.toString(),
      label: "Unexcused absences",
      icon: AlertTriangle,
      color: "text-warning",
      progress: 100, // Visual reference
    },
    {
      title: "Late Arrivals",
      value: lateArrivals.toString(),
      label: "Try to be early",
      icon: XCircle,
      color: "text-error",
      progress: 20,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.label}
              </p>
              <Progress
                value={stat.progress}
                className="mt-3 h-2"
              />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
