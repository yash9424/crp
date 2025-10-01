import { NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const products = await inventoryCollection.find({ 
      stock: { $gt: 0 }
    }).toArray()
    
    console.log('POS Products found:', products.length)
    console.log('Sample product:', products[0])
    
    const formattedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name || 'Unnamed Product',
      sku: product.sku || 'No SKU',
      price: product.price || 0,
      barcode: product.barcode || product.sku || 'No Barcode',
      category: product.category || 'General',
      size: product.size || 'N/A',
      color: product.color || 'N/A',
      stock: product.stock || 0,
      image: product.image
    }))
    
    return NextResponse.json(formattedProducts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}