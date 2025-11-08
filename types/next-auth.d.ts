import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      tenantId: string
      storeName: string
      tenantType: string
    }
  }

  interface User {
    role: string
    tenantId: string | null
    storeName: string | null
    tenantType: string
  }
}