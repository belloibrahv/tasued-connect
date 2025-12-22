"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CourseCardProps {
  id: string
  code: string
  title: string
  lecturer: string
  attendance: number
  nextClass?: string
}

export function CourseCard({ id, code, title, lecturer, attendance, nextClass }: CourseCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary">{code}</Badge>
          <Badge variant={attendance >= 75 ? "default" : "destructive"}>
            {attendance}% Attendance
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <User className="w-4 h-4" />
          {lecturer}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Attendance Progress</span>
            <span>{attendance}%</span>
          </div>
          <Progress value={attendance} className="h-2" />
        </div>
        {nextClass && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 p-2 rounded">
            <Clock className="w-3 h-3" />
            <span>Next: {nextClass}</span>
          </div>
        )}
        <Link href={`/student/courses/${id}`} className="block mt-4">
          <Button variant="outline" className="w-full">
            View Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
