// Test script to create sample supplier invoices for testing the queue
// Run this with: node test-supplier-invoices.js

const testInvoices = [
  {
    supplierName: "DevTools Agency",
    amountTotal: 8000,
    amountNet: 6880,
    amountVat: 1120,
    currency: "EUR",
    invoiceDate: "2024-02-10",
    description: "Development resources - Website project February",
    qontoId: "QNT-SUP-001",
    status: "pending-assignment"
  },
  {
    supplierName: "Design Studio Pro", 
    amountTotal: 5000,
    amountNet: 4300,
    amountVat: 700,
    currency: "EUR",
    invoiceDate: "2024-02-05",
    description: "UI/UX Design Services for mobile application",
    qontoId: "QNT-SUP-002",
    status: "pending-assignment"
  },
  {
    supplierName: "CloudHost Services",
    amountTotal: 1200,
    amountNet: 1032,
    amountVat: 168,
    currency: "EUR", 
    invoiceDate: "2024-02-01",
    description: "Server hosting and infrastructure Q1 2024",
    qontoId: "QNT-SUP-003",
    status: "low-confidence"
  },
  {
    supplierName: "Marketing Solutions Ltd",
    amountTotal: 2500,
    amountNet: 2150,
    amountVat: 350,
    currency: "EUR",
    invoiceDate: "2024-02-12", 
    description: "Digital marketing campaign management",
    qontoId: "QNT-SUP-004",
    status: "no-match"
  }
];

async function createTestInvoices() {
  const baseUrl = 'http://localhost:3000'; // Adjust if different
  
  console.log('Creating test supplier invoices...');
  
  for (const invoice of testInvoices) {
    try {
      const response = await fetch(`${baseUrl}/api/supplier-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created invoice: ${invoice.supplierName} - €${invoice.amountTotal}`);
      } else {
        console.log(`❌ Failed to create invoice: ${invoice.supplierName}`, await response.text());
      }
    } catch (error) {
      console.log(`❌ Error creating invoice: ${invoice.supplierName}`, error.message);
    }
  }
  
  console.log('\n🎉 Test data creation complete!');
  console.log('Now you can visit: http://localhost:3000/invoices/queue');
}

// Also create some AI processing results for testing
async function createAIResults() {
  console.log('\n📝 Note: To test AI features, you would need to manually insert AI processing results into the ai_processing_results table:');
  console.log(`
INSERT INTO ai_processing_results (supplier_invoice_id, extracted_text, confidence_score, project_matches) 
VALUES (
  '[INVOICE_ID]',
  'Invoice for development services for website redesign project...',
  95,
  '[
    {"projectName": "Website Redesign", "confidence": 95, "keywords": ["website", "redesign"]},
    {"projectName": "E-commerce Platform", "confidence": 45, "keywords": ["platform"]}
  ]'::jsonb
);
  `);
}

if (require.main === module) {
  createTestInvoices().then(() => {
    createAIResults();
  });
}

module.exports = { createTestInvoices, testInvoices };