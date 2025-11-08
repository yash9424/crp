const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'

async function initAdminUsers() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    const db = client.db('erp_system')
    
    const sampleUsers = [
      {
        name: "Admin User 1",
        email: "admin1@clothingerp.com",
        phone: "+91 9876543210",
        role: "Super Admin",
        status: "Active",
        lastLogin: "2024-09-24 10:30 AM",
        createdAt: "2024-01-15",
        permissions: ["All Access"],
        password: "admin123"
      },
      {
        name: "Support Manager",
        email: "support@clothingerp.com",
        phone: "+91 9876543211",
        role: "Support Admin",
        status: "Active",
        lastLogin: "2024-09-24 09:15 AM",
        createdAt: "2024-02-20",
        permissions: ["Support", "Tickets", "Users"],
        password: "support123"
      }
    ]
    
    await db.collection('admin_users').insertMany(sampleUsers)
    console.log('Admin users collection created successfully')
  } finally {
    await client.close()
  }
}

initAdminUsers().catch(console.error)