-- Migration: Enhance AI processing results for OCR functionality
-- Description: Add OCR-specific fields and improve the structure for supplier invoice processing

-- Add new columns to support OCR processing
ALTER TABLE ai_processing_results
ADD COLUMN IF NOT EXISTS processing_type VARCHAR(100) DEFAULT 'ai_extraction',
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update existing processing_error column name for consistency (if it exists)
-- Note: We'll use error_message instead of processing_error going forward

-- Create index for efficient querying by supplier invoice and processing type
CREATE INDEX IF NOT EXISTS idx_ai_processing_supplier_invoice 
ON ai_processing_results(supplier_invoice_id);

CREATE INDEX IF NOT EXISTS idx_ai_processing_type 
ON ai_processing_results(processing_type);

CREATE INDEX IF NOT EXISTS idx_ai_processing_status 
ON ai_processing_results(processing_status);

-- Add comment explaining the enhanced structure
COMMENT ON TABLE ai_processing_results IS 'Stores AI and OCR processing results for supplier invoices including text extraction and project matching';
COMMENT ON COLUMN ai_processing_results.processing_type IS 'Type of processing: ai_extraction, ocr_project_matching, manual_review';
COMMENT ON COLUMN ai_processing_results.project_matches IS 'JSONB array of project matches with structure: [{projectId, projectName, confidence, matchedKeywords, contextSnippets}]';
COMMENT ON COLUMN ai_processing_results.processing_time_ms IS 'Processing time in milliseconds for performance monitoring';

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_processing_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_ai_processing_results_updated_at ON ai_processing_results;
CREATE TRIGGER trigger_update_ai_processing_results_updated_at
    BEFORE UPDATE ON ai_processing_results
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_processing_results_updated_at();

-- Create a view for easy querying of OCR results with project details
CREATE OR REPLACE VIEW supplier_invoice_ocr_results AS
SELECT 
    si.id as supplier_invoice_id,
    si.supplier_name,
    si.amount_total,
    si.invoice_date,
    si.attachment_id,
    si.status as invoice_status,
    apr.id as processing_id,
    apr.processing_type,
    apr.confidence_score,
    apr.project_matches,
    apr.extracted_text,
    apr.processing_status,
    apr.processing_time_ms,
    apr.processed_at,
    apr.error_message,
    -- Extract best project match for easy access
    (apr.project_matches->0->>'projectName') as best_match_project,
    (apr.project_matches->0->>'confidence')::integer as best_match_confidence
FROM supplier_invoices si
LEFT JOIN ai_processing_results apr ON si.id = apr.supplier_invoice_id
WHERE apr.processing_type = 'ocr_project_matching' OR apr.processing_type IS NULL
ORDER BY si.invoice_date DESC, apr.processed_at DESC;