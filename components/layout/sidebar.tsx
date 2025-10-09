"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFeatureAccess } from "@/hooks/use-feature-access"
import { FeatureKey } from "@/lib/feature-permissions"
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
  { title: "Plan Requests", href: "/super-admin/plan-requests", icon: HelpCircle },
  { title: "Feature Matrix", href: "/super-admin/feature-matrix", icon: Settings },
  { title: "Referral System", href: "/super-admin/referrals", icon: Gift },
  { title: "Admin Users", href: "/super-admin/users", icon: Users },
]

// Updated navigation for clothing store management with feature keys
const tenantAdminNavItems = [
  { title: "Dashboard", href: "/tenant", icon: LayoutDashboard, feature: "dashboard" as FeatureKey },
  { title: "Inventory", href: "/tenant/inventory", icon: Package, feature: "inventory" as FeatureKey },
  { title: "Fashion POS", href: "/tenant/pos", icon: ShoppingCart, feature: "pos" as FeatureKey },
  { title: "Customers", href: "/tenant/customers", icon: UserCheck, feature: "customers" as FeatureKey },
  { title: "Purchases", href: "/tenant/purchases", icon: Package, feature: "purchases" as FeatureKey },
  { title: "HR & Staff", href: "/tenant/hr", icon: Users, feature: "hr" as FeatureKey },
  { title: "Commission", href: "/tenant/commission", icon: Calculator, feature: "hr" as FeatureKey },
  { title: "Leaves", href: "/tenant/leaves", icon: Calendar, feature: "leaves" as FeatureKey },
  { title: "Salary", href: "/tenant/salary", icon: Calculator, feature: "salary" as FeatureKey },
  { title: "Bills", href: "/tenant/bills", icon: Receipt, feature: "bills" as FeatureKey },
  { title: "Analytics & Reports", href: "/tenant/reports", icon: BarChart3, feature: "reports" as FeatureKey },
  { title: "Expenses", href: "/tenant/expenses", icon: Receipt, feature: "expenses" as FeatureKey },
  { title: "Dropdown Settings", href: "/tenant/dropdown-settings", icon: Settings, feature: "dropdownSettings" as FeatureKey },
  { title: "Settings", href: "/tenant/settings", icon: Settings, feature: "settings" as FeatureKey },
  { title: "Upgrade Plan", href: "/tenant/upgrade-plan", icon: CreditCard, feature: "dashboard" as FeatureKey },
]

export function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { hasFeature, loading, allowedFeatures } = useFeatureAccess()

  console.log('Sidebar - userRole:', userRole)
  console.log('Sidebar - allowedFeatures:', allowedFeatures)
  console.log('Sidebar - loading:', loading)

  const navItems = userRole === "super-admin" 
    ? superAdminNavItems 
    : tenantAdminNavItems.filter(item => {
        if (loading) return true
        if (item.feature === 'dashboard') return true
        return hasFeature(item.feature)
      })

  if (userRole === "tenant-admin" && loading) {
    return (
      <div className="w-64 border-r bg-card">
        <div className="flex h-16 items-center justify-center border-b">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

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
      
      {!collapsed && (
        <div className="p-3 border-t">
          <div className="text-center text-xs text-muted-foreground">
            Product of{" "}
            <a 
              href="https://www.technovatechnologies.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black hover:text-black "
            >
              Technova Technologies
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
