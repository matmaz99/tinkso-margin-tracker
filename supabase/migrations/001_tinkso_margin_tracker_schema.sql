-- Tinkso Margin Tracker Database Schema
-- Phase 3: Backend Development & Data Integration
-- Created: 2024

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- =============================================
-- CORE BUSINESS TABLES
-- =============================================

-- Projects table (ClickUp sync data, folder names, status, sync timestamps)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clickup_id VARCHAR(50) UNIQUE, -- ClickUp project/folder ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, completed, on-hold, archived
    currency VARCHAR(3) DEFAULT 'EUR', -- EUR, USD
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'pending' -- pending, syncing, success, error
);

-- Clients table (Qonto client data, contact info, project associations)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qonto_id VARCHAR(100) UNIQUE, -- Qonto client/counterparty ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    vat_number VARCHAR(50),
    country VARCHAR(2), -- ISO country code
    currency VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Client-Project Associations (many-to-many relationships)
CREATE TABLE client_project_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(100), -- primary, secondary, stakeholder
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, project_id)
);

-- Client Invoices table (Qonto invoice data, line items, amounts, VAT)
CREATE TABLE client_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qonto_id VARCHAR(100) UNIQUE, -- Qonto transaction/invoice ID
    invoice_number VARCHAR(100) NOT NULL,
    client_id UUID REFERENCES clients(id),
    project_id UUID REFERENCES projects(id),
    amount_total DECIMAL(12,2) NOT NULL,
    amount_net DECIMAL(12,2) NOT NULL,
    amount_vat DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
    issue_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE,
    description TEXT,
    pdf_url TEXT,
    qonto_transaction_id VARCHAR(100),
    is_auto_detected BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Invoices table (Qonto supplier data, PDF paths, processing status)
CREATE TABLE supplier_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qonto_id VARCHAR(100) UNIQUE, -- Qonto transaction ID
    supplier_name VARCHAR(255) NOT NULL,
    amount_total DECIMAL(12,2) NOT NULL,
    amount_net DECIMAL(12,2),
    amount_vat DECIMAL(12,2),
    currency VARCHAR(3) NOT NULL,
    invoice_date DATE NOT NULL,
    processing_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    pdf_url TEXT,
    qonto_transaction_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending-assignment', -- pending-assignment, low-confidence, no-match, assigned
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice-Project Assignments table (manual assignments, split amounts)
CREATE TABLE invoice_project_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    amount_assigned DECIMAL(12,2) NOT NULL,
    percentage DECIMAL(5,2), -- Percentage of total invoice (0-100)
    assignment_type VARCHAR(50) DEFAULT 'manual', -- manual, auto, ai-suggested
    assigned_by VARCHAR(100), -- user who made the assignment
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manual Expenses table (user-entered costs, categories, project links)
CREATE TABLE manual_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    category VARCHAR(100) NOT NULL, -- software, hardware, marketing, travel, etc.
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Processing Results table (OCR data, confidence scores, matches)
CREATE TABLE ai_processing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    extracted_text TEXT,
    confidence_score INTEGER DEFAULT 0, -- 0-100
    project_matches JSONB, -- Array of {project_name, confidence, keywords}
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AUTHENTICATION & USER MANAGEMENT
-- =============================================

-- Users table (authentication, permissions, activity logs)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user', -- admin, user, viewer
    permissions JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INTEGRATION TABLES
-- =============================================

