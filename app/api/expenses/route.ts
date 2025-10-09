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

    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')
    const expenses = await expensesCollection.find({}).sort({ createdAt: -1 }).toArray()
    
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      id: expense._id.toString()
    }))
    
    return NextResponse.json(formattedExpenses)
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