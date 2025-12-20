"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldCheck, ArrowRight, QrCode, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-10"
      >
        <div className="relative flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center relative z-10">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-0 w-24 h-24 bg-primary/20 rounded-3xl blur-xl"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary font-bold tracking-widest uppercase text-xs">
            <Sparkles className="w-4 h-4" />
            Account Verified
          </div>
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight">
            You&apos;re All Set!
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed px-4">
            Your email has been successfully verified. You now have full access to the TASUED AttendX ecosystem.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/login">
            <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95">
              Sign In to Your Dashboard
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 pt-10 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-400">
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-bold text-gray-900">TASUED AttendX</span>
          </div>
          <p className="text-xs text-gray-400 max-w-[200px]">
            Secure biometric attendance for Nigeria&apos;s leading education hub.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
