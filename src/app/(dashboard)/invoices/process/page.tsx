'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { 
  ArrowLeft,
  ArrowRight,
  FileText, 
  Eye, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Brain,
  Target,
  SplitSquareVertical,
  Plus,
  Minus,
  SkipForward,
  Save,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Home
} from "lucide-react"
import Link from "next/link"

// Mock data for the workflow
const mockInvoice = {
  id: 1,
  supplierName: "DevTools Agency",
  amount: 8000,
  currency: "EUR",
  invoiceDate: "2024-02-10",
  description: "Development resources - Website project February",
  pdfUrl: "/documents/supplier-001.pdf",
  qontoId: "QNT-SUP-001",
  aiExtraction: {
    confidence: 95,
    extractedText: "INVOICE #2024-001\nDevTools Agency\nDate: 2024-02-10\nDevelopment resources for website redesign project\nAmount: €8,000.00\nVAT: €1,120.00\nTotal: €8,000.00",
    projectMatches: [
      { 
        projectName: "Website Redesign", 
        confidence: 95, 
        keywords: ["website", "redesign"],
        highlightPositions: [{ start: 85, end: 102 }] // positions in extractedText
      },
      { 
        projectName: "E-commerce Platform", 
        confidence: 45, 
        keywords: ["platform"],
        highlightPositions: []
      }
    ],
    vatAmount: 1120,
    netAmount: 6880,
    lineItems: [
      { description: "Senior Developer - 40 hours", amount: 4000 },
      { description: "Junior Developer - 60 hours", amount: 3000 },
      { description: "Code Review & Testing", amount: 1000 }
    ]
  }
}

const availableProjects = [
  { id: 1, name: "Website Redesign", status: "active", budget: 45000 },
  { id: 2, name: "Mobile App Development", status: "active", budget: 78000 },
  { id: 3, name: "E-commerce Platform", status: "active", budget: 120000 },
  { id: 4, name: "Data Analytics Dashboard", status: "completed", budget: 35000 },
  { id: 5, name: "API Integration Project", status: "on-hold", budget: 25000 },
  { id: 6, name: "Security Audit & Compliance", status: "active", budget: 18000 }
]

const workflowSteps = [
  { id: 1, title: "Review", description: "Review invoice details" },
  { id: 2, title: "Extract", description: "AI data extraction" },
  { id: 3, title: "Assign", description: "Project assignment" },
  { id: 4, title: "Confirm", description: "Final confirmation" }
]

export default function InvoiceProcessingWorkflowPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProjects, setSelectedProjects] = useState<{id: number, amount: number}[]>([])
  const [totalAssigned, setTotalAssigned] = useState(0)
  const [pdfZoom, setPdfZoom] = useState(100)
  const [isDeferred, setIsDeferred] = useState(false)
  const [isNonProject, setIsNonProject] = useState(false)

  const progress = (currentStep / workflowSteps.length) * 100

  const addProjectAssignment = (projectId: number) => {
    const project = availableProjects.find(p => p.id === projectId)
    if (project && !selectedProjects.find(p => p.id === projectId)) {
      const remainingAmount = mockInvoice.amount - totalAssigned
      const newAssignment = { id: projectId, amount: remainingAmount }
      const newSelections = [...selectedProjects, newAssignment]
      setSelectedProjects(newSelections)
      setTotalAssigned(newSelections.reduce((sum, p) => sum + p.amount, 0))
    }
  }

  const updateProjectAmount = (projectId: number, amount: number) => {
    const newSelections = selectedProjects.map(p => 
      p.id === projectId ? { ...p, amount } : p
    )
    setSelectedProjects(newSelections)
    setTotalAssigned(newSelections.reduce((sum, p) => sum + p.amount, 0))
  }

  const removeProjectAssignment = (projectId: number) => {
    const newSelections = selectedProjects.filter(p => p.id !== projectId)
    setSelectedProjects(newSelections)
    setTotalAssigned(newSelections.reduce((sum, p) => sum + p.amount, 0))
  }

  const canProceed = () => {
    if (currentStep === 3) {
      return isDeferred || isNonProject || Math.abs(totalAssigned - mockInvoice.amount) < 0.01
    }
    return true
  }

  const handleNext = () => {
    if (canProceed() && currentStep < workflowSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Review
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Invoice Overview</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{mockInvoice.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium text-lg">€{mockInvoice.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(mockInvoice.invoiceDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{mockInvoice.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Qonto ID</p>
                    <p className="font-medium font-mono text-sm">{mockInvoice.qontoId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">VAT Amount</p>
                    <p className="font-medium">€{mockInvoice.aiExtraction.vatAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 2: // Extract
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Brain className="h-5 w-5 mr-2" />
                <h3 className="text-lg font-medium">AI Data Extraction</h3>
                <Badge variant="default" className="ml-2">
                  {mockInvoice.aiExtraction.confidence}% Confidence
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Extracted Text</p>
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {mockInvoice.aiExtraction.extractedText}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Line Items Breakdown</p>
                  <div className="space-y-2">
                    {mockInvoice.aiExtraction.lineItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2 border rounded">
                        <span className="text-sm">{item.description}</span>
                        <span className="font-medium">€{item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Project Matches Found</p>
                  <div className="space-y-2">
                    {mockInvoice.aiExtraction.projectMatches.map((match, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{match.projectName}</p>
                          <p className="text-xs text-muted-foreground">
                            Keywords: {match.keywords.join(", ")}
                          </p>
                        </div>
                        <Badge 
                          variant={match.confidence >= 80 ? "default" : match.confidence >= 60 ? "secondary" : "destructive"}
                        >
                          {match.confidence}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 3: // Assign
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Project Assignment</h3>
              
              {/* Assignment Options */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Button 
                  variant={!isDeferred && !isNonProject ? "default" : "outline"}
                  onClick={() => {
                    setIsDeferred(false)
                    setIsNonProject(false)
                  }}
                  className="h-16 flex-col"
                >
                  <Target className="h-5 w-5 mb-1" />
                  Assign to Project
                </Button>
                <Button 
                  variant={isNonProject ? "default" : "outline"}
                  onClick={() => {
                    setIsNonProject(true)
                    setIsDeferred(false)
                    setSelectedProjects([])
                    setTotalAssigned(0)
                  }}
                  className="h-16 flex-col"
                >
                  <X className="h-5 w-5 mb-1" />
                  Non-Project Expense
                </Button>
                <Button 
                  variant={isDeferred ? "default" : "outline"}
                  onClick={() => {
                    setIsDeferred(true)
                    setIsNonProject(false)
                    setSelectedProjects([])
                    setTotalAssigned(0)
                  }}
                  className="h-16 flex-col"
                >
                  <Clock className="h-5 w-5 mb-1" />
                  Defer for Later
                </Button>
              </div>

              {!isDeferred && !isNonProject && (
                <div className="space-y-4">
                  {/* AI Suggestions */}
                  <div>
                    <h4 className="font-medium mb-3">AI Suggestions</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {mockInvoice.aiExtraction.projectMatches.map((match, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{match.projectName}</p>
                            <p className="text-xs text-muted-foreground">
                              Confidence: {match.confidence}%
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const project = availableProjects.find(p => p.name === match.projectName)
                              if (project) addProjectAssignment(project.id)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual Selection */}
                  <div>
                    <h4 className="font-medium mb-3">Manual Project Selection</h4>
                    <select 
                      className="w-full p-2 border rounded-md mb-4"
                      onChange={(e) => e.target.value && addProjectAssignment(parseInt(e.target.value))}
                      value=""
                    >
                      <option value="">Choose a project...</option>
                      {availableProjects
                        .filter(p => !selectedProjects.find(sp => sp.id === p.id))
                        .map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name} ({project.status})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Selected Projects */}
                  {selectedProjects.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Assigned Projects</h4>
                        <div className="flex items-center space-x-2">
                          <SplitSquareVertical className="h-4 w-4" />
                          <span className="text-sm">
                            €{totalAssigned.toLocaleString()} / €{mockInvoice.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedProjects.map((assignment) => {
                          const project = availableProjects.find(p => p.id === assignment.id)
                          return (
                            <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{project?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Budget: €{project?.budget.toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={assignment.amount}
                                  onChange={(e) => updateProjectAmount(assignment.id, parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                                <span className="text-sm">€</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => removeProjectAssignment(assignment.id)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {Math.abs(totalAssigned - mockInvoice.amount) > 0.01 && (
                        <div className="mt-3 p-3 bg-chart-3/10 border border-chart-3/20 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-chart-3 mr-2" />
                            <span className="text-sm text-chart-3">
                              Difference: €{Math.abs(totalAssigned - mockInvoice.amount).toFixed(2)}
                              {totalAssigned > mockInvoice.amount ? " over-assigned" : " remaining"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isNonProject && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This invoice will be marked as a non-project expense and will not affect project margins.
                  </p>
                </div>
              )}

              {isDeferred && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This invoice will be returned to the queue for later processing.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )

      case 4: // Confirm
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Confirmation Summary</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Invoice Details</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{mockInvoice.supplierName}</p>
                    <p className="text-sm text-muted-foreground">{mockInvoice.description}</p>
                    <p className="font-medium">€{mockInvoice.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Assignment Summary</h4>
                  {isNonProject && (
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-chart-3">Non-Project Expense</p>
                      <p className="text-sm text-muted-foreground">Will not affect project margins</p>
                    </div>
                  )}
                  {isDeferred && (
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-chart-4">Deferred for Later Review</p>
                      <p className="text-sm text-muted-foreground">Returned to processing queue</p>
                    </div>
                  )}
                  {!isNonProject && !isDeferred && selectedProjects.length > 0 && (
                    <div className="space-y-2">
                      {selectedProjects.map((assignment) => {
                        const project = availableProjects.find(p => p.id === assignment.id)
                        return (
                          <div key={assignment.id} className="flex justify-between p-3 border rounded-lg">
                            <span className="font-medium">{project?.name}</span>
                            <span>€{assignment.amount.toLocaleString()}</span>
                          </div>
                        )
                      })}
                      <div className="flex justify-between p-3 bg-chart-2/10 border border-chart-2/20 rounded-lg">
                        <span className="font-medium">Total Assigned</span>
                        <span className="font-medium">€{totalAssigned.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/invoices/queue">
              <Button variant="outline" size="sm" className="h-6 text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-sm font-medium text-foreground">Process Invoice</h1>
            <p className="text-xs text-muted-foreground">
              Review and assign supplier invoice to projects
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/invoices" className="hover:text-foreground">Invoices</Link>
          <span>›</span>
          <Link href="/invoices/queue" className="hover:text-foreground">Queue</Link>
          <span>›</span>
          <span className="text-foreground">Processing</span>
          <span>›</span>
          <span className="text-foreground font-medium">Invoice #{mockInvoice.id}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/invoices/queue">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoice Processing Workflow</h2>
            <p className="text-muted-foreground">
              Step-by-step invoice review and project assignment
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save & Return to Queue
          </Button>
          <Button variant="outline" size="sm">
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Invoice
          </Button>
          <Button variant="default" size="sm">
            <ArrowRight className="h-4 w-4 mr-2" />
            Process Next Invoice
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Processing Progress</h3>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {workflowSteps.length}
            </span>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="flex justify-between">
            {workflowSteps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`flex flex-col items-center text-center ${
                  currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${
                  currentStep >= step.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Content Area - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - PDF Preview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">PDF Preview</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPdfZoom(Math.max(50, pdfZoom - 25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm">{pdfZoom}%</span>
              <Button variant="outline" size="sm" onClick={() => setPdfZoom(Math.min(200, pdfZoom + 25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* PDF Placeholder */}
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">PDF preview will be displayed here</p>
              <p className="text-sm text-muted-foreground mt-2">
                Zoom: {pdfZoom}% • File: {mockInvoice.pdfUrl}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Panel - Workflow Content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation Footer */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {workflowSteps[currentStep - 1]?.title}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStep === workflowSteps.length ? (
              <>
                <Button className="bg-chart-2 hover:bg-chart-2/90 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete & Process Next
                </Button>
                <Button variant="outline" className="bg-chart-2/10 hover:bg-chart-2/20">
                  <Save className="h-4 w-4 mr-2" />
                  Complete & Return to Queue
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
        </div>
      </main>
    </>
  )
}