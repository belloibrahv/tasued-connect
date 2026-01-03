"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Database,
  Bell,
  Save,
  Globe,
  Lock,
  Smartphone,
  Mail,
  Zap,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(true)

  // Settings State
  const [settings, setSettings] = useState({
    institution_name: "Tai Solarin University of Education",
    platform_abbreviation: "AttendX",
    maintenance_mode: false,
    current_semester: "First Semester 2024/2025",
    exam_start_date: "",
    min_attendance: 75,
    late_threshold: 15,
    auto_close_sessions: true,
    biometric_enforcement: false,
    password_complexity: "standard",
    hod_mode: false
  })

  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('system_settings').select('*')
      if (error) throw error

      const newSettings = { ...settings }
      data.forEach((s: any) => {
        if (Object.keys(settings).includes(s.key)) {
          // values are JSONB
          (newSettings as any)[s.key] = s.value
        }
      })
      setSettings(newSettings)
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, settings])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        category: 'system', // Simplified
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase.from('system_settings').upsert(updates, { onConflict: 'key' })
      if (error) throw error

      toast.success("Global configurations synchronized successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Reset all system settings to default values?")) return
    setSettings({
      institution_name: "Tai Solarin University of Education",
      platform_abbreviation: "AttendX",
      maintenance_mode: false,
      current_semester: "First Semester 2024/2025",
      exam_start_date: "",
      min_attendance: 75,
      late_threshold: 15,
      auto_close_sessions: true,
      biometric_enforcement: false,
      password_complexity: "standard",
      hod_mode: false
    })
    toast.success("Settings reset to defaults locally. Save to persist.")
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-medium font-heading">Accessing System Engine...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold mb-4 bg-primary/5">
            System Configuration
          </Badge>
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight">University Core</h1>
          <p className="text-gray-500 font-medium">Calibrating global thresholds, security protocols, and academic parameters.</p>
        </div>
        <Button
          className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 bg-gray-900 hover:bg-black font-bold transition-all"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Synchronize Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-white/50 backdrop-blur-sm border p-1 rounded-2xl h-16 w-full md:w-fit shadow-inner overflow-x-auto">
          {[
            { id: 'general', icon: Globe, label: 'Environment' },
            { id: 'attendance', icon: Zap, label: 'Analytics' },
            { id: 'security', icon: Lock, label: 'Security' },
            { id: 'audit', icon: History, label: 'Logs' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-xl px-8 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all h-full"
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <TabsContent value="general" className="mt-0 space-y-8 animate-in slide-in-from-left-4 duration-500">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
                <CardHeader className="p-8 border-b border-gray-50 bg-gray-50/20">
                  <CardTitle className="text-xl font-bold tracking-tight">University Branding</CardTitle>
                  <CardDescription>Customize the core identity of your AttendX instance.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Institution Name</Label>
                      <Input
                        value={settings.institution_name}
                        onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                        className="h-12 rounded-xl bg-gray-50 border-none font-medium shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Platform ID</Label>
                      <Input
                        value={settings.platform_abbreviation}
                        onChange={(e) => setSettings({ ...settings, platform_abbreviation: e.target.value })}
                        className="h-12 rounded-xl bg-gray-50 border-none font-medium shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100/50 flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-extrabold text-rose-900 tracking-tight">Maintenance Isolation</p>
                        <p className="text-xs font-medium text-rose-700/60">Suspend all client interactions for critical infrastructure updates.</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.maintenance_mode}
                      onCheckedChange={(v) => setSettings({ ...settings, maintenance_mode: v })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
                <CardHeader className="p-8 border-b border-gray-50 bg-gray-50/20">
                  <CardTitle className="text-xl font-bold tracking-tight">Academic Cycle</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Current Active Term</Label>
                      <Input
                        value={settings.current_semester}
                        onChange={(e) => setSettings({ ...settings, current_semester: e.target.value })}
                        className="h-12 rounded-xl bg-gray-50 border-none font-medium shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Global Exam Date (Start)</Label>
                      <Input
                        type="date"
                        value={settings.exam_start_date}
                        onChange={(e) => setSettings({ ...settings, exam_start_date: e.target.value })}
                        className="h-12 rounded-xl bg-gray-50 border-none font-medium shadow-inner"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-0 space-y-8 animate-in slide-in-from-left-4 duration-500">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
                <CardHeader className="p-8 border-b border-gray-50 bg-gray-50/20">
                  <CardTitle className="text-xl font-bold tracking-tight">Thresholds & Automation</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Passing Threshold (%)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={settings.min_attendance}
                          onChange={(e) => setSettings({ ...settings, min_attendance: Number(e.target.value) })}
                          className="h-12 rounded-xl bg-gray-50 border-none font-bold shadow-inner"
                        />
                        <Badge className="bg-emerald-50 text-emerald-600 border-none h-12 px-4 rounded-xl font-bold">Recommended: 75%</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Lateness Limit (Minutes)</Label>
                      <Input
                        type="number"
                        value={settings.late_threshold}
                        onChange={(e) => setSettings({ ...settings, late_threshold: Number(e.target.value) })}
                        className="h-12 rounded-xl bg-gray-50 border-none font-bold shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-gray-900 tracking-tight">Auto-Terminate Sessions</p>
                      <p className="text-xs font-medium text-gray-500">Automatically close attendance windows when scheduled time expires.</p>
                    </div>
                    <Switch
                      checked={settings.auto_close_sessions}
                      onCheckedChange={(v) => setSettings({ ...settings, auto_close_sessions: v })}
                    />
                  </div>
                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-primary tracking-tight italic">HOD / Delegate Mode</p>
                      <p className="text-xs font-medium text-primary/60">Allow Heads of Department to override global session parameters.</p>
                    </div>
                    <Switch
                      checked={settings.hod_mode}
                      onCheckedChange={(v) => setSettings({ ...settings, hod_mode: v })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-8 animate-in slide-in-from-left-4 duration-500">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
                <CardHeader className="p-8 border-b border-gray-50 bg-gray-50/20">
                  <CardTitle className="text-xl font-bold tracking-tight">Identity & Biometrics</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-200">
                        <Smartphone className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-lg font-extrabold text-amber-900 tracking-tight">Facial Biometric Enforcement</p>
                        <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest mt-1">Status: Restricted Deployment</p>
                        <p className="text-sm font-medium text-amber-700/70 mt-3 max-w-sm leading-relaxed">Require students to complete a secure facial scan for every attendance session to eliminate proxy marking.</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.biometric_enforcement}
                      onCheckedChange={(v) => setSettings({ ...settings, biometric_enforcement: v })}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Access Complexity Strategy</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {['basic', 'standard', 'military'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setSettings({ ...settings, password_complexity: level })}
                          className={cn(
                            "h-16 rounded-[1.25rem] font-extrabold text-xs uppercase tracking-widest transition-all",
                            settings.password_complexity === level
                              ? "bg-gray-900 text-white shadow-xl shadow-gray-200"
                              : "bg-white border text-gray-400 hover:bg-gray-50"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Sidebar Metadata */}
          <div className="lg:col-span-1 space-y-10">
            <Card className="border-none shadow-2xl shadow-primary/20 rounded-[3rem] bg-gray-900 text-white p-10 relative overflow-hidden group">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <Database className="w-12 h-12 mb-8 text-primary" />
              <h3 className="text-2xl font-extrabold mb-2 tracking-tight">Cloud Architecture</h3>
              <p className="text-white/40 text-xs font-medium mb-10 leading-relaxed uppercase tracking-widest">Global Resource Allocation</p>

              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    <span>Supabase Storage</span>
                    <span className="text-primary">12% Capacity</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "12%" }} className="bg-primary h-full rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Engine Uptime</span>
                  <Badge className="bg-emerald-500 text-white border-none font-bold rounded-lg px-2 py-0.5 text-[9px]">99.9% ONLINE</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-12 h-14 border-white/10 hover:bg-white text-white hover:text-gray-900 font-extrabold rounded-2xl transition-all uppercase text-[10px] tracking-widest">
                Download Global Audit
              </Button>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-10 border border-gray-100 hover:border-rose-100 transition-all">
              <RotateCcw className="w-12 h-12 mb-8 text-rose-500/20" />
              <h3 className="text-gray-900 font-extrabold text-lg tracking-tight mb-2">Nuclear Options</h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed mb-10">Irreversible actions that affect the mission-critical university data architecture.</p>

              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-rose-600 hover:bg-rose-50 font-extrabold text-[10px] uppercase tracking-widest rounded-xl h-12 px-4 shadow-sm border border-rose-50"
                  onClick={handleReset}
                >
                  Force Environment Reset
                </Button>
                <Button variant="ghost" className="w-full justify-start text-rose-600 hover:bg-rose-50 font-extrabold text-[10px] uppercase tracking-widest rounded-xl h-12 px-4 shadow-sm border border-rose-50">
                  Purge Terminated Sessions
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
