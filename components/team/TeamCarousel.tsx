"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useAnimation, useInView } from "framer-motion"
import { TEAM_MEMBERS } from "@/lib/constants"
import { StudentCard } from "./StudentCard"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TeamCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-scroll logic could be added here

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Meet the Team</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The brilliant minds behind this project from the Department of Computer Science,
            TASUED (Class of 2024/2025).
          </p>
        </div>

        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md hidden md:flex hover:bg-white"
            onClick={scrollLeft}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {TEAM_MEMBERS.map((student, index) => (
              <div
                key={student.matric}
                className="min-w-[280px] md:min-w-[300px] snap-center"
              >
                <StudentCard
                  name={student.name}
                  matric={student.matric}
                  index={index}
                />
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md hidden md:flex hover:bg-white"
            onClick={scrollRight}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
