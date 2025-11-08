# 🍃 MongoDB Setup Guide

## ✅ Clean Project Structure Created

Your project now has a clean MongoDB structure:

```
📁 Project Structure
├── prisma/
│   └── schema.prisma          # MongoDB schema
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── mongodb.ts            # MongoDB connection
│   └── seed-mongo.ts         # Sample data
├── app/api/tenants/          # CRUD API routes
└── .env.local                # Environment variables
```

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Free MongoDB Database
1. Go to: https://cloud.mongodb.com
2. Sign up for free account
3. Create free cluster (M0 Sandbox)
4. Create database user
5. Get connection string

### Step 2: Update Connection String
Replace in `.env.local`:
```
DATABASE_URL="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/erp_system?retryWrites=true&w=majority"
```

### Step 3: Setup Database
```bash
npx prisma db push
npx tsx lib/seed-mongo.ts
```

## 📊 Database Details
- **Database Name:** `erp_system`
- **Collections:** `User`, `Tenant`
- **Sample Data:** 3 tenants, 3 users

## 🔑 Login Credentials
- **Super Admin:** superadmin@erp.com / password123
- **Tenant:** tenant@store.com / password123

## 🎯 Features Ready
✅ Tenant CRUD operations
✅ User authentication
✅ Super admin dashboard
✅ Clean MongoDB structure
✅ Sample data included

Once you complete Step 1-2, your MongoDB database will be ready!