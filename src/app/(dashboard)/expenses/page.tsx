'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  BarChart3,
  CheckSquare,
  AlertTriangle,
  Settings,
  FileText,
  Target,
  Clock,
  RefreshCw
} from "lucide-react"

// Real-time expense data interfaces
interface ManualExpenseWithDetails {
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

interface ExpenseStatistics {
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

interface ProjectOption {
  id: string
  name: string
  status: string
}

const expenseCategories = [
  "Assets",
  "Tools",
  "Infrastructure", 
  "Professional Services",
  "Marketing",
  "Travel",
  "Miscellaneous",
  "Internal Costs"
]

export default function ManualExpensesPage() {
  const [expenses, setExpenses] = useState<ManualExpenseWithDetails[]>([])
  const [statistics, setStatistics] = useState<ExpenseStatistics | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterProject, setFilterProject] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingExpense, setEditingExpense] = useState<string | null>(null)

  // Form state for new/edit expense
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    currency: "EUR",
    category: "",
    projectId: "",
    expenseDate: new Date().toISOString().split('T')[0],
    vatIncluded: true,
    vatAmount: "",
    receipt: null as File | null
  })
  
  // Fetch expenses data
  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/expenses?includeStatistics=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Failed to fetch expenses')
      }

      const data = await response.json()
      console.log('Expenses API Response:', data) // Debug log
      setExpenses(data.expenses || [])
      setStatistics(data.statistics || null)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses')
      console.error('Expenses fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch projects for dropdown
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchExpenses()
    fetchProjects()
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchExpenses()
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || expense.category === filterCategory
    const matchesProject = !filterProject || expense.projectId === filterProject
    return matchesSearch && matchesCategory && matchesProject
  })

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalByCategory = statistics?.totalByCategory || []

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    )
  }

  const handleSelectAll = () => {
    setSelectedExpenses(
      selectedExpenses.length === filteredExpenses.length 
        ? [] 
        : filteredExpenses.map(e => e.id)
    )
  }

  const handleSubmitExpense = async () => {
    try {
      const expenseData: any = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        projectId: formData.projectId || null,
        expenseDate: formData.expenseDate,
        vatIncluded: formData.vatIncluded,
        vatAmount: formData.vatAmount ? parseFloat(formData.vatAmount) : null,
        receiptUrl: null // File upload will be implemented later
      }

      const url = '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'
      
      if (editingExpense) {
        expenseData.id = editingExpense
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingExpense ? 'update' : 'create'} expense`)
      }

      // Refresh data
      await fetchExpenses()
      
      // Reset form
      setShowAddForm(false)
      setEditingExpense(null)
      setFormData({
        description: "",
        amount: "",
        currency: "EUR",
        category: "",
        projectId: "",
        expenseDate: new Date().toISOString().split('T')[0],
        vatIncluded: true,
        vatAmount: "",
        receipt: null
      })
    } catch (err: any) {
      setError(err.message || 'Failed to save expense')
      console.error('Error saving expense:', err)
    }
  }

  const handleEditExpense = (expense: ManualExpenseWithDetails) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency,
      category: expense.category,
      projectId: expense.projectId || "",
      expenseDate: expense.expenseDate,
      vatIncluded: expense.vatIncluded,
      vatAmount: expense.vatAmount?.toString() || "",
      receipt: null
    })
    setEditingExpense(expense.id)
    setShowAddForm(true)
  }

  return (
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Manual Expenses</h1>
            <span className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground rounded border border-border">
              {expenses.length} expenses
            </span>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            {isLoading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-6 text-xs">
              <Upload className="h-3 w-3 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button size="sm" className="h-6 text-xs" onClick={() => setShowAddForm(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add Expense
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border border-border p-4">
              <div className="flex items-center">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="ml-2 text-xs font-medium">Total Expenses</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold">{statistics?.total || 0}</div>
                <p className="text-[10px] text-muted-foreground">
                  Across all projects
                </p>
              </div>
            </Card>

            <Card className="bg-card border border-border p-4">
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="ml-2 text-xs font-medium">Total Amount</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold">€{(statistics?.totalAmount || 0).toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground">
                  Current filter
                </p>
              </div>
            </Card>

            <Card className="bg-card border border-border p-4">
              <div className="flex items-center">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <span className="ml-2 text-xs font-medium">Categories</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold">{totalByCategory.length}</div>
                <p className="text-[10px] text-muted-foreground">
                  Active categories
                </p>
              </div>
            </Card>

            <Card className="bg-card border border-border p-4">
              <div className="flex items-center">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="ml-2 text-xs font-medium">Average</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold">
                  €{Math.round(statistics?.averageExpense || 0)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Per expense
                </p>
              </div>
            </Card>
          </div>

          {/* Add/Edit Expense Form */}
          {showAddForm && (
            <Card className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => {
                  setShowAddForm(false)
                  setEditingExpense(null)
                }}>
                  Cancel
                </Button>
              </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter expense description"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Amount *</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  required
                />
                <select 
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select category...</option>
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Project *</label>
              <select 
                value={formData.projectId}
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.status})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <Input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">VAT Status</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.vatIncluded}
                      onChange={() => setFormData({...formData, vatIncluded: true})}
                      className="mr-2"
                    />
                    VAT Included
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.vatIncluded}
                      onChange={() => setFormData({...formData, vatIncluded: false})}
                      className="mr-2"
                    />
                    VAT Excluded
                  </label>
                </div>
                {formData.vatIncluded && (
                  <Input
                    type="number"
                    placeholder="VAT amount"
                    value={formData.vatAmount}
                    onChange={(e) => setFormData({...formData, vatAmount: e.target.value})}
                  />
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Receipt (Optional)</label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFormData({...formData, receipt: e.target.files?.[0] || null})}
              />
            </div>
          </div>
          
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-6 text-xs" onClick={handleSubmitExpense}>
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
              </div>
            </Card>
          )}

          {/* Filters and Search */}
          <Card className="bg-card border border-border p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-6 text-xs"
                  />
                </div>
              </div>
          
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Categories</option>
            {expenseCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select 
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          
          {selectedExpenses.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{selectedExpenses.length} selected</Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Bulk Actions
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-xs text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Expenses List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Expense History</h3>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={selectedExpenses.length === filteredExpenses.length}
              onChange={handleSelectAll}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoading && expenses.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading expenses...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50">
              <input 
                type="checkbox" 
                checked={selectedExpenses.includes(expense.id)}
                onChange={() => handleSelectExpense(expense.id)}
                className="rounded"
              />
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <p className="font-medium text-sm">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{expense.projectName || 'No project'}</p>
                </div>
                
                <div>
                  <p className="font-semibold">€{expense.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.vatIncluded ? `incl. VAT €${expense.vatAmount || 0}` : 'excl. VAT'}
                  </p>
                </div>
                
                <div>
                  <Badge variant="outline">{expense.category}</Badge>
                </div>
                
                <div>
                  <p className="text-sm">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">Added {new Date(expense.addedDate).toLocaleDateString()}</p>
                </div>
                
                <div>
                  {expense.receiptUrl ? (
                    <Badge variant="default" className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      Receipt
                    </Badge>
                  ) : (
                    <Badge variant="outline">No Receipt</Badge>
                  )}
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditExpense(expense)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No expenses found matching your criteria</p>
          </div>
        )}
      </Card>

      {/* Category Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Expense Summary by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalByCategory.map((item) => (
            <div key={item.category} className="p-3 border rounded-lg">
              <p className="font-medium text-sm">{item.category}</p>
              <p className="text-lg font-bold">€{item.amount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{item.count} expense{item.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
          </div>
        </Card>
        </div>
      </main>
    </>
  )
}