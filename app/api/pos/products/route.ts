import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
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
      originalPrice: product.originalPrice || product.price || 0,
      barcode: product.barcode || product.sku || 'No Barcode',
      category: product.category || 'General',
      size: Array.isArray(product.sizes) ? (product.sizes[0] || 'N/A') : (product.sizes || 'N/A'),
      color: Array.isArray(product.colors) ? (product.colors[0] || 'N/A') : (product.colors || 'N/A'),
      brand: product.brand || 'N/A',
      material: product.material || 'N/A',
      stock: product.stock || 0,
      image: product.image
    }))
    
    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('POS products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}