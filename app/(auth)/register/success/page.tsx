"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Mail, ArrowRight, QrCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function SuccessContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'user'

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight">
            Account Created!
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Congratulations! Your <span className="text-primary font-bold capitalize">{role}</span> account for <span className="font-semibold text-gray-900">TASUED AttendX</span> is almost ready.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Verify your Email</h3>
            <p className="text-sm text-gray-500 px-4">
              We&apos;ve sent a magic link to your registered email address. Please click it to activate your account.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Link href="/login">
              <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
                Go to Login
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-xs text-gray-400">
              Didn&apos;t receive the email? <button className="text-primary font-semibold hover:underline">Resend activation link</button>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-8 text-gray-400">
          <QrCode className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-widest uppercase">TASUED AttendX Security</span>
        </div>
      </motion.div>
    </div>
  )
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
