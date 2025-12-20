"use client"

import Link from "next/link"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { QrCode } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-heading font-bold text-primary">TASUED AttendX</span>
        </Link>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Create your account</h1>
        <p className="mt-2 text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <RegisterForm />
    </div>
  )
}
