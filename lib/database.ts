import { MongoClient, Db, Collection } from 'mongodb'

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'
const dbName = 'erp_system'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectDB(): Promise<Db> {
  try {
    if (db && client) {
      return db
    }
    
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
    console.log('MongoDB connected successfully to:', dbName)
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    console.error('Connection URI:', uri.replace(/\/\/.*@/, '//<credentials>@'))
    throw error
  }
}

export async function getTenantsCollection(): Promise<Collection> {
  const database = await connectDB()
  return database.collection('tenants')
}

export async function getUsersCollection(): Promise<Collection> {
  const database = await connectDB()
  return database.collection('users')
}