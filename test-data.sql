-- Test data for supplier invoice queue
-- Run this in your Supabase SQL editor

-- Insert test supplier invoices
INSERT INTO supplier_invoices (
  qonto_id, supplier_name, amount_total, amount_net, amount_vat, 
  currency, invoice_date, description, status
) VALUES 
  ('QNT-SUP-001', 'DevTools Agency', 8000.00, 6880.00, 1120.00, 'EUR', '2024-02-10', 'Development resources - Website project February', 'pending-assignment'),
  ('QNT-SUP-002', 'Design Studio Pro', 5000.00, 4300.00, 700.00, 'EUR', '2024-02-05', 'UI/UX Design Services for mobile application', 'pending-assignment'),
  ('QNT-SUP-003', 'CloudHost Services', 1200.00, 1032.00, 168.00, 'EUR', '2024-02-01', 'Server hosting and infrastructure Q1 2024', 'low-confidence'),
  ('QNT-SUP-004', 'Marketing Solutions Ltd', 2500.00, 2150.00, 350.00, 'EUR', '2024-02-12', 'Digital marketing campaign management', 'no-match'),
  ('QNT-SUP-005', 'Security Consultant Inc', 3500.00, 3000.00, 500.00, 'EUR', '2024-02-15', 'Security audit and penetration testing', 'pending-assignment');

-- Insert AI processing results for some invoices (replace UUIDs with actual invoice IDs)
INSERT INTO ai_processing_results (
  supplier_invoice_id, extracted_text, confidence_score, project_matches, processing_status
) VALUES 
  (
    (SELECT id FROM supplier_invoices WHERE qonto_id = 'QNT-SUP-001'),
    'Invoice for development services for website redesign project including frontend development and testing phases',
    95,
    '[
      {"projectName": "Website Redesign", "confidence": 95, "keywords": ["website", "redesign", "frontend"]},
      {"projectName": "E-commerce Platform", "confidence": 45, "keywords": ["platform"]}
    ]'::jsonb,
    'completed'
  ),
  (
    (SELECT id FROM supplier_invoices WHERE qonto_id = 'QNT-SUP-002'),
    'Design services for mobile application user interface and user experience optimization',
    78,
    '[
      {"projectName": "Mobile App Development", "confidence": 78, "keywords": ["mobile", "app", "ui", "ux"]},
      {"projectName": "Website Redesign", "confidence": 35, "keywords": ["design"]}
    ]'::jsonb,
    'completed'
  ),
  (
    (SELECT id FROM supplier_invoices WHERE qonto_id = 'QNT-SUP-003'),
    'Hosting services for Q1 2024 infrastructure requirements including server maintenance',
    45,
    '[
      {"projectName": "E-commerce Platform", "confidence": 45, "keywords": ["hosting", "server"]},
      {"projectName": "Website Redesign", "confidence": 30, "keywords": ["server"]}
    ]'::jsonb,
    'completed'
  ),
  (
    (SELECT id FROM supplier_invoices WHERE qonto_id = 'QNT-SUP-005'),
    'Security audit and penetration testing services for application security compliance',
    85,
    '[
      {"projectName": "Security Audit & Compliance", "confidence": 85, "keywords": ["security", "audit", "compliance"]},
      {"projectName": "E-commerce Platform", "confidence": 60, "keywords": ["security"]}
    ]'::jsonb,
    'completed'
  );

-- Verify the data was inserted
SELECT 
  si.supplier_name,
  si.amount_total,
  si.status,
  ai.confidence_score,
  ai.project_matches
FROM supplier_invoices si
LEFT JOIN ai_processing_results ai ON si.id = ai.supplier_invoice_id
ORDER BY si.created_at DESC;