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
        console.log('Auth attempt for:', credentials?.email)
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        // Check super admin first
        if (credentials.email === superAdmin.email && credentials.password === superAdmin.password) {
          console.log('Super admin login successful')
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
          
          if (tenant) {
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
              storeName: tenant.name,
              tenantType: tenant.tenantType || 'retail'
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          // Fallback for demo purposes - allow manufacturer login
          if (credentials.email === 'manufacturer@demo.com' && credentials.password === 'demo123') {
            console.log('Demo manufacturer login')
            return {
              id: 'demo-manufacturer',
              email: 'manufacturer@demo.com',
              name: 'Demo Manufacturer',
              role: 'tenant-admin',
              tenantId: 'demo-manufacturer',
              storeName: 'Demo Manufacturing Co.',
              tenantType: 'manufacturer'
            }
          }
          // Demo factory manager login
          if (credentials.email === 'manager@demo.com' && credentials.password === 'demo123') {
            console.log('Demo factory manager login')
            return {
              id: 'demo-factory-manager',
              email: 'manager@demo.com',
              name: 'Demo Factory Manager',
              role: 'factory-manager',
              tenantId: 'demo-manufacturer',
              factoryId: 'demo-factory-1',
              storeName: 'Demo Factory Manager',
              tenantType: 'manufacturer'
            }
          }

          console.log('No matching credentials found for:', credentials.email)
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
        token.tenantType = user.tenantType
        token.factoryId = user.factoryId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.storeName = token.storeName as string
        session.user.tenantType = token.tenantType as string
        session.user.factoryId = token.factoryId as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  session: { strategy: "jwt" }
}