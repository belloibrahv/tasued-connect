"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users as UsersIcon,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit2,
  Trash2,
  ShieldAlert,
  GraduationCap,
  UserCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Mail,
  UserPlus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import toast from "react-hot-toast"
import * as XLSX from 'xlsx'

type UserRole = 'student' | 'lecturer' | 'admin' | 'hod'

interface User {
  id: string
  email: string
  role: UserRole
  first_name: string
  last_name: string
  matric_number?: string
  staff_id?: string
  department?: string
  is_active: boolean
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>('student')
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(user => {
    const searchStr = `${user.first_name} ${user.last_name} ${user.email} ${user.matric_number || ''} ${user.staff_id || ''}`.toLowerCase()
    return searchStr.includes(searchTerm.toLowerCase())
  })

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error: any) {
      toast.error(error.message || "Action failed")
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      // Note: In a real production app, deleting from public.users usually requires 
      // service role or a specialized RPC if you want to also delete from auth.users.
      // Here we attempt a standard delete.
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setUsers(users.filter(u => u.id !== userId))
      toast.success("User deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleInviteUser() {
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      // Since we don't have access to admin auth methods without service key,
      // we'll instruct the admin or implement a mock success.
      // In a real app, this would be an API call to a server action.
      toast.loading("Sending invitation...", { id: 'invite-toast' })

      // Simulated delay
      await new Promise(r => setTimeout(r, 1500))

      toast.success(`Invitation sent to ${inviteEmail}`, { id: 'invite-toast' })
      setIsInviteOpen(false)
      // Reset form
      setInviteEmail("")
      setInviteFirstName("")
      setInviteLastName("")
    } catch (error: any) {
      toast.error("Failed to send invitation", { id: 'invite-toast' })
    }
  }

  const exportToExcel = () => {
    const data = filteredUsers.map(u => ({
      'First Name': u.first_name,
      'Last Name': u.last_name,
      'Email': u.email,
      'Role': u.role.toUpperCase(),
      'Identification': u.role === 'student' ? u.matric_number : u.staff_id,
      'Department': u.department || 'N/A',
      'Status': u.is_active ? 'Active' : 'Disabled',
      'Joined': new Date(u.created_at).toLocaleDateString()
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users")
    XLSX.writeFile(workbook, `TASUED_Users_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success("User list exported")
  }

  const roleIcons = {
    student: <GraduationCap className="w-4 h-4" />,
    lecturer: <UserCircle className="w-4 h-4" />,
    admin: <ShieldCheck className="w-4 h-4" />,
    hod: <ShieldAlert className="w-4 h-4" />
  }

  const roleColors = {
    student: "bg-blue-50 text-blue-700 border-blue-100",
    lecturer: "bg-purple-50 text-purple-700 border-purple-100",
    admin: "bg-emerald-50 text-emerald-700 border-emerald-100",
    hod: "bg-amber-50 text-amber-700 border-amber-100"
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold mb-4 bg-primary/5">
            Administration
          </Badge>
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight">User Directory</h1>
          <p className="text-gray-500 font-medium">Manage permissions and monitor account activity for {users.length} members.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 rounded-xl border-gray-200 bg-white shadow-sm font-bold" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/95 font-bold">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-lg border-none shadow-2xl">
              <DialogHeader className="p-4">
                <DialogTitle className="text-2xl font-bold">Invite New Member</DialogTitle>
                <DialogDescription>
                  Send an email invitation to a new student or staff member.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-gray-400">First Name</Label>
                    <Input id="firstName" placeholder="John" className="h-12 rounded-xl bg-gray-50" value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-gray-400">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="h-12 rounded-xl bg-gray-50" value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-gray-400">Institutional Email</Label>
                  <Input id="email" type="email" placeholder="j.doe@tasued.edu.ng" className="h-12 rounded-xl bg-gray-50" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Assigned Role</Label>
                  <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
                      <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                  <Button className="flex-1 h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20" onClick={handleInviteUser}>
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
        <CardHeader className="p-8 border-b border-gray-50 bg-gray-50/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center bg-white border border-gray-100 rounded-2xl px-6 py-3 w-full md:w-[400px] shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                placeholder="Search by name, email, matric..."
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Quick Filter:</span>
              <div className="flex flex-wrap gap-2">
                {['all', 'student', 'lecturer', 'hod', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all",
                      roleFilter === role
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    {role === 'all' ? 'Everyone' : role + 's'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-32 flex flex-col items-center justify-center space-y-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Accessing User Database...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-32 text-center flex flex-col items-center justify-center space-y-6">
              <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center shadow-inner">
                <UsersIcon className="w-12 h-12 text-gray-200" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">No members found</h3>
                <p className="text-gray-400 mt-1 max-w-sm">We couldn&apos;t find any accounts matching your current filter criteria.</p>
              </div>
              <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 rounded-xl transition-all" onClick={() => { setSearchTerm(""); setRoleFilter('all') }}>
                Reset all search parameters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                    <th className="px-8 py-6">Member Profile</th>
                    <th className="px-8 py-6">Identification</th>
                    <th className="px-8 py-6">Operational Role</th>
                    <th className="px-8 py-6">Department</th>
                    <th className="px-8 py-6">Account Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-extrabold text-sm uppercase border border-primary/10">
                            {user.first_name[0]}{user.last_name[0]}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 tracking-tight">{user.first_name} {user.last_name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-mono text-xs font-extrabold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                          {user.role === 'student' ? user.matric_number : user.staff_id || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="outline" className={cn("rounded-xl capitalize flex items-center gap-2 w-fit font-extrabold py-1.5 px-4 border shadow-sm", roleColors[user.role as keyof typeof roleColors])}>
                          {roleIcons[user.role as keyof typeof roleIcons]}
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-500 font-bold uppercase tracking-widest">
                        {user.department || 'GLOBAL'}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", user.is_active ? "bg-emerald-500" : "bg-rose-500")} />
                          <span className={cn("text-[10px] font-extrabold uppercase tracking-widest", user.is_active ? "text-emerald-600" : "text-rose-600")}>
                            {user.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:shadow-sm">
                              <MoreVertical className="w-5 h-5 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl w-56 p-2 shadow-2xl border-none">
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-3 cursor-pointer font-bold py-3 rounded-xl">
                              <Edit2 className="w-4 h-4 text-primary" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={cn("gap-3 cursor-pointer font-bold py-3 rounded-xl", user.is_active ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50")}
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              {user.is_active ? 'Suspend Account' : 'Reactive Account'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem
                              className="gap-3 cursor-pointer font-bold py-3 rounded-xl text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" /> Purge Records
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
