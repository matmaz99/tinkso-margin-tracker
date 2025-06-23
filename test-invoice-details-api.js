/**
 * Test script for Invoice Details API endpoints
 * 
 * This script tests the functionality of:
 * - GET /api/supplier-invoices/[id] - Fetch single invoice details
 * - PUT /api/supplier-invoices/[id] - Update invoice details and assignments
 * - DELETE /api/supplier-invoices/[id] - Delete invoice
 * 
 * Usage: node test-invoice-details-api.js
 */

const baseUrl = 'http://localhost:3000'

// Test configuration
const testConfig = {
  // Replace with a real invoice ID from your database
  invoiceId: 'test-invoice-id',
  
  // Test data for updates
  updateData: {
    supplierName: 'Updated Supplier Name',
    amountTotal: 1500.00,
    amountNet: 1250.00,
    amountVat: 250.00,
    description: 'Updated description',
    invoiceDate: '2024-01-15'
  },
  
  // Test project assignments
  projectAssignments: [
    {
      projectId: 'test-project-id',
      amountAssigned: 1500.00,
      assignmentType: 'manual',
      notes: 'Test assignment from API'
    }
  ]
}

async function testGetInvoiceDetails() {
  console.log('\n🧪 Testing GET /api/supplier-invoices/[id]')
  
  try {
    const url = `${baseUrl}/api/supplier-invoices/${testConfig.invoiceId}?includeAI=true&includeAssignments=true`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log(`Error: ${error}`)
      return null
    }
    
    const data = await response.json()
    console.log('✅ Success!')
    console.log(`Invoice: ${data.invoice?.supplierName} - €${data.invoice?.amountTotal}`)
    console.log(`AI Extraction: ${data.invoice?.aiExtraction ? 'Yes' : 'No'}`)
    console.log(`Assignments: ${data.invoice?.assignments?.length || 0}`)
    
    return data.invoice
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return null
  }
}

async function testUpdateInvoiceDetails() {
  console.log('\n🧪 Testing PUT /api/supplier-invoices/[id] (Update Details)')
  
  try {
    const url = `${baseUrl}/api/supplier-invoices/${testConfig.invoiceId}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig.updateData)
    })
    
    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log(`Error: ${error}`)
      return false
    }
    
    const data = await response.json()
    console.log('✅ Success!')
    console.log(`Updated invoice: ${data.invoice?.supplier_name}`)
    
    return true
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return false
  }
}

async function testUpdateInvoiceAssignments() {
  console.log('\n🧪 Testing PUT /api/supplier-invoices/[id] (Update Assignments)')
  
  try {
    const url = `${baseUrl}/api/supplier-invoices/${testConfig.invoiceId}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'assigned',
        projectAssignments: testConfig.projectAssignments
      })
    })
    
    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log(`Error: ${error}`)
      return false
    }
    
    const data = await response.json()
    console.log('✅ Success!')
    console.log(`Assignment completed`)
    
    return true
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return false
  }
}

async function testDeleteInvoice() {
  console.log('\n🧪 Testing DELETE /api/supplier-invoices/[id]')
  console.log('⚠️  Warning: This will actually delete the invoice!')
  
  // Uncomment to actually test deletion
  // console.log('🚫 Skipping delete test for safety')
  // return true
  
  try {
    const url = `${baseUrl}/api/supplier-invoices/${testConfig.invoiceId}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log(`Error: ${error}`)
      return false
    }
    
    const data = await response.json()
    console.log('✅ Success!')
    console.log(`Invoice deleted`)
    
    return true
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('🚀 Invoice Details API Test Suite')
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Invoice ID: ${testConfig.invoiceId}`)
  
  // Test 1: Get invoice details
  const invoice = await testGetInvoiceDetails()
  
  if (!invoice) {
    console.log('\n❌ Cannot continue tests - failed to fetch invoice details')
    console.log('📝 Make sure to update the invoiceId in testConfig with a real invoice ID')
    return
  }
  
  // Test 2: Update invoice details
  await testUpdateInvoiceDetails()
  
  // Test 3: Update invoice assignments
  await testUpdateInvoiceAssignments()
  
  // Test 4: Delete invoice (commented out for safety)
  // await testDeleteInvoice()
  
  console.log('\n✅ Test suite completed!')
  console.log('\n📝 To run with a real invoice:')
  console.log('1. Update testConfig.invoiceId with a real invoice ID from your database')
  console.log('2. Update testConfig.projectAssignments[0].projectId with a real project ID')
  console.log('3. Start your development server: npm run dev')
  console.log('4. Run this script: node test-invoice-details-api.js')
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  testGetInvoiceDetails,
  testUpdateInvoiceDetails,
  testUpdateInvoiceAssignments,
  testDeleteInvoice
}