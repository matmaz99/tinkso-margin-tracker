import { createClient } from '@/lib/supabase/server'

export interface ProjectMatch {
  projectId: string
  projectName: string
  confidence: number
  matchedKeywords: string[]
  contextSnippets: string[]
  reasoning: string
}

export interface VisionOCRResult {
  extractedText: string
  confidence: number
  projectMatches: ProjectMatch[]
  processingTime: number
  status: 'success' | 'failed' | 'partial'
  errorMessage?: string
  invoiceDetails?: {
    supplierName?: string
    amount?: string
    date?: string
    description?: string
  }
}

// Rate limiting queue for Claude API calls
class RateLimitQueue {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private lastCallTime = 0
  private readonly minDelay = 15000 // 15 seconds between calls (4 per minute max)

  async add<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await apiCall()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastCall = now - this.lastCallTime
      
      if (timeSinceLastCall < this.minDelay) {
        const waitTime = this.minDelay - timeSinceLastCall
        console.log(`⏱️ Rate limiting: waiting ${Math.round(waitTime/1000)}s before next Claude API call (queue: ${this.queue.length})`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      
      const apiCall = this.queue.shift()
      if (apiCall) {
        this.lastCallTime = Date.now()
        await apiCall()
      }
    }
    
    this.processing = false
  }
}

// Global rate limit queue instance
const rateLimitQueue = new RateLimitQueue()

export class VisionInvoiceProcessor {
  
  async initialize() {
    console.log('✅ Vision-based invoice processor ready with rate limiting')
  }

  async cleanup() {
    // No cleanup needed for vision API
  }

  /**
   * Process supplier invoice PDF using Claude's vision capabilities with PDF URL
   */
  async processSupplierInvoice(
    pdfBuffer: Buffer, 
    supplierInvoiceId: string,
    pdfUrl?: string,
    skipStatusUpdate?: boolean
  ): Promise<VisionOCRResult> {
    const startTime = Date.now()
    
    try {
      await this.initialize()

      // Step 1: Get projects from database for matching context
      const projects = await this.getProjectsForMatching()
      console.log(`📋 Found ${projects.length} projects for matching`)
      
      // Step 2: Analyze invoice with Claude Vision (prefer URL, fallback to base64)
      let visionResult
      if (pdfUrl) {
        console.log(`📄 Using PDF URL for Claude Vision: ${pdfUrl}`)
        visionResult = await this.analyzeInvoiceWithVisionUrl(pdfUrl, projects)
      } else {
        console.log(`📄 Using PDF base64 for Claude Vision: ${pdfBuffer.length} bytes`)
        visionResult = await this.analyzeInvoiceWithVisionBase64(pdfBuffer, projects)
      }
      
      // Step 3: Calculate overall confidence
      const confidence = this.calculateOverallConfidence(visionResult)
      
      const processingTime = Date.now() - startTime

      const result: VisionOCRResult = {
        extractedText: visionResult.extractedText,
        confidence,
        projectMatches: visionResult.projectMatches,
        processingTime,
        status: 'success',
        invoiceDetails: visionResult.invoiceDetails
      }

      // Step 4: Store results in database
      await this.storeVisionResults(supplierInvoiceId, result, skipStatusUpdate)

      return result

    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error('Vision invoice processing failed:', error)
      
      const failedResult: VisionOCRResult = {
        extractedText: '',
        confidence: 0,
        projectMatches: [],
        processingTime,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown vision processing error'
      }

      await this.storeVisionResults(supplierInvoiceId, failedResult, skipStatusUpdate)
      return failedResult
    }
  }

