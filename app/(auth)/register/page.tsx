"use client"

import Link from "next/link"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { Scan } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Scan className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">FaceCheck</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Create account</h1>
            <p className="text-sm text-gray-500">
              Sign up to start using face-verified attendance
            </p>
          </div>
          
          <RegisterForm />
          
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
