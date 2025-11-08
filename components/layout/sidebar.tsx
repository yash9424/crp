"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFeatureAccess } from "@/hooks/use-feature-access"
import { FeatureKey } from "@/lib/feature-permissions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  ChevronDown,
  Calendar,
  Calculator,
  Home,
  TrendingUp,
  Cog,
  LifeBuoy,
} from "lucide-react"

interface SidebarProps {
  userType?: "super-admin" | "retail"
}

const superAdminNavItems = [
  { title: "Dashboard", href: "/super-admin", icon: LayoutDashboard, group: "core" },
  { title: "Tenants", href: "/super-admin/tenants", icon: Building2, group: "core" },
  { title: "Business Types", href: "/super-admin/business-types", icon: Package, group: "core" },
  { title: "Field Requests", href: "/super-admin/field-requests", icon: MessageSquare, group: "core" },
  { title: "Plan Management", href: "/super-admin/plans", icon: CreditCard, group: "core" },
  { title: "Plan Requests", href: "/super-admin/plan-requests", icon: HelpCircle, group: "core" },
  { title: "Feature Matrix", href: "/super-admin/feature-matrix", icon: Settings, group: "core" },
  { title: "Video Tutorials", href: "/super-admin/tutorials", icon: HelpCircle, group: "core" },
  { title: "Referral System", href: "/super-admin/referrals", icon: Gift, group: "core" },
  { title: "Admin Users", href: "/super-admin/users", icon: Users, group: "core" },
  { title: "Settings", href: "/super-admin/settings", icon: Cog, group: "core" },
]

const retailNavItems = [
  // Core Operations
  { title: "Dashboard", href: "/tenant", icon: LayoutDashboard, feature: "dashboard" as FeatureKey, group: "core" },
  
  // Sales
  { title: "Inventory", href: "/tenant/inventory", icon: Package, feature: "inventory" as FeatureKey, group: "sales" },
  { title: "Point of Sale", href: "/tenant/pos", icon: ShoppingCart, feature: "pos" as FeatureKey, group: "sales" },
  { title: "Customers", href: "/tenant/customers", icon: UserCheck, feature: "customers" as FeatureKey, group: "sales" },
  { title: "Bills & Receipts", href: "/tenant/bills", icon: Receipt, feature: "bills" as FeatureKey, group: "sales" },
  { title: "Purchases", href: "/tenant/purchases", icon: Package, feature: "purchases" as FeatureKey, group: "sales" },
  
  // Human Resources
  { title: "HR & Staff", href: "/tenant/hr", icon: Users, feature: "hr" as FeatureKey, group: "hr" },
  { title: "Commission", href: "/tenant/commission", icon: Calculator, feature: "hr" as FeatureKey, group: "hr" },
  { title: "Leaves", href: "/tenant/leaves", icon: Calendar, feature: "leaves" as FeatureKey, group: "hr" },
  { title: "Salary", href: "/tenant/salary", icon: Calculator, feature: "salary" as FeatureKey, group: "hr" },
  
  // Analytics & Finance
  { title: "Reports & Analytics", href: "/tenant/reports", icon: BarChart3, feature: "reports" as FeatureKey, group: "analytics" },
  { title: "Expenses", href: "/tenant/expenses", icon: Receipt, feature: "expenses" as FeatureKey, group: "analytics" },
  
  // Configuration
  { title: "Store Settings", href: "/tenant/settings", icon: Settings, feature: "settings" as FeatureKey, group: "config" },
  { title: "Field Settings", href: "/tenant/field-settings", icon: Settings, feature: "settings" as FeatureKey, group: "config" },
  { title: "Dropdown Settings", href: "/tenant/dropdown-settings", icon: Settings, feature: "dropdownSettings" as FeatureKey, group: "config" },
  
  // Support & Upgrade
  { title: "Help & Support", href: "/tenant/help", icon: HelpCircle, feature: "dashboard" as FeatureKey, group: "support" },
  { title: "Upgrade Plan", href: "/tenant/upgrade-plan", icon: CreditCard, feature: "dashboard" as FeatureKey, group: "support" },
]



