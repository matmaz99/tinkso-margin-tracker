import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Manual expense interface for the API response
export interface ManualExpenseWithDetails {
  id: string
  description: string
  amount: number
  currency: string
  category: string
  projectId?: string
  projectName?: string
  expenseDate: string
  addedBy: string
  addedDate: string
  vatIncluded: boolean
  vatAmount?: number
  netAmount: number
  receiptUrl?: string
  created_at: string
  updated_at: string
}

export interface ExpenseStatistics {
  total: number
  totalAmount: number
  totalByCategory: {
    category: string
    amount: number
    count: number
  }[]
  totalByProject: {
    projectId: string
    projectName: string
    amount: number
    count: number
  }[]
  averageExpense: number
  recentExpensesCount: number
  currentMonthAmount: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStatistics = searchParams.get('includeStatistics') === 'true'
    const categoryFilter = searchParams.get('category')
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build query for manual expenses
    let expensesQuery = supabase
      .from('manual_expenses')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .order('expense_date', { ascending: false })

    // Apply filters
    if (categoryFilter) {
      expensesQuery = expensesQuery.eq('category', categoryFilter)
    }

    if (projectId) {
      expensesQuery = expensesQuery.eq('project_id', projectId)
    }

    if (startDate) {
      expensesQuery = expensesQuery.gte('expense_date', startDate)
    }

    if (endDate) {
      expensesQuery = expensesQuery.lte('expense_date', endDate)
    }

    // Execute query
    const { data: expensesData, error: expensesError } = await expensesQuery

    if (expensesError) {
      console.error('Error fetching manual expenses:', expensesError)
      throw new Error('Failed to fetch manual expenses')
    }

    // Transform expenses data
    const expenses: ManualExpenseWithDetails[] = (expensesData || []).map((expense: any) => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency || 'EUR',
      category: expense.category,
      projectId: expense.project_id,
      projectName: expense.projects?.name,
      expenseDate: expense.expense_date,
      addedBy: expense.added_by || 'System',
      addedDate: expense.created_at,
      vatIncluded: expense.vat_included || false,
      vatAmount: expense.vat_amount,
      netAmount: expense.net_amount || expense.amount,
      receiptUrl: expense.receipt_url,
      created_at: expense.created_at,
      updated_at: expense.updated_at
    }))

    // Calculate statistics if requested
    let statistics = {}
    if (includeStatistics) {
      // Get all expenses for comprehensive statistics
      const { data: allExpensesData, error: allExpensesError } = await supabase
        .from('manual_expenses')
        .select(`
          *,
          projects (
            id,
            name
          )
        `)

      if (allExpensesError) {
        console.error('Error fetching all expenses for stats:', allExpensesError)
        throw new Error('Failed to fetch expense statistics')
      }

      const allExpenses = allExpensesData || []
      const totalAmount = allExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

      // Group by category
      const categoryGroups = allExpenses.reduce((acc: any, expense: any) => {
        const category = expense.category || 'Uncategorized'
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 }
        }
        acc[category].amount += expense.amount
        acc[category].count += 1
        return acc
      }, {})

      const totalByCategory = Object.entries(categoryGroups).map(([category, data]: [string, any]) => ({
        category,
        amount: data.amount,
        count: data.count
      }))

      // Group by project
      const projectGroups = allExpenses.reduce((acc: any, expense: any) => {
        if (expense.project_id && expense.projects) {
          const projectKey = expense.project_id
          if (!acc[projectKey]) {
            acc[projectKey] = {
              projectId: expense.project_id,
              projectName: expense.projects.name,
              amount: 0,
              count: 0
            }
          }
          acc[projectKey].amount += expense.amount
          acc[projectKey].count += 1
        }
        return acc
      }, {})

      const totalByProject = Object.values(projectGroups)

      // Recent expenses (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentExpenses = allExpenses.filter((expense: any) => 
        new Date(expense.expense_date) >= thirtyDaysAgo
      )

      // Current month expenses
      const currentMonth = new Date()
      currentMonth.setDate(1)
      const currentMonthExpenses = allExpenses.filter((expense: any) => 
        new Date(expense.expense_date) >= currentMonth
      )
      const currentMonthAmount = currentMonthExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

      statistics = {
        total: allExpenses.length,
        totalAmount,
        totalByCategory,
        totalByProject,
        averageExpense: allExpenses.length > 0 ? totalAmount / allExpenses.length : 0,
        recentExpensesCount: recentExpenses.length,
        currentMonthAmount
      }
    }

    const response = {
      expenses,
      total: expenses.length,
      filters: {
        category: categoryFilter || null,
        projectId: projectId || null,
        startDate: startDate || null,
        endDate: endDate || null
      },
      ...(includeStatistics && { statistics }),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Expenses API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch expenses'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      description,
      amount,
      currency = 'EUR',
      category,
      projectId,
      expenseDate,
      vatIncluded = false,
      vatAmount,
      receiptUrl
    } = body

    // Validate required fields
    if (!description || !amount || !category || !expenseDate) {
      return NextResponse.json(
        { error: 'Missing required fields: description, amount, category, expenseDate' },
        { status: 400 }
      )
    }

    // Calculate net amount if VAT is included
    const netAmount = vatIncluded && vatAmount 
      ? amount - vatAmount 
      : amount

    // Insert expense
    const { data: expenseData, error: expenseError } = await supabase
      .from('manual_expenses')
      .insert({
        description,
        amount: parseFloat(amount),
        currency,
        category,
        project_id: projectId || null,
        expense_date: expenseDate,
        added_by: user.email || 'Unknown User',
        vat_included: vatIncluded,
        vat_amount: vatAmount ? parseFloat(vatAmount) : null,
        net_amount: parseFloat(netAmount),
        receipt_url: receiptUrl || null
      })
      .select()
      .single()

    if (expenseError) {
      console.error('Error creating expense:', expenseError)
      throw new Error('Failed to create expense')
    }

    return NextResponse.json({
      success: true,
      expense: expenseData,
      message: 'Manual expense created successfully'
    })

  } catch (error: any) {
    console.error('Expense creation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create expense'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      id,
      description,
      amount,
      currency,
      category,
      projectId,
      expenseDate,
      vatIncluded,
      vatAmount,
      receiptUrl
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required for updates' },
        { status: 400 }
      )
    }

    // Calculate net amount if VAT is included
    const netAmount = vatIncluded && vatAmount 
      ? amount - vatAmount 
      : amount

    // Update expense
    const { data: expenseData, error: expenseError } = await supabase
      .from('manual_expenses')
      .update({
        description,
        amount: parseFloat(amount),
        currency,
        category,
        project_id: projectId || null,
        expense_date: expenseDate,
        vat_included: vatIncluded,
        vat_amount: vatAmount ? parseFloat(vatAmount) : null,
        net_amount: parseFloat(netAmount),
        receipt_url: receiptUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (expenseError) {
      console.error('Error updating expense:', expenseError)
      throw new Error('Failed to update expense')
    }

    return NextResponse.json({
      success: true,
      expense: expenseData,
      message: 'Manual expense updated successfully'
    })

  } catch (error: any) {
    console.error('Expense update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update expense'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required for deletion' },
        { status: 400 }
      )
    }

    // Delete expense
    const { error: deleteError } = await supabase
      .from('manual_expenses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting expense:', deleteError)
      throw new Error('Failed to delete expense')
    }

    return NextResponse.json({
      success: true,
      message: 'Manual expense deleted successfully'
    })

  } catch (error: any) {
    console.error('Expense deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to delete expense'
      },
      { status: 500 }
    )
  }
}