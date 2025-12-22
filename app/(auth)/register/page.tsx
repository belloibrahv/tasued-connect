"use client"

import Link from "next/link"
import Image from "next/image"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { Scan, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://tasued.edu.ng/web/wp-content/uploads/2020/07/DSC_0395.jpg"
            alt="TASUED Students"
            fill
            className="object-cover opacity-20"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16">
          <div className="max-w-md">
            {/* TASUED Logo */}
            <div className="flex items-center gap-4 mb-8">
              <Image 
                src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3-1.png" 
                alt="TASUED Logo"
                width={64}
                height={64}
                className="h-16 w-auto bg-white rounded-xl p-2"
              />
              <div>
                <h3 className="text-white font-bold text-xl">TASUED</h3>
                <p className="text-gray-300 text-sm">Department of Computer Science</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              Join FaceCheck Today
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Create your account and start using face-verified attendance. Register once, scan to mark attendance forever.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                "Quick 30-second face registration",
                "Instant attendance verification",
                "No more proxy signing",
                "Real-time attendance tracking"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  </div>
                  <p className="text-gray-300">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Scan className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">FaceCheck</span>
            </Link>
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </header>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
              <p className="text-gray-500">
                Sign up to start using face-verified attendance
              </p>
            </div>
            
            <RegisterForm />
            
            <p className="text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-600 font-semibold hover:text-purple-700 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
