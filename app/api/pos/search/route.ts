import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    const searchFilter = {
      $and: [
        { stock: { $gt: 0 } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { sku: { $regex: query, $options: 'i' } },
            { barcode: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }

    const products = await inventoryCollection.find(searchFilter).limit(20).toArray()
    
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
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
  }
}