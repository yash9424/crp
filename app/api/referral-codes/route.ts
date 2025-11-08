import { NextRequest, NextResponse } from 'next/server'
import { getTenantsCollection } from '@/lib/database'

// GET - Validate referral code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({ valid: false, message: 'No code provided' })
    }
    
    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ referralCode: code })
    
    if (tenant) {
      return NextResponse.json({ 
        valid: true, 
        referrer: tenant.name,
        message: `Valid referral code from ${tenant.name}` 
      })
    } else {
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid referral code' 
      })
    }
  } catch (error) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Error validating referral code' 
    }, { status: 500 })
  }
}