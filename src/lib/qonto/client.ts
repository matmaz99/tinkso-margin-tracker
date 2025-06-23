// Qonto API client for banking and financial integration
export interface QontoConfig {
  login: string  // Format: organization_slug
  secretKey: string
  baseUrl: string
}

export interface QontoTransaction {
  transaction_id: string
  amount: number
  amount_cents: number
  currency: string
  local_amount: number
  local_amount_cents: number
  local_currency: string
  side: 'debit' | 'credit'
  operation_type: string
  settled_at: string
  emitted_at: string
  updated_at: string
  status: string
  note: string | null
  reference: string | null
  vat_amount: number | null
  vat_amount_cents: number | null
  vat_rate: number | null
  initiator_id: string | null
  label: string
  settled_balance: number
  settled_balance_cents: number
  category: string | null
  attachment_ids: string[]
  counterparty: {
    name: string
    iban: string
    bic: string
  } | null
}

export interface QontoAttachment {
  id: string
  file_name: string
  file_size: number
  file_content_type: string
  url: string
  created_at: string
}

export interface QontoMembership {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface QontoOrganization {
  slug: string
  bank_accounts: Array<{
    slug: string
    iban: string
    bic: string
    currency: string
    balance: number
    balance_cents: number
    authorized_balance: number
    authorized_balance_cents: number
  }>
}

// New interfaces for Business API endpoints
export interface QontoClientData {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  vat_number?: string
  country?: string
  created_at: string
  updated_at: string
}

export interface QontoClientInvoiceLineItem {
  title: string
  description: string
  quantity: string
  unit_price: {
    value: string
    currency: string
  }
  unit_price_cents: number
  total_amount: {
    value: string
    currency: string
  }
  total_amount_cents: number
  total_vat: {
    value: string
    currency: string
  }
  total_vat_cents: number
  vat_rate: string
  subtotal: {
    value: string
    currency: string
  }
  subtotal_cents: number
}

export interface QontoClientInvoice {
  id: string
  number: string
  invoice_number?: string
  client_id?: string
  total_amount: {
    value: string
    currency: string
  }
  vat_amount: {
    value: string
    currency: string
  }
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'unpaid'
  issue_date: string
  due_date?: string
  paid_at?: string
  description?: string
  terms_and_conditions?: string
  invoice_url?: string
  attachment_id?: string
  items?: QontoClientInvoiceLineItem[]
  created_at: string
  updated_at?: string
  client: {
    id: string
    name: string
    email?: string
  }
}

export interface QontoSupplierInvoice {
  id: string
  supplier_name: string
  invoice_number?: string
  total_amount: {
    value: string
    currency: string
  }
  payable_amount: {
    value: string
    currency: string
  }
  total_amount_credit_notes: {
    value: string
    currency: string
  }
  issue_date: string
  due_date?: string
  payment_date?: string
  description?: string
  pdf_url?: string
  attachment_id?: string
  status?: string
  created_at: string
  updated_at: string
  supplier_snapshot?: {
    id: string
    name: string
    iban?: string
    tin?: string
    currency?: string
    status: string
  }
}

export class QontoClient {
  private config: QontoConfig
  private headers: HeadersInit

  constructor(config: QontoConfig) {
    this.config = config
    this.headers = {
      'Authorization': `${this.config.login}:${this.config.secretKey}`,
      'Content-Type': 'application/json'
    }
  }

  // Get organization details
  async getOrganization(): Promise<QontoOrganization> {
    const url = `${this.config.baseUrl}/organizations`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.organization
  }

