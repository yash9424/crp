import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'

export const GET = withFeatureAccess('expenses')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')
    const total = await expensesCollection.countDocuments({})
    const expenses = await expensesCollection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      id: expense._id.toString()
    }))
    
    return NextResponse.json({
      data: formattedExpenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
})

export const POST = withFeatureAccess('expenses')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, amount, category, description, date } = body

    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')
    
    const expense = {
      title: title || 'Untitled Expense',
      amount: parseFloat(amount) || 0,
      category: category || 'General',
      description: description || '',
      date: date ? new Date(date) : new Date(),
      tenantId: session.user.tenantId,
      createdBy: session.user.name || 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await expensesCollection.insertOne(expense)
    
    return NextResponse.json({ ...expense, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
})