"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Clock, User, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  id: string
  code: string
  title: string
  lecturer: string
  attendance: number
  nextClass?: string
  department?: string
}

export function CourseCard({ id, code, title, lecturer, attendance, nextClass, department }: CourseCardProps) {
  return (
    <Card className="group flex flex-col h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl border-none bg-white overflow-hidden border border-gray-100">
      <CardHeader className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-widest text-[10px] py-1">
            {code}
          </Badge>
          {attendance >= 75 ? (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Good Standing
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              Keep it up
            </div>
          )}
        </div>
        <CardTitle className="text-xl font-heading font-bold text-gray-900 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <User className="w-3 h-3" />
          {lecturer}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-grow space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500 font-medium">Academic Progress</span>
            <span className={cn("font-bold font-mono", attendance >= 75 ? "text-emerald-600" : "text-amber-600")}>
              {attendance}%
            </span>
          </div>
          <Progress value={attendance} className="h-2 rounded-full" />
        </div>

        {nextClass && (
          <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <Clock className="w-4 h-4 text-primary opacity-60" />
            <span className="font-medium">Next: <span className="text-gray-900 font-bold">{nextClass}</span></span>
          </div>
        )}
      </CardContent>

      <div className="p-6 pt-0 mt-auto">
        <Link href={`/student/courses/${id}`} className="w-full">
          <Button variant="ghost" className="w-full h-12 rounded-xl group/btn bg-gray-50 hover:bg-primary hover:text-white transition-all duration-300 font-bold">
            Comprehensive Analysis
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
