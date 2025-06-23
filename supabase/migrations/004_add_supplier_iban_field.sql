-- Add supplier_iban field to supplier_invoices table for filtering project partners
ALTER TABLE supplier_invoices 
ADD COLUMN supplier_iban VARCHAR(50);

-- Add index for supplier_iban filtering
CREATE INDEX idx_supplier_invoices_iban ON supplier_invoices(supplier_iban);

-- Add comment explaining the purpose
COMMENT ON COLUMN supplier_invoices.supplier_iban IS 'IBAN from Qonto supplier snapshot - used to filter project partners from general expenses';