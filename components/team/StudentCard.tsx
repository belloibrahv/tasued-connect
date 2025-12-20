import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { TASUED_IMAGES } from "@/lib/constants"

interface StudentCardProps {
  name: string
  matric: string
  index: number
}

export function StudentCard({ name, matric, index }: StudentCardProps) {
  // Use placeholder image if actual student photo is not available
  // In a real scenario, we would map matric numbers to specific image files
  const photoUrl = `/images/team/member-${index + 1}.jpg` // Fallback logic would be needed

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300 border-primary/10 group">
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <Image
            src={TASUED_IMAGES.studentsPhoto} // Using generic student photo for now as per instructions
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white text-sm font-medium">Computer Science</span>
          </div>
        </div>
        <CardContent className="p-4 text-center">
          <h3 className="font-bold text-gray-900 truncate" title={name}>{name}</h3>
          <p className="text-sm text-primary font-mono mt-1">{matric}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
