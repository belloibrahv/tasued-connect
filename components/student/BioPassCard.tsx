"use client"

import { QRCodeSVG } from "qrcode.react"
import { GraduationCap, ShieldCheck, MapPin, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface BioPassProps {
  user: {
    first_name: string
    last_name: string
    role: "student" | "lecturer"
    matric_number?: string
    staff_id?: string
    department: string
    level?: string
    title?: string
    avatar_url?: string
    profile_verified?: boolean
  }
}

export function BioPassCard({ user }: BioPassProps) {
  const isStudent = user.role === "student"
  const identityNumber = isStudent ? user.matric_number : user.staff_id
  const fullName = `${user.title ? user.title + ' ' : ''}${user.first_name} ${user.last_name}`

  // Real verification status derived from database
  const isVerified = user.profile_verified === true

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[1.58/1] bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 group transition-all duration-500 hover:scale-[1.02]">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl -ml-32 -mb-32" />
      </div>

      <div className="relative h-full flex flex-col p-6 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest text-primary uppercase">TASUED</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Digital Bio-Pass</p>
            </div>
          </div>
          {isVerified && (
            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 gap-6 items-center">
          {/* Photo */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-50">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                  {user.first_name[0]}{user.last_name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md animate-pulse">
              <div className="w-3 h-3 bg-primary rounded-full" />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1 space-y-2">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</p>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                {fullName}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {isStudent ? 'Matric No' : 'Staff ID'}
                </p>
                <p className="text-sm font-bold text-gray-700 font-mono tracking-tighter">{identityNumber}</p>
              </div>
              {isStudent && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level</p>
                  <p className="text-sm font-bold text-gray-700">{user.level} L</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2 text-gray-500">
              <MapPin className="w-3 h-3" />
              <p className="text-[10px] font-bold uppercase tracking-tight truncate max-w-[120px]">
                {user.department}
              </p>
            </div>
          </div>
        </div>

        {/* Footer with QR */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase">Issued Dec 2025</span>
            </div>
            <div className="text-[14px] font-black text-primary/20 tracking-[0.2em] pointer-events-none">
              #{(identityNumber || 'TASUED').replace(/[^a-zA-Z0-9]/g, '')}
            </div>
          </div>

          <div className="p-2 bg-white rounded-xl shadow-inner border border-gray-50 group-hover:scale-110 transition-transform duration-500">
            <QRCodeSVG
              value={JSON.stringify({ id: identityNumber, role: user.role })}
              size={64}
              level="H"
              fgColor="#7C3AED"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
