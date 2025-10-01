"use client"

import type React from "react"
import { StoreProvider } from "@/lib/store-context"

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </StoreProvider>
  )
}
