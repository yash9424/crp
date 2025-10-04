import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectDB } from "./database"
import bcrypt from "bcryptjs"

// Super admin user
const superAdmin = {
  id: "1",
  email: "superadmin@erp.com",
  password: "password123",
  name: "Super Admin",
  role: "super-admin"
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Check super admin first
        if (credentials.email === superAdmin.email && credentials.password === superAdmin.password) {
          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: superAdmin.role,
            tenantId: null,
            storeName: null
          }
        }

        // Check tenant users
        try {
          const db = await connectDB()
          const tenantsCollection = db.collection('tenants')
          
          // First check if tenant exists with this email
          const tenant = await tenantsCollection.findOne({ 
            email: credentials.email
          })
          
          if (!tenant) return null
          
          // Verify password first
          const isValidPassword = await bcrypt.compare(credentials.password, tenant.password)
          if (!isValidPassword) return null
          
          // Check if account is inactive after password verification
          if (tenant.status !== 'active') {
            return null
          }
          
          return {
            id: tenant._id.toString(),
            email: tenant.email,
            name: tenant.name,
            role: 'tenant-admin',
            tenantId: tenant._id.toString(),
            storeName: tenant.name
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
        token.storeName = user.storeName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.storeName = token.storeName as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  session: { strategy: "jwt" }
}