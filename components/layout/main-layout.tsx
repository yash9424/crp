"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  userType?: "super-admin" | "retail"
}

export function MainLayout({ children, title, userType = "retail" }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar userType={userType} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} userType={userType} />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
