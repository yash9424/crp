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
        // Redirect based on tenant type
        const tenantType = session.user.tenantType || 'retail'
        switch (tenantType) {
          case 'manufacturer':
            router.push("/manufacturer")
            break
          case 'distributor':
            router.push("/distributor")
            break
          default:
            router.push("/tenant")
        }
      }
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [session, status, router])

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>
}