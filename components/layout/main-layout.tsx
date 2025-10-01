"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
  title: string
  userRole: "super-admin" | "tenant-admin"
}

export function MainLayout({ children, title, userRole }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} userRole={userRole} />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
