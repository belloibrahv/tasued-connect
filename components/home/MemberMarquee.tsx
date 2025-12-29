"use client"

import { members } from "@/lib/data/members"

export function MemberMarquee() {
  return (
    <div className="w-full bg-slate-50 border-y border-slate-200 py-10 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

      <div className="group flex overflow-hidden select-none w-full">
        <div className="flex animate-marquee group-hover:[animation-play-state:paused] min-w-full shrink-0 items-center justify-around gap-8 pr-8">
          {members.map((member, i) => (
            <MemberCard key={`a-${i}`} member={member} />
          ))}
        </div>
        <div className="flex animate-marquee group-hover:[animation-play-state:paused] min-w-full shrink-0 items-center justify-around gap-8 pr-8" aria-hidden="true">
          {members.map((member, i) => (
            <MemberCard key={`b-${i}`} member={member} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 300s linear infinite;
        }
      `}</style>
    </div>
  )
}

function MemberCard({ member }: { member: typeof members[0] }) {
  return (
    <div className="relative flex flex-col justify-center bg-white rounded-lg px-6 py-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 min-w-[280px]">
      <div className="flex flex-col space-y-2">
        <h3 className="font-semibold text-slate-800 text-sm tracking-tight truncate uppercase">
          {member.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {member.matric}
          </span>
          {member.status === "PAID" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              PAID
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
