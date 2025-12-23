"use client"

import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const members = [
  { name: "KAZEEM RAZAQ OLAMIDE", matric: "20220294178" },
  { name: "EMMANUEL PRECIOUS OGUNTUNDE", matric: "20220294179" },
  { name: "SOLARIN OLABISI RHODA", matric: "20220294181" },
  { name: "ADEMOLU TIMILEYIN ADEBAYO", matric: "20220294185" },
  { name: "MUSTAPHA MUBARAK MOSEBOLATAN", matric: "20220294186" },
  { name: "ADEBAYO TAIWO GABRIEL", matric: "20220294187" },
  { name: "LAPITE JOSEPH ADEBOYE", matric: "20220294188" },
  { name: "SULAIMAN DAMILOLA BANJO", matric: "20220294189" },
  { name: "TAIWO ROLAND OLUWAPELUMI", matric: "20220294191" },
  { name: "AKINWAARE RACHAEL OMOLARA", matric: "20220294192" },
  { name: "EMMANUEL ỌPẸ́YẸMÍ ÀLÀÓ", matric: "20220294198" },
  { name: "OLADEPO STELLA OLAMIPOSI", matric: "20220294199" },
  { name: "SHEDRACH ABDULAHI OKINO", matric: "20220294200" },
  { name: "BLESSING IFEOLUWA ADEEGBE", matric: "20220294201" },
  { name: "KRIS GREAT NYMPHAS", matric: "20220294202" },
  { name: "OPELOYERU RAMOTA OLAMIDE", matric: "20220294204" },
  { name: "OGUNLEYE JOHN OYEBADE", matric: "20220294205" },
  { name: "BAYONLE TOYEEB OYEDELE", matric: "20220294209" },
  { name: "MAKINDE PELUMI ANUOLUWAPO", matric: "20220294210" },
  { name: "FASANYA CHRISTIANA OMOLOLA", matric: "20220294211" },
  { name: "ABDULLAHI EBERECHUKWU YAHAYA", matric: "20220294213" },
  { name: "ADENIYI DANIEL OLUBORI", matric: "20220294215" },
  { name: "EIGBIKHAN VICTOR OSEMUDIAMEN", matric: "20220294218" },
  { name: "OJOYE KAYODE STEPHEN", matric: "20220294219" },
  { name: "AYOMIDE FABELURIN DAVID", matric: "20220294220" },
  { name: "OLADEJI YUSUF ADEBUKOLA", matric: "20220294221" },
  { name: "SAHEED ABDULQUADRI BOLUWATIFE", matric: "20220294223" },
  { name: "OLUWASEUN TESLIM ADELEKE", matric: "20220294224" },
  { name: "AGBOOLA OLAMILEKAN EMMANUEL", matric: "20220294226" },
  { name: "OLUWATOSIN ADESORE AWOYEFA", matric: "20220294227" },
  { name: "ABUBAKAR ALIMRAN ENEOJO", matric: "20220294233" },
  { name: "OLAOLUWA JOSHUA OLUWASEGUN", matric: "20220294234" },
  { name: "HABEEB ADEWALE ADEBANJOKO", matric: "20220294236" },
  { name: "ADENIRAN DAMILOLA ABOSEDE", matric: "20220294237" },
  { name: "OGBUEHI MERIT CHIAMAKA", matric: "20220294241" },
  { name: "MUMINAT OYINDAMOLA ABDUL RASAQ", matric: "20220294242" },
  { name: "BOSEDE RAPHAEL OLUWATOBIOBA", matric: "20220294243" },
  { name: "KOREDE SOLIU LAWAL", matric: "20220294246" },
  { name: "ROQEEB OLANREWAJU FADIPE", matric: "20220294247" },
  { name: "ADEBIYI ALIYAT OLUWATOYIN", matric: "20220294248" },
  { name: "IFEANYI EMMANUEL EDEH", matric: "20220294249" },
  { name: "ABDUL MALIK ADESINA LAWAL", matric: "20220294251" },
  { name: "NWAFOR SARAH CHINAZA", matric: "20220294255" },
  { name: "ONILEDE FEMI SAMUEL", matric: "20220294256" },
  { name: "AJATTA DAVID OLAWALE", matric: "20220294257" },
  { name: "GBADEBO FAIDAT ADEOLA", matric: "20220294258" },
  { name: "FAVOUR OSEMUJAMEN OSEGHALE", matric: "20220294259" },
  { name: "NAFIU AYOMIDE RAPHAEL", matric: "20220294262" },
  { name: "OLAMILEKAN ABDUL-AFEEZ BADMUS", matric: "20220294264" },
  { name: "OLATOYE OPEYEMI TOBILOBA", matric: "20220294266" },
  { name: "ADENIRAN AYOMIDE OPEYEMI", matric: "20220294268" },
  { name: "OYEDELE WISDOM EMMANUEL", matric: "20220294269" },
  { name: "OGUNNIYI RASHEED OLUWATOBI", matric: "20220294272" },
  { name: "OBAJIMI AYOMIDE OREOLUWA", matric: "20220294275" },
  { name: "BIOBAKU OLUWASEYI TOBILOBA", matric: "20220294276" },
  { name: "ABDULQUDUS OLUWASEYI AMBALI", matric: "20220294277" },
  { name: "ADETUNJI ISRAEL TEMITOPE", matric: "20220294278" },
  { name: "OLUWASHOLAFUNMI PRECIOUS OJO", matric: "20220294280" },
  { name: "WARITH ADEFOLARIN RAJI", matric: "20220294286" },
  { name: "BADMUS SAMAD KOLAWOLE", matric: "20220294288" },
  { name: "ABDULGANIYU OMOTAYO BIOBAKU", matric: "20220294289" },
  { name: "EMMANUEL OKIKE OKIKE", matric: "20220294290" },
  { name: "KELANI BOLUWATIFE ABRAHAM", matric: "20220294292" },
  { name: "EMMANUEL PETER BABATUNDE", matric: "20220294294" },
  { name: "MALIK ADEDEJI MOMODU", matric: "20220294296" },
  { name: "OLAMILEKAN SAMUEL OYEDEJI", matric: "20220294298" },
  { name: "TEWOGBADE MUBARAK ABIOLA", matric: "20220294299" },
  { name: "OSITOYE ADEOLA ALICE", matric: "20220294301" },
  { name: "BABATUNDE JOSHUA AYOMIDE", matric: "20220294302" },
  { name: "OLANREWAJU FASSOL OSENI", matric: "20220294303" },
  { name: "OGUNREMI QUADRI AYOMIDE", matric: "20220294304" },
  { name: "OTESILE OLUWABUSAYO RHODA", matric: "20220294306" },
  { name: "MMESIOMA EZEUGWU JUDITH", matric: "20220294309" },
  { name: "PRECIOUS DADA FIYINFOLUWA", matric: "20220294311" },
  { name: "MARY ONYEMOWO OKPE", matric: "20220294320" },
  { name: "AKINBODE ADEDEJI JOSEPH", matric: "20220294321" },
  { name: "ADEYEMI PETER ADEBAYO", matric: "20220294322" },
  { name: "HENRY TOSIN ODENIYI", matric: "20220294326" },
  { name: "ABDULFATAH KHADIJAH BOLANLE", matric: "20220294327" },
  { name: "ONWE ESTHER OHEHIGWU", matric: "20220294328" },
  { name: "MICHEAL KELVIN MADUABUCHI", matric: "20220294330" },
  { name: "ADEBAYO DEBORAH OLUWANIFEMI", matric: "20220294331" },
  { name: "MUBARAK OLAMILEKAN BELLO", matric: "20220294333" },
  { name: "OLATUNJI TOLUWALASE TIMOTHY", matric: "20220294335" },
  { name: "ABODUNRIN MUBARAQ OLAOLU", matric: "20220294336" },
  { name: "ROKEEB ADEDAYO ABIOJA", matric: "20220294339" },
  { name: "ADEYEMI FARUK OLAMILEKAN", matric: "20220294341" },
  { name: "USMAN ADETOLA SAKA", matric: "20220294342" },
  { name: "REJOICE TEMITOPE ISIDORE", matric: "20220294343" },
  { name: "OBISESAN AWWAL AYOBAMI", matric: "20220294344" },
  { name: "EMMANUEL OLADIPUPO ADESHINA", matric: "20220294346" },
  { name: "AJIBOLA JULIUS AFOLABO", matric: "20220294347" },
  { name: "AKINBOLA AWWAL ADEWALE", matric: "20220294348" },
  { name: "ALABI AYOMIDE IBRAHIM", matric: "20220294349" },
  { name: "ADEBESHIN ABDUL BASIT IYANUOLUWA", matric: "20220294351" },
  { name: "GOLD ISAAC BRIGHT", matric: "20220294352" },
]

