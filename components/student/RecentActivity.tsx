"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Activity {
  id: string
  course: string
  action: string
  time: string
  status: 'success' | 'warning' | 'error'
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {

  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={
              activity.status === 'success' ? 'bg-success/10 text-success' :
                activity.status === 'warning' ? 'bg-warning/10 text-warning' :
                  'bg-error/10 text-error'
            }>
              {activity.course.substring(0, 3)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.course}</p>
            <p className="text-sm text-muted-foreground">
              {activity.action}
            </p>
          </div>
          <div className="ml-auto font-medium text-xs text-muted-foreground">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  )
}
