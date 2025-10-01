"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Gift,
  Settings,
  HelpCircle,
  ShoppingCart,
  Package,
  UserCheck,
  Receipt,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Calculator,
} from "lucide-react"

interface SidebarProps {
  userRole: "super-admin" | "tenant-admin"
}

const superAdminNavItems = [
  { title: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { title: "Tenants", href: "/super-admin/tenants", icon: Building2 },
  { title: "Plan Management", href: "/super-admin/plans", icon: CreditCard },
  { title: "Referral System", href: "/super-admin/referrals", icon: Gift },
  { title: "Admin Users", href: "/super-admin/users", icon: Users },
]

// Updated navigation for clothing store management
const tenantAdminNavItems = [
  { title: "Dashboard", href: "/tenant", icon: LayoutDashboard },
  { title: "Inventory", href: "/tenant/inventory", icon: Package },
  { title: "Fashion POS", href: "/tenant/pos", icon: ShoppingCart },
  { title: "Customers", href: "/tenant/customers", icon: UserCheck },
  { title: "Purchases", href: "/tenant/purchases", icon: Package },
  { title: "HR & Staff", href: "/tenant/hr", icon: Users },
  { title: "Leaves", href: "/tenant/leaves", icon: Calendar },
  { title: "Salary", href: "/tenant/salary", icon: Calculator },
  { title: "Bills", href: "/tenant/bills", icon: Receipt },
  { title: "Dropdown Settings", href: "/tenant/dropdown-settings", icon: Settings },
  { title: "Settings", href: "/tenant/settings", icon: Settings },
]

export function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = userRole === "super-admin" ? superAdminNavItems : tenantAdminNavItems

  return (
    <div
      className={cn("relative flex flex-col border-r bg-card transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Clothing ERP</h2>
              <p className="text-xs text-muted-foreground">
                {userRole === "super-admin" ? "Super Admin" : "Store Admin"}
              </p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed && "px-2",
                    isActive && "bg-secondary text-secondary-foreground",
                  )}
                >
                  <item.icon className={cn("w-4 h-4", !collapsed && "mr-3")} />
                  {!collapsed && item.title}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