  // Get transactions with filtering options
  async getTransactions(options: {
    iban?: string
    status?: string[]
    side?: 'debit' | 'credit'
    updated_at_from?: string
    updated_at_to?: string
    settled_at_from?: string
    settled_at_to?: string
    sort_by?: string
    current_page?: number
    per_page?: number
  } = {}): Promise<{
    transactions: QontoTransaction[]
    meta: {
      current_page: number
      next_page: number | null
      prev_page: number | null
      total_pages: number
      total_count: number
      per_page: number
    }
  }> {
    const params = new URLSearchParams()
    
    if (options.iban) params.append('iban', options.iban)
    if (options.status) params.append('status[]', options.status.join(','))
    if (options.side) params.append('side', options.side)
    if (options.updated_at_from) params.append('updated_at_from', options.updated_at_from)
    if (options.updated_at_to) params.append('updated_at_to', options.updated_at_to)
    if (options.settled_at_from) params.append('settled_at_from', options.settled_at_from)
    if (options.settled_at_to) params.append('settled_at_to', options.settled_at_to)
    if (options.sort_by) params.append('sort_by', options.sort_by)
    if (options.current_page) params.append('page', options.current_page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())

    const url = `${this.config.baseUrl}/transactions?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Get specific transaction by ID
  async getTransaction(transactionId: string): Promise<QontoTransaction> {
    const url = `${this.config.baseUrl}/transactions/${transactionId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.transaction
  }

  // Get attachments for a transaction
  async getTransactionAttachments(transactionId: string): Promise<QontoAttachment[]> {
    const url = `${this.config.baseUrl}/transactions/${transactionId}/attachments`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.attachments
  }

  // Get clients from Business API
  async getClients(options: {
    current_page?: number
    per_page?: number
  } = {}): Promise<{
    clients: QontoClientData[]
    meta: {
      current_page: number
      next_page: number | null
      prev_page: number | null
      total_pages: number
      total_count: number
      per_page: number
    }
  }> {
    const params = new URLSearchParams()
    
    if (options.current_page) params.append('page', options.current_page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())

    const url = `${this.config.baseUrl}/clients?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Get client invoices from Business API
  async getClientInvoices(options: {
    current_page?: number
    per_page?: number
    status?: string[]
    issue_date_from?: string
    issue_date_to?: string
  } = {}): Promise<{
    client_invoices: QontoClientInvoice[]
    meta: {
      current_page: number
      next_page: number | null
      prev_page: number | null
      total_pages: number
      total_count: number
      per_page: number
    }
  }> {
    const params = new URLSearchParams()
    
    if (options.current_page) params.append('page', options.current_page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())
    if (options.status) params.append('status[]', options.status.join(','))
    if (options.issue_date_from) params.append('issue_date_from', options.issue_date_from)
    if (options.issue_date_to) params.append('issue_date_to', options.issue_date_to)

    const url = `${this.config.baseUrl}/client_invoices?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Get supplier invoices from Business API
  async getSupplierInvoices(options: {
    current_page?: number
    per_page?: number
    invoice_date_from?: string
    invoice_date_to?: string
  } = {}): Promise<{
    supplier_invoices: QontoSupplierInvoice[]
    meta: {
      current_page: number
      next_page: number | null
      prev_page: number | null
      total_pages: number
      total_count: number
      per_page: number
    }
  }> {
    const params = new URLSearchParams()
    
    if (options.current_page) params.append('page', options.current_page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())
    if (options.invoice_date_from) params.append('invoice_date_from', options.invoice_date_from)
    if (options.invoice_date_to) params.append('invoice_date_to', options.invoice_date_to)

    const url = `${this.config.baseUrl}/supplier_invoices?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Get attachment URL (valid for 30 minutes) by attachment ID
  async getAttachmentUrl(attachmentId: string): Promise<{ url: string; expires_at: string }> {
    const url = `${this.config.baseUrl}/attachments/${attachmentId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Qonto API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      url: data.attachment.url,
      expires_at: data.attachment.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
    }
  }

  // Test API connection
  async testConnection(): Promise<{ success: boolean; organization?: any; error?: string }> {
    try {
      const organization = await this.getOrganization()
      return {
        success: true,
        organization
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Factory function to create Qonto client with configuration
export async function createQontoClient(): Promise<QontoClient | null> {
  try {
    // Parse login from QONTO_API_KEY format: "organization_slug:secret_key"
    const apiKey = process.env.QONTO_API_KEY
    if (!apiKey || !apiKey.includes(':')) {
      console.warn('Qonto API key missing or invalid format. Expected format: "login:secret_key"')
      return null
    }

    const [login, secretKey] = apiKey.split(':')
    
    const config: QontoConfig = {
      login,
      secretKey,
      baseUrl: 'https://thirdparty.qonto.com/v2'
    }

    if (!config.login || !config.secretKey) {
      console.warn('Qonto configuration incomplete. Integration disabled.')
      return null
    }

    return new QontoClient(config)
  } catch (error) {
    console.error('Failed to create Qonto client:', error)
    return null
  }
}

// Transaction categorization utilities
export class TransactionCategorizer {
  // Detect if transaction is likely a supplier invoice
  static isSupplierInvoice(transaction: QontoTransaction): boolean {
    // Debit transactions (money going out) with invoicing patterns
    if (transaction.side !== 'debit') return false

    // Check for invoice-related keywords
    const invoiceKeywords = ['invoice', 'facture', 'bill', 'payment', 'supplier', 'vendor']
    const searchText = `${transaction.label} ${transaction.note || ''} ${transaction.reference || ''}`.toLowerCase()
    
    return invoiceKeywords.some(keyword => searchText.includes(keyword))
  }

  // Detect if transaction is likely a client payment
  static isClientPayment(transaction: QontoTransaction): boolean {
    // Credit transactions (money coming in) with payment patterns
    if (transaction.side !== 'credit') return false

    // Check for payment-related keywords
    const paymentKeywords = ['payment', 'invoice', 'facture', 'client', 'customer', 'projet', 'project']
    const searchText = `${transaction.label} ${transaction.note || ''} ${transaction.reference || ''}`.toLowerCase()
    
    return paymentKeywords.some(keyword => searchText.includes(keyword))
  }

  // Extract potential client name from transaction
  static extractClientName(transaction: QontoTransaction): string | null {
    // Use counterparty name if available
    if (transaction.counterparty?.name) {
      return transaction.counterparty.name
    }

    // Try to extract from label or reference
    const text = transaction.label || transaction.reference || ''
    
    // Remove common prefixes/suffixes
    const cleanText = text
      .replace(/^(payment|facture|invoice|from|to)\s+/i, '')
      .replace(/\s+(payment|facture|invoice)$/i, '')
      .trim()

    return cleanText || null
  }

  // Extract potential supplier name from transaction
  static extractSupplierName(transaction: QontoTransaction): string | null {
    // Use counterparty name if available
    if (transaction.counterparty?.name) {
      return transaction.counterparty.name
    }

    // Try to extract from label
    const text = transaction.label || ''
    
    // Remove common prefixes/suffixes
    const cleanText = text
      .replace(/^(payment to|pay|facture|invoice)\s+/i, '')
      .replace(/\s+(invoice|bill|payment)$/i, '')
      .trim()

    return cleanText || null
  }

  // Calculate confidence score for automatic categorization
  static getCategoricationConfidence(transaction: QontoTransaction): number {
    let confidence = 0

    // High confidence indicators
    if (transaction.counterparty?.name) confidence += 40
    if (transaction.category) confidence += 20
    if (transaction.reference) confidence += 15

    // Keyword matching confidence
    const searchText = `${transaction.label} ${transaction.note || ''} ${transaction.reference || ''}`.toLowerCase()
    const strongKeywords = ['invoice', 'facture', 'payment', 'project', 'projet']
    const weakKeywords = ['transfer', 'virement', 'expense', 'cost']

    strongKeywords.forEach(keyword => {
      if (searchText.includes(keyword)) confidence += 10
    })

    weakKeywords.forEach(keyword => {
      if (searchText.includes(keyword)) confidence += 5
    })

    // Penalize for ambiguous transactions
    if (searchText.includes('transfer') || searchText.includes('virement')) {
      confidence -= 20
    }

    return Math.max(0, Math.min(100, confidence))
  }
}

// Utility functions for client/supplier matching
export class EntityMatcher {
  // Match transaction to existing client by name similarity
  static async matchClientByName(
    supabase: any,
    transactionName: string
  ): Promise<{ client_id: string; confidence: number } | null> {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .eq('is_active', true)

    if (!clients || clients.length === 0) return null

    let bestMatch: { client_id: string; confidence: number } | null = null
    const normalizedTransactionName = transactionName.toLowerCase().trim()

    for (const client of clients) {
      const normalizedClientName = client.name.toLowerCase().trim()
      const similarity = this.calculateSimilarity(normalizedTransactionName, normalizedClientName)
      
      // Consider it a match if similarity is above 80%
      if (similarity > 0.8 && (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = {
          client_id: client.id,
          confidence: similarity
        }
      }
    }

    return bestMatch
  }

  // Calculate string similarity using Levenshtein distance
  private static calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    const maxLength = Math.max(str1.length, str2.length)
    const distance = matrix[str2.length][str1.length]
    return (maxLength - distance) / maxLength
  }
}