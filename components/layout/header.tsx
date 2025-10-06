"use client"

import { useState, useEffect } from "react"
import { Bell, Search, User, LogOut, Settings, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signOut, useSession } from "next-auth/react"
import { useStore } from "@/lib/store-context"

interface HeaderProps {
  title: string
  userRole: "super-admin" | "tenant-admin"
}

export function Header({ title, userRole }: HeaderProps) {
  const { data: session } = useSession()
  const { storeName, tenantId } = useStore()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)


  useEffect(() => {
    setMounted(true)
    if (userRole === 'tenant-admin' && tenantId) {
      fetchNotifications()
    }
  }, [userRole, tenantId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?tenantId=${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.read).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  if (!mounted) {
    return (
      <header className="flex h-24 items-center justify-between border-b bg-card px-8 shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
          <Badge variant="outline" className="text-xs">
            {userRole === "super-admin" ? "Super Admin" : "Tenant Admin"}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-64 h-10 bg-gray-100 rounded animate-pulse" />
          <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
          <div className="w-32 h-8 bg-gray-100 rounded animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="flex h-24 items-center justify-between border-b bg-card px-8 shadow-sm">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
          {userRole === "tenant-admin" && storeName && (
            <p className="text-sm text-muted-foreground mt-1">{storeName}</p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {userRole === "super-admin" ? "Super Admin" : "Store Admin"}
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-10" />
        </div>



        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>

        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-black text-white text-sm font-medium">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{session?.user?.name || "Admin"}</span>
            <span className="text-xs text-muted-foreground">
              {userRole === "super-admin" ? "Super Admin" : storeName || "Store Admin"}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