export function Sidebar({ userType = "retail" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { hasFeature, loading, allowedFeatures } = useFeatureAccess()
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: false,
    sales: false,
    hr: false,
    analytics: false,
    config: false,
    support: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newState = { core: false, sales: false, hr: false, analytics: false, config: false, support: false }
      newState[section as keyof typeof newState] = prev[section] ? false : true
      return newState
    })
  }

  const getNavItems = () => {
    switch (userType) {
      case "super-admin":
        return superAdminNavItems
      case "retail":
      default:
        return retailNavItems.filter(item => {
          if (loading) return true
          if (item.feature === 'dashboard') return true
          return hasFeature(item.feature)
        })
    }
  }

  const navItems = useMemo(() => getNavItems(), [userType, hasFeature, loading])

  // Update open section when pathname changes
  useEffect(() => {
    const currentItem = navItems.find(item => pathname === item.href)
    const currentSection = currentItem?.group
    
    if (currentSection) {
      setOpenSections(prev => {
        const newState = { core: false, sales: false, hr: false, analytics: false, config: false, support: false }
        newState[currentSection as keyof typeof newState] = true
        return newState
      })
    }
  }, [pathname])

  if (userType === "retail" && loading) {
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
      className={cn("relative flex flex-col h-screen border-r bg-white text-gray-800 transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex h-16 items-center justify-between px-4 py-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800"> ERP</h2>
              <p className="text-xs text-gray-500">
                {userType === "super-admin" ? "Super Admin Panel" : "Retail Dashboard"}
              </p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="ml-auto text-gray-500 hover:text-gray-800 hover:bg-gray-100">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Scrollable Menu Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-3 py-6">
          <nav className="space-y-4">
            {/* Core Operations */}
            <Collapsible open={openSections.core} onOpenChange={() => toggleSection('core')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100 px-2 py-2">
                  <div className="flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    {!collapsed && "Core"}
                  </div>
                  {!collapsed && <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.core && "rotate-180")} />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {navItems.filter(item => item.group === 'core').map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200",
                          collapsed && "px-2",
                          isActive && "bg-red-50 text-red-600 border-r-2 border-red-500",
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", !collapsed && "mr-3", isActive && "text-red-600")} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </Button>
                    </Link>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Customer & Sales - Only for retail users */}
            {userType === "retail" && (
              <Collapsible open={openSections.sales} onOpenChange={() => toggleSection('sales')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100 px-2 py-2">
                    <div className="flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {!collapsed && "Sales"}
                    </div>
                    {!collapsed && <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.sales && "rotate-180")} />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {navItems.filter(item => item.group === 'sales').map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200",
                            collapsed && "px-2",
                            isActive && "bg-red-50 text-red-600 border-r-2 border-red-500",
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", !collapsed && "mr-3", isActive && "text-red-600")} />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </Button>
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Human Resources - Only for retail users */}
            {userType === "retail" && (
              <Collapsible open={openSections.hr} onOpenChange={() => toggleSection('hr')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100 px-2 py-2">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {!collapsed && "Human Resources"}
                    </div>
                    {!collapsed && <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.hr && "rotate-180")} />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {navItems.filter(item => item.group === 'hr').map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200",
                            collapsed && "px-2",
                            isActive && "bg-red-50 text-red-600 border-r-2 border-red-500",
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", !collapsed && "mr-3", isActive && "text-red-600")} />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </Button>
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Analytics & Finance - Only for retail users */}
            {userType === "retail" && (
              <Collapsible open={openSections.analytics} onOpenChange={() => toggleSection('analytics')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100 px-2 py-2">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {!collapsed && "Analytics & Finance"}
                    </div>
                    {!collapsed && <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.analytics && "rotate-180")} />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {navItems.filter(item => item.group === 'analytics').map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200",
                            collapsed && "px-2",
                            isActive && "bg-red-50 text-red-600 border-r-2 border-red-500",
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", !collapsed && "mr-3", isActive && "text-red-600")} />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </Button>
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Configuration - Only for retail users */}
            {userType === "retail" && (
              <Collapsible open={openSections.config} onOpenChange={() => toggleSection('config')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100 px-2 py-2">
                    <div className="flex items-center">
                      <Cog className="w-4 h-4 mr-2" />
                      {!collapsed && "Configuration"}
                    </div>
                    {!collapsed && <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.config && "rotate-180")} />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {navItems.filter(item => item.group === 'config').map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200",
                            collapsed && "px-2",
                            isActive && "bg-red-50 text-red-600 border-r-2 border-red-500",
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", !collapsed && "mr-3", isActive && "text-red-600")} />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </Button>
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Support & Upgrade - Only for retail users */}
            {userType === "retail" && (
              <Collapsible open={openSections.support} onOpenChange={() => toggleSection('support')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100 px-2 py-2">
                    <div className="flex items-center">
                      <LifeBuoy className="w-4 h-4 mr-2" />
                      {!collapsed && "Support & Upgrade"}
                    </div>
                    {!collapsed && <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.support && "rotate-180")} />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {navItems.filter(item => item.group === 'support').map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200",
                            collapsed && "px-2",
                            isActive && "bg-red-50 text-red-600 border-r-2 border-red-500",
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", !collapsed && "mr-3", isActive && "text-red-600")} />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </Button>
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </nav>
        </ScrollArea>
      </div>
      
      {/* Fixed Footer */}
      {!collapsed && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-xs text-gray-500">
            Powered by{" "}
            <a 
              href="https://www.technovatechnologies.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Technova Technologies
            </a>
          </div>
        </div>
      )}
    </div>
  )
}