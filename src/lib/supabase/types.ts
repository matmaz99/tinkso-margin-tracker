export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_processing_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          extracted_text: string | null
          id: string
          processing_error: string | null
          processing_status: string | null
          project_matches: Json | null
          supplier_invoice_id: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          processing_error?: string | null
          processing_status?: string | null
          project_matches?: Json | null
          supplier_invoice_id: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          processing_error?: string | null
          processing_status?: string | null
          project_matches?: Json | null
          supplier_invoice_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_results_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      clickup_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          sync_status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          sync_status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          sync_status?: string
          sync_type?: string
        }
        Relationships: []
      }
      client_invoices: {
        Row: {
          amount_net: number
          amount_total: number
          amount_vat: number
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          is_auto_detected: boolean | null
          issue_date: string
          paid_date: string | null
          pdf_url: string | null
          project_id: string | null
          qonto_id: string | null
          qonto_transaction_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount_net: number
          amount_total: number
          amount_vat: number
          client_id?: string | null
          created_at?: string
          currency: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          is_auto_detected?: boolean | null
          issue_date: string
          paid_date?: string | null
          pdf_url?: string | null
          project_id?: string | null
          qonto_id?: string | null
          qonto_transaction_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount_net?: number
          amount_total?: number
          amount_vat?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          is_auto_detected?: boolean | null
          issue_date?: string
          paid_date?: string | null
          pdf_url?: string | null
          project_id?: string | null
          qonto_id?: string | null
          qonto_transaction_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_project_associations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          project_id: string
          role: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          project_id: string
          role?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_project_associations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_project_associations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          phone: string | null
          qonto_id: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          phone?: string | null
          qonto_id?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          phone?: string | null
          qonto_id?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      invoice_project_assignments: {
        Row: {
          amount_assigned: number
          assigned_at: string
          assigned_by: string | null
          assignment_type: string | null
          created_at: string
          id: string
          percentage: number | null
          project_id: string
          supplier_invoice_id: string
        }
        Insert: {
          amount_assigned: number
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string | null
          created_at?: string
          id?: string
          percentage?: number | null
          project_id: string
          supplier_invoice_id: string
        }
        Update: {
          amount_assigned?: number
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string | null
          created_at?: string
          id?: string
          percentage?: number | null
          project_id?: string
          supplier_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_project_assignments_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          project_id: string | null
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          currency: string
          description: string
          expense_date: string
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          clickup_id: string | null
          client_name: string | null
          created_at: string
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          last_sync_at: string | null
          name: string
          start_date: string | null
          status: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          clickup_id?: string | null
          client_name?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          start_date?: string | null
          status?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          clickup_id?: string | null
          client_name?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          start_date?: string | null
          status?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qonto_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          last_transaction_id: string | null
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          sync_status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          last_transaction_id?: string | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          sync_status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          last_transaction_id?: string | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          sync_status?: string
          sync_type?: string
        }
        Relationships: []
      }
      supplier_invoices: {
        Row: {
          amount_net: number | null
          amount_total: number
          amount_vat: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          invoice_date: string
          is_processed: boolean | null
          pdf_url: string | null
          processing_date: string | null
          qonto_id: string | null
          qonto_transaction_id: string | null
          status: string | null
          supplier_name: string
          updated_at: string
        }
        Insert: {
          amount_net?: number | null
          amount_total: number
          amount_vat?: number | null
          created_at?: string
          currency: string
          description?: string | null
          id?: string
          invoice_date: string
          is_processed?: boolean | null
          pdf_url?: string | null
          processing_date?: string | null
          qonto_id?: string | null
          qonto_transaction_id?: string | null
          status?: string | null
          supplier_name: string
          updated_at?: string
        }
        Update: {
          amount_net?: number | null
          amount_total?: number
          amount_vat?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_date?: string
          is_processed?: boolean | null
          pdf_url?: string | null
          processing_date?: string | null
          qonto_id?: string | null
          qonto_transaction_id?: string | null
          status?: string | null
          supplier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_login_at: string | null
          permissions: Json | null
          role: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_login_at?: string | null
          permissions?: Json | null
          role?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          permissions?: Json | null
          role?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// =============================================
// TINKSO MARGIN TRACKER TYPES
// =============================================

// Main entity types
export type Project = Tables<'projects'>
export type Client = Tables<'clients'>
export type ClientInvoice = Tables<'client_invoices'>
export type SupplierInvoice = Tables<'supplier_invoices'>
export type ManualExpense = Tables<'manual_expenses'>
export type UserProfile = Tables<'user_profiles'>
export type AIProcessingResult = Tables<'ai_processing_results'>
export type InvoiceProjectAssignment = Tables<'invoice_project_assignments'>
export type ClientProjectAssociation = Tables<'client_project_associations'>

// Insert types
export type ProjectInsert = TablesInsert<'projects'>
export type ClientInsert = TablesInsert<'clients'>
export type ClientInvoiceInsert = TablesInsert<'client_invoices'>
export type SupplierInvoiceInsert = TablesInsert<'supplier_invoices'>
export type ManualExpenseInsert = TablesInsert<'manual_expenses'>
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type AIProcessingResultInsert = TablesInsert<'ai_processing_results'>
export type InvoiceProjectAssignmentInsert = TablesInsert<'invoice_project_assignments'>
export type ClientProjectAssociationInsert = TablesInsert<'client_project_associations'>

// Update types
export type ProjectUpdate = TablesUpdate<'projects'>
export type ClientUpdate = TablesUpdate<'clients'>
export type ClientInvoiceUpdate = TablesUpdate<'client_invoices'>
export type SupplierInvoiceUpdate = TablesUpdate<'supplier_invoices'>
export type ManualExpenseUpdate = TablesUpdate<'manual_expenses'>
export type UserProfileUpdate = TablesUpdate<'user_profiles'>

// Extended types with relationships and calculations
export type ProjectWithFinancials = Project & {
  client_invoices: ClientInvoice[]
  supplier_invoices_via_assignments: (InvoiceProjectAssignment & {
    supplier_invoices: SupplierInvoice
  })[]
  manual_expenses: ManualExpense[]
  clients: (ClientProjectAssociation & {
    clients: Client
  })[]
  // Calculated fields
  totalRevenue: number
  totalCosts: number
  totalMargin: number
  marginPercentage: number
}

export type SupplierInvoiceWithAI = SupplierInvoice & {
  ai_processing_results: AIProcessingResult[]
  invoice_project_assignments: (InvoiceProjectAssignment & {
    projects: Project
  })[]
}

export type ClientInvoiceWithDetails = ClientInvoice & {
  clients: Client | null
  projects: Project | null
}

export type ProjectWithAssociations = Project & {
  client_project_associations: (ClientProjectAssociation & {
    clients: Client
  })[]
  client_invoices: ClientInvoice[]
  manual_expenses: ManualExpense[]
}

// Financial calculation types
export interface ProjectFinancials {
  projectId: string
  projectName: string
  currency: string
  revenue: {
    total: number
    paid: number
    pending: number
    overdue: number
  }
  costs: {
    total: number
    supplier: number
    manual: number
  }
  margin: {
    total: number
    percentage: number
  }
  invoices: {
    client: number
    supplier: number
    pending: number
  }
}

// AI Processing types
export interface AIProjectMatch {
  projectName: string
  confidence: number
  keywords: string[]
}

export interface AIExtractionData {
  confidence: number
  projectMatches: AIProjectMatch[]
  extractedText: string
  vatAmount?: number
  netAmount?: number
}

// Dashboard summary types
export interface DashboardSummary {
  totalRevenue: number
  totalCosts: number
  totalMargin: number
  marginPercentage: number
  currency: string
  activeProjects: number
  pendingInvoices: number
  overdueInvoices: number
}

// ClickUp/Qonto integration types
export interface ClickUpSyncResult {
  projectsCreated: number
  projectsUpdated: number
  errors: string[]
  lastSyncAt: string
}

export interface QontoSyncResult {
  transactionsProcessed: number
  invoicesCreated: number
  invoicesUpdated: number
  errors: string[]
  lastTransactionId: string
  lastSyncAt: string
}

// Status enums (for type safety)
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type SupplierInvoiceStatus = 'pending-assignment' | 'low-confidence' | 'no-match' | 'assigned'
export type UserRole = 'admin' | 'user' | 'viewer'
export type SyncStatus = 'pending' | 'syncing' | 'success' | 'error'
export type AssignmentType = 'manual' | 'auto' | 'ai-suggested'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Integration sync log types
export type ClickUpSyncLog = Tables<'clickup_sync_log'>
export type QontoSyncLog = Tables<'qonto_sync_log'>

// Integration status interfaces
export interface IntegrationStatus {
  status: 'connected' | 'error' | 'unavailable'
  last_sync: string | null
  error?: string
  sync_stats?: Array<{ sync_status: string; count: number }>
}

export interface ClickUpIntegrationStatus extends IntegrationStatus {
  // ClickUp specific fields can be added here
}

export interface QontoIntegrationStatus extends IntegrationStatus {
  organization?: {
    slug: string
    bank_accounts: Array<{
      slug: string
      iban: string
      balance: number
      currency: string
    }>
  }
}

// Sync result types
export interface SyncResult {
  success: boolean
  sync_id: string
  records_processed: number
  records_updated: number
  records_created: number
  sync_type: 'full' | 'incremental'
  error?: string
  details?: string
}

// External API response types
export interface ClickUpTaskResponse {
  tasks: Array<{
    id: string
    name: string
    description?: string
    status: { status: string; color: string }
    assignees: Array<{ id: number; username: string; email: string }>
    due_date?: string
    start_date?: string
    custom_fields: Array<{ id: string; name: string; value: any; type: string }>
    tags: Array<{ name: string; tag_fg: string; tag_bg: string }>
    date_created: string
    date_updated: string
  }>
}

export interface QontoTransactionResponse {
  transactions: Array<{
    transaction_id: string
    amount: number
    currency: string
    side: 'debit' | 'credit'
    settled_at: string
    label: string
    note?: string
    reference?: string
    vat_amount?: number
    counterparty?: {
      name: string
      iban: string
    }
  }>
  meta: {
    current_page: number
    next_page: number | null
    total_pages: number
    total_count: number
  }
}