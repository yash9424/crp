import { MongoClient, Db, Collection } from 'mongodb'

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'
const dbName = 'erp_system'

let client: MongoClient
let db: Db

export async function connectDB() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
  }
  return db
}

export async function getTenantsCollection(): Promise<Collection> {
  const database = await connectDB()
  return database.collection('tenants')
}

export async function getUsersCollection(): Promise<Collection> {
  const database = await connectDB()
  return database.collection('users')
}