function getInitials(name: string) {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`
  }
  return name.substring(0, 2)
}

function getGradient(name: string) {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-400 to-rose-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-blue-500",
    "from-teal-400 to-emerald-500",
    "from-amber-400 to-orange-500",
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

function formatName(name: string) {
  return name
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function TeamCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', checkScroll)
      return () => ref.removeEventListener('scroll', checkScroll)
    }
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10
        
        if (isAtEnd) {
          // Reset to beginning
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
          setCurrentIndex(0)
        } else {
          // Scroll right
          scrollRef.current.scrollBy({
            left: 320,
            behavior: 'smooth'
          })
          setCurrentIndex(prev => prev + 1)
        }
      }
    }, 5000) // Auto-scroll every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      if (direction === 'right') {
        setCurrentIndex(prev => prev + 1)
      } else {
        setCurrentIndex(prev => Math.max(0, prev - 1))
      }
    }
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 ${
          canScrollLeft ? 'opacity-100 hover:bg-purple-50 hover:shadow-2xl' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6 text-purple-600" />
      </button>
      
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 ${
          canScrollRight ? 'opacity-100 hover:bg-purple-50 hover:shadow-2xl' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6 text-purple-600" />
      </button>

      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-[5] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-[5] pointer-events-none" />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide px-12 py-6 -mx-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {members.map((member, i) => (
          <MemberCard key={member.matric} member={member} index={i} />
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: Math.ceil(members.length / 4) }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === Math.floor(currentIndex / 4)
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 w-8'
                : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </div>

      {/* Member Count */}
      <div className="text-center mt-6">
        <span className="inline-flex items-center gap-2 text-sm text-gray-600 font-medium">
          <span className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse"></span>
          {members.length} talented students
        </span>
      </div>
    </div>
  )
}

function MemberCard({ member, index }: { member: { name: string; matric: string }, index: number }) {
  const initials = getInitials(member.name)
  const gradient = getGradient(member.name)
  const formattedName = formatName(member.name)
  const nameParts = formattedName.split(" ")
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]

  return (
    <div 
      className="flex-shrink-0 w-[240px] group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 h-full hover:scale-105 hover:-translate-y-2">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
          {initials}
        </div>
        
        {/* Name */}
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
          {firstName} {lastName}
        </h3>
        
        {/* Matric */}
        <p className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded-lg inline-block">
          {member.matric}
        </p>

        {/* Decorative Element */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        </div>
      </div>
    </div>
  )
}
