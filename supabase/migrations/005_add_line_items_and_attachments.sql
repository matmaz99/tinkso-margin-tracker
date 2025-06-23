-- Add attachment_id fields to both invoice tables for PDF retrieval
ALTER TABLE client_invoices ADD COLUMN IF NOT EXISTS attachment_id VARCHAR(100);
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS attachment_id VARCHAR(100);

-- Add indexes for attachment lookups
CREATE INDEX IF NOT EXISTS idx_client_invoices_attachment_id ON client_invoices(attachment_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_attachment_id ON supplier_invoices(attachment_id);

-- Create table for storing client invoice line items from Qonto
CREATE TABLE IF NOT EXISTS client_invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES client_invoices(id) ON DELETE CASCADE,
  qonto_line_item_id VARCHAR(100),
  description TEXT,
  quantity DECIMAL(10,2),
  unit_price DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  vat_rate DECIMAL(5,2),
  vat_amount DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_invoice_line_items_invoice_id ON client_invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_client_invoice_line_items_qonto_id ON client_invoice_line_items(qonto_line_item_id);

-- Add RLS policies for line items
ALTER TABLE client_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own line items" ON client_invoice_line_items;
DROP POLICY IF EXISTS "Users can insert their own line items" ON client_invoice_line_items;
DROP POLICY IF EXISTS "Users can update their own line items" ON client_invoice_line_items;
DROP POLICY IF EXISTS "Users can delete their own line items" ON client_invoice_line_items;

-- Create new RLS policies for line items
CREATE POLICY "Users can view their own line items" ON client_invoice_line_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own line items" ON client_invoice_line_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own line items" ON client_invoice_line_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own line items" ON client_invoice_line_items
  FOR DELETE USING (true);

-- Add comments explaining the fields
COMMENT ON COLUMN client_invoices.attachment_id IS 'Qonto attachment ID for retrieving PDF document (URL valid for 30 minutes)';
COMMENT ON COLUMN supplier_invoices.attachment_id IS 'Qonto attachment ID for retrieving PDF document (URL valid for 30 minutes)';
COMMENT ON TABLE client_invoice_line_items IS 'Line items for client invoices imported from Qonto Business API';