  /**
   * Analyze invoice with Claude Vision using PDF URL
   */
  private async analyzeInvoiceWithVisionUrl(pdfUrl: string, projects: any[]): Promise<any> {
    try {
      console.log('🤖 Analyzing invoice with Claude Vision using PDF URL...')

      const prompt = this.buildAnalysisPrompt(projects)

      // Check API key
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set')
      }

      // Call Claude API with PDF URL using rate limiting queue
      console.log('🤖 Queuing PDF URL request to Claude Vision API...')
      const response = await rateLimitQueue.add(() => 
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt
                  },
                  {
                    type: 'document',
                    source: {
                      type: 'url',
                      url: pdfUrl
                    }
                  }
                ]
              }
            ]
          })
        })
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Claude API Error Response:', errorText)
        
        // Handle rate limiting with specific error message
        if (response.status === 429) {
          throw new Error(`Claude API rate limit exceeded (429). Please try again in a few minutes. Details: ${errorText}`)
        }
        
        throw new Error(`Claude API failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      const analysisText = result.content?.[0]?.text

      // Log token usage for monitoring
      if (result.usage) {
        console.log(`📊 Token usage - Input: ${result.usage.input_tokens}, Output: ${result.usage.output_tokens}, Total: ${result.usage.input_tokens + result.usage.output_tokens}`)
      }

      if (!analysisText) {
        throw new Error('No analysis received from Claude')
      }

      return this.parseVisionResult(analysisText)

    } catch (error) {
      console.error('❌ Claude Vision URL analysis failed:', error)
      throw new Error(`Vision URL analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Analyze invoice with Claude Vision using base64 PDF
   */
  private async analyzeInvoiceWithVisionBase64(pdfBuffer: Buffer, projects: any[]): Promise<any> {
    try {
      console.log('🤖 Analyzing invoice with Claude Vision using base64 PDF...')

      const prompt = this.buildAnalysisPrompt(projects)

      // Check API key
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set')
      }

      // Call Claude API with base64 PDF using rate limiting queue
      console.log('🤖 Queuing base64 PDF request to Claude Vision API...')
      const response = await rateLimitQueue.add(() =>
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt
                  },
                  {
                    type: 'document',
                    source: {
                      type: 'base64',
                      media_type: 'application/pdf',
                      data: pdfBuffer.toString('base64')
                    }
                  }
                ]
              }
            ]
          })
        })
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Claude API Error Response:', errorText)
        
        // Handle rate limiting with specific error message
        if (response.status === 429) {
          throw new Error(`Claude API rate limit exceeded (429). Please try again in a few minutes. Details: ${errorText}`)
        }
        
        throw new Error(`Claude API failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      const analysisText = result.content?.[0]?.text

      // Log token usage for monitoring
      if (result.usage) {
        console.log(`📊 Token usage - Input: ${result.usage.input_tokens}, Output: ${result.usage.output_tokens}, Total: ${result.usage.input_tokens + result.usage.output_tokens}`)
      }

      if (!analysisText) {
        throw new Error('No analysis received from Claude')
      }

      return this.parseVisionResult(analysisText)

    } catch (error) {
      console.error('❌ Claude Vision base64 analysis failed:', error)
      throw new Error(`Vision base64 analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get projects from database for matching context
   */
  private async getProjectsForMatching(): Promise<any[]> {
    const supabase = await createClient()
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, description, client_name, status')
      .in('status', ['active', 'archived'])
    
    if (error || !projects) {
      console.error('Failed to fetch projects for vision matching:', error)
      return []
    }

    return projects
  }

  /**
   * Analyze invoice using Claude's vision capabilities
   */
  private async analyzeInvoiceWithVision(
    documentBuffer: Buffer, 
    projects: any[],
    isImage: boolean = true
  ): Promise<{
    extractedText: string
    projectMatches: ProjectMatch[]
    invoiceDetails: any
  }> {
    try {
      console.log('🤖 Analyzing invoice with Claude Vision...')
      
      // Prepare project context for Claude
      const projectContext = projects.map(p => 
        `- ${p.name} (Client: ${p.client_name || 'N/A'}, Description: ${p.description || 'N/A'})`
      ).join('\n')

      // Create the vision prompt
      const prompt = `You are an expert invoice analyzer. Please examine this supplier invoice image and:

1. Extract all visible text from the invoice
2. Identify key invoice details (supplier name, amount, date, description)
3. Match the invoice content to the most relevant projects from this list:

AVAILABLE PROJECTS:
${projectContext}

For each potential project match, provide:
- Project name and ID
- Confidence score (0-100%)
- Specific keywords/text that led to the match
- Context snippets from the invoice
- Reasoning for the match

Look for:
- Project names mentioned directly
- Client names that match project clients
- Keywords from project descriptions
- Service descriptions that relate to projects
- Any other contextual clues

Return your analysis in this JSON format:
{
  "extractedText": "full text extracted from invoice",
  "invoiceDetails": {
    "supplierName": "supplier name",
    "amount": "invoice amount",
    "date": "invoice date", 
    "description": "service description"
  },
  "projectMatches": [
    {
      "projectId": "project_id",
      "projectName": "project name",
      "confidence": 85,
      "matchedKeywords": ["keyword1", "keyword2"],
      "contextSnippets": ["relevant text from invoice"],
      "reasoning": "explanation of why this matches"
    }
  ]
}`

      // Check API key
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set')
      }

      // Call Claude API (we'll use the same pattern as other API calls)
      console.log('🤖 Sending request to Claude Vision API...')
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: documentBuffer.toString('base64')
                  }
                }
              ]
            }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Claude API Error Response:', errorText)
        
        // Handle rate limiting with specific error message
        if (response.status === 429) {
          throw new Error(`Claude API rate limit exceeded (429). Please try again in a few minutes. Details: ${errorText}`)
        }
        
        throw new Error(`Claude API failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      const analysisText = result.content?.[0]?.text

      if (!analysisText) {
        throw new Error('No analysis received from Claude')
      }

      // Parse the JSON response
      let visionResult
      try {
        // Extract JSON from the response (Claude might wrap it in markdown)
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : analysisText
        visionResult = JSON.parse(jsonString)
      } catch (parseError) {
        console.error('Failed to parse Claude response as JSON:', parseError)
        // Fallback: create a basic result from the text
        visionResult = {
          extractedText: analysisText,
          projectMatches: [],
          invoiceDetails: {}
        }
      }

      console.log(`✅ Vision analysis completed: ${visionResult.projectMatches?.length || 0} project matches found`)
      
      return visionResult

    } catch (error) {
      console.error('❌ Claude Vision analysis failed:', error)
      throw new Error(`Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate overall confidence score for the vision analysis
   */
  private calculateOverallConfidence(visionResult: any): number {
    let confidence = 0
    
    // Base confidence for successful text extraction
    if (visionResult.extractedText && visionResult.extractedText.length > 50) {
      confidence += 40
    }
    
    // Confidence for invoice details extraction
    if (visionResult.invoiceDetails) {
      const details = visionResult.invoiceDetails
      if (details.supplierName) confidence += 10
      if (details.amount) confidence += 10
      if (details.date) confidence += 5
      if (details.description) confidence += 5
    }
    
    // Project match confidence (most important factor)
    if (visionResult.projectMatches && visionResult.projectMatches.length > 0) {
      const bestMatch = Math.max(...visionResult.projectMatches.map((m: any) => m.confidence || 0))
      confidence += Math.min(30, bestMatch * 0.3) // Up to 30 bonus points
      
      // Bonus for multiple matches
      if (visionResult.projectMatches.length > 1) {
        confidence += Math.min(10, visionResult.projectMatches.length * 2)
      }
    }
    
    return Math.round(Math.min(100, confidence))
  }

  /**
   * Store vision analysis results in the database
   */
  private async storeVisionResults(supplierInvoiceId: string, result: VisionOCRResult, skipStatusUpdate?: boolean) {
    const supabase = await createClient()
    
    try {
      // Store in ai_processing_results table
      // Ensure all numeric values are properly typed for database
      const processedMatches = result.projectMatches.map(match => ({
        ...match,
        confidence: Math.round(parseFloat(match.confidence?.toString() || '0'))
      }))

      const { error } = await supabase
        .from('ai_processing_results')
        .upsert({
          supplier_invoice_id: supplierInvoiceId,
          processing_type: 'vision_project_matching',
          confidence_score: Math.round(result.confidence),
          project_matches: processedMatches,
          extracted_text: result.extractedText,
          processing_status: result.status,
          processing_time_ms: Math.round(result.processingTime),
          error_message: result.errorMessage,
          processed_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to store vision results:', error)
      } else {
        console.log(`✅ Stored vision analysis results for supplier invoice ${supplierInvoiceId}`)
      }

      // Update supplier invoice status based on confidence (only if not skipped)
      if (!skipStatusUpdate && result.status === 'success' && result.projectMatches.length > 0) {
        const bestMatch = result.projectMatches[0]
        const newStatus = bestMatch.confidence >= 80 ? 'high-confidence' : 
                         bestMatch.confidence >= 60 ? 'medium-confidence' : 'low-confidence'

        await supabase
          .from('supplier_invoices')
          .update({ 
            status: newStatus,
            is_processed: true 
          })
          .eq('id', supplierInvoiceId)
      }

    } catch (error) {
      console.error('Database error storing vision results:', error)
    }
  }

  /**
   * Build analysis prompt for Claude Vision
   */
  private buildAnalysisPrompt(projects: any[]): string {
    const projectList = projects.map(p => `- ${p.name}: ${p.description || 'No description'}`).join('\n')
    
    return `Please analyze this invoice PDF and extract key information, then match it to the most relevant projects from our list.

Available Projects:
${projectList}

Please return a JSON response with this exact structure:
{
  "extractedText": "full text extracted from the invoice",
  "invoiceDetails": {
    "supplierName": "supplier name",
    "amount": "total amount as number",
    "date": "invoice date",
    "description": "invoice description or items"
  },
  "projectMatches": [
    {
      "projectId": "project_id",
      "projectName": "project name",
      "confidence": 85,
      "matchedKeywords": ["keyword1", "keyword2"],
      "contextSnippets": ["relevant text from invoice"],
      "reasoning": "explanation of why this matches"
    }
  ]
}`
  }

  /**
   * Parse Claude's vision analysis result
   */
  private parseVisionResult(analysisText: string): any {
    try {
      // Extract JSON from the response (Claude might wrap it in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : analysisText
      const visionResult = JSON.parse(jsonString)
      
      // Ensure confidence scores are integers
      if (visionResult.projectMatches && Array.isArray(visionResult.projectMatches)) {
        visionResult.projectMatches = visionResult.projectMatches.map((match: any) => ({
          ...match,
          confidence: Math.round(parseFloat(match.confidence?.toString() || '0'))
        }))
      }
      
      console.log(`✅ Vision analysis completed: ${visionResult.projectMatches?.length || 0} project matches found`)
      return visionResult
      
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError)
      // Fallback: create a basic result from the text
      const fallbackResult = {
        extractedText: analysisText,
        projectMatches: [],
        invoiceDetails: {}
      }
      console.log('✅ Vision analysis completed with fallback parsing')
      return fallbackResult
    }
  }
}

// Singleton instance for reuse
let visionProcessorInstance: VisionInvoiceProcessor | null = null

export async function getVisionProcessor(): Promise<VisionInvoiceProcessor> {
  if (!visionProcessorInstance) {
    visionProcessorInstance = new VisionInvoiceProcessor()
  }
  return visionProcessorInstance
}

// Cleanup function for graceful shutdown
export async function cleanupVisionProcessor() {
  if (visionProcessorInstance) {
    await visionProcessorInstance.cleanup()
    visionProcessorInstance = null
  }
}