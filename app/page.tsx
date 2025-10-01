"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "super-admin") {
        router.push("/super-admin")
      } else {
        router.push("/tenant")
      }
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [session, status, router])

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>
}