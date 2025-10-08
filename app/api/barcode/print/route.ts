import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productIds } = await request.json()
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Product IDs required' }, { status: 400 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    

    const products = await inventoryCollection.find({
      _id: { $in: productIds.map(id => new ObjectId(id)) }
    }).toArray()

    const barcodeData = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      sku: product.sku
    }))

    return NextResponse.json({ barcodes: barcodeData })
  } catch (error) {
    console.error('Barcode print error:', error)
    return NextResponse.json({ error: 'Failed to generate barcode data' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const product = await inventoryCollection.findOne({ _id: new ObjectId(productId) })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const barcodeData = {
      id: product._id.toString(),
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      sku: product.sku
    }

    return NextResponse.json(barcodeData)
  } catch (error) {
    console.error('Barcode fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch barcode data' }, { status: 500 })
  }
}