-- ClickUp Integration metadata
CREATE TABLE clickup_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100) NOT NULL, -- projects, tasks, time_entries
    sync_status VARCHAR(50) NOT NULL, -- started, completed, failed
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Qonto Integration metadata
CREATE TABLE qonto_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100) NOT NULL, -- transactions, attachments
    sync_status VARCHAR(50) NOT NULL, -- started, completed, failed
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    last_transaction_id VARCHAR(100),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Projects indexes
CREATE INDEX idx_projects_clickup_id ON projects(clickup_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client_name ON projects(client_name);

-- Clients indexes
CREATE INDEX idx_clients_qonto_id ON clients(qonto_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_active ON clients(is_active);

-- Client Invoices indexes
CREATE INDEX idx_client_invoices_qonto_id ON client_invoices(qonto_id);
CREATE INDEX idx_client_invoices_client_id ON client_invoices(client_id);
CREATE INDEX idx_client_invoices_project_id ON client_invoices(project_id);
CREATE INDEX idx_client_invoices_status ON client_invoices(status);
CREATE INDEX idx_client_invoices_issue_date ON client_invoices(issue_date);

-- Supplier Invoices indexes
CREATE INDEX idx_supplier_invoices_qonto_id ON supplier_invoices(qonto_id);
CREATE INDEX idx_supplier_invoices_status ON supplier_invoices(status);
CREATE INDEX idx_supplier_invoices_processing_date ON supplier_invoices(processing_date);
CREATE INDEX idx_supplier_invoices_supplier_name ON supplier_invoices(supplier_name);

-- Invoice assignments indexes
CREATE INDEX idx_invoice_assignments_supplier_id ON invoice_project_assignments(supplier_invoice_id);
CREATE INDEX idx_invoice_assignments_project_id ON invoice_project_assignments(project_id);

-- Manual expenses indexes
CREATE INDEX idx_manual_expenses_project_id ON manual_expenses(project_id);
CREATE INDEX idx_manual_expenses_category ON manual_expenses(category);
CREATE INDEX idx_manual_expenses_date ON manual_expenses(expense_date);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_invoices_updated_at 
    BEFORE UPDATE ON client_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_invoices_updated_at 
    BEFORE UPDATE ON supplier_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_expenses_updated_at 
    BEFORE UPDATE ON manual_expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_processing_results_updated_at 
    BEFORE UPDATE ON ai_processing_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_project_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clickup_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE qonto_sync_log ENABLE ROW LEVEL SECURITY;

-- Basic policies (allow authenticated users to read/write their data)
-- For now, simple policies - can be refined based on business requirements

CREATE POLICY "Allow authenticated users to read projects" 
    ON projects FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify projects" 
    ON projects FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read clients" 
    ON clients FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify clients" 
    ON clients FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read client_project_associations" 
    ON client_project_associations FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify client_project_associations" 
    ON client_project_associations FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read client_invoices" 
    ON client_invoices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify client_invoices" 
    ON client_invoices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read supplier_invoices" 
    ON supplier_invoices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify supplier_invoices" 
    ON supplier_invoices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read invoice_project_assignments" 
    ON invoice_project_assignments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify invoice_project_assignments" 
    ON invoice_project_assignments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read manual_expenses" 
    ON manual_expenses FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify manual_expenses" 
    ON manual_expenses FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read ai_processing_results" 
    ON ai_processing_results FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify ai_processing_results" 
    ON ai_processing_results FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to read own profile" 
    ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" 
    ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to read sync logs" 
    ON clickup_sync_log FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read qonto sync logs" 
    ON qonto_sync_log FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =============================================

-- Insert sample projects
INSERT INTO projects (id, name, description, client_name, status, currency, start_date, end_date) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Website Redesign', 'Complete overhaul of company website with new branding and improved UX', 'TechCorp Solutions', 'active', 'EUR', '2024-01-15', '2024-03-30'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'iOS and Android app development for e-commerce platform', 'MobileFirst Inc', 'active', 'USD', '2024-02-01', '2024-05-15'),
    ('550e8400-e29b-41d4-a716-446655440003', 'E-commerce Platform', 'Custom e-commerce solution with advanced analytics and inventory management', 'RetailMax Group', 'active', 'EUR', '2023-11-01', '2024-04-30'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Data Analytics Dashboard', 'Business intelligence dashboard with real-time reporting capabilities', 'DataDriven Corp', 'completed', 'EUR', '2023-10-01', '2024-01-15'),
    ('550e8400-e29b-41d4-a716-446655440005', 'API Integration Project', 'Third-party API integrations and microservices architecture', 'CloudTech Systems', 'on-hold', 'USD', '2024-01-01', '2024-03-15'),
    ('550e8400-e29b-41d4-a716-446655440006', 'Security Audit & Compliance', 'Comprehensive security assessment and GDPR compliance implementation', 'SecureBank Ltd', 'active', 'EUR', '2024-02-15', '2024-04-15');

-- Insert sample clients
INSERT INTO clients (id, name, email, country, currency) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'contact@techcorp.com', 'FR', 'EUR'),
    ('660e8400-e29b-41d4-a716-446655440002', 'MobileFirst Inc', 'hello@mobilefirst.com', 'US', 'USD'),
    ('660e8400-e29b-41d4-a716-446655440003', 'RetailMax Group', 'team@retailmax.com', 'DE', 'EUR'),
    ('660e8400-e29b-41d4-a716-446655440004', 'DataDriven Corp', 'info@datadriven.com', 'FR', 'EUR'),
    ('660e8400-e29b-41d4-a716-446655440005', 'CloudTech Systems', 'sales@cloudtech.com', 'US', 'USD'),
    ('660e8400-e29b-41d4-a716-446655440006', 'SecureBank Ltd', 'security@securebank.com', 'GB', 'EUR');

-- Insert client-project associations
INSERT INTO client_project_associations (client_id, project_id, role) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'primary'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'primary'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'primary'),
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'primary'),
    ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'primary'),
    ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'primary');

-- Insert sample client invoices
INSERT INTO client_invoices (id, invoice_number, client_id, project_id, amount_total, amount_net, amount_vat, currency, status, issue_date, due_date, paid_date, description) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'INV-2024-001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 15000.00, 12900.00, 2100.00, 'EUR', 'paid', '2024-02-01', '2024-02-15', '2024-02-14', 'Phase 1 - Design & Planning'),
    ('770e8400-e29b-41d4-a716-446655440002', 'INV-2024-003', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 25000.00, 21500.00, 3500.00, 'USD', 'overdue', '2024-01-15', '2024-01-30', NULL, 'Milestone 2 - Core Features'),
    ('770e8400-e29b-41d4-a716-446655440003', 'INV-2024-005', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 12000.00, 10320.00, 1680.00, 'EUR', 'draft', '2024-02-15', '2024-03-01', NULL, 'Final milestone - Dashboard delivery');

-- Insert sample supplier invoices
INSERT INTO supplier_invoices (id, supplier_name, amount_total, amount_net, amount_vat, currency, invoice_date, description, status) VALUES
    ('880e8400-e29b-41d4-a716-446655440001', 'DevTools Agency', 8000.00, 6880.00, 1120.00, 'EUR', '2024-02-10', 'Development resources - Website project February', 'pending-assignment'),
    ('880e8400-e29b-41d4-a716-446655440002', 'Design Studio Pro', 5000.00, 4300.00, 700.00, 'EUR', '2024-02-05', 'UI/UX Design Services for mobile application', 'pending-assignment'),
    ('880e8400-e29b-41d4-a716-446655440003', 'CloudHost Services', 1200.00, 1032.00, 168.00, 'EUR', '2024-02-01', 'Server hosting and infrastructure Q1 2024', 'low-confidence'),
    ('880e8400-e29b-41d4-a716-446655440004', 'Marketing Solutions Ltd', 2500.00, 2150.00, 350.00, 'EUR', '2024-02-12', 'Digital marketing campaign management', 'no-match');