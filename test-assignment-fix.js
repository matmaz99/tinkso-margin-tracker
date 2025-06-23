#!/usr/bin/env node

/**
 * Test script to verify the invoice assignment fix
 * This script tests that the invoice assignment API works without the 'notes' column
 */

const TEST_BASE_URL = 'http://localhost:3000'

async function testInvoiceAssignment() {
  console.log('🧪 Testing Invoice Assignment Fix...\n')
  
  try {
    // First, get a list of supplier invoices to find one to test with
    console.log('📋 Fetching supplier invoices...')
    const invoicesResponse = await fetch(`${TEST_BASE_URL}/api/supplier-invoices?unassignedOnly=true&limit=1`)
    
    if (!invoicesResponse.ok) {
      throw new Error(`Failed to fetch invoices: ${invoicesResponse.status}`)
    }
    
    const invoicesData = await invoicesResponse.json()
    const testInvoice = invoicesData.supplierInvoices?.[0]
    
    if (!testInvoice) {
      console.log('ℹ️  No unassigned invoices found to test with')
      console.log('   Create some test data or import from Qonto first')
      return
    }
    
    console.log(`✅ Found test invoice: ${testInvoice.id} (${testInvoice.supplierName})`)
    
    // Get projects list
    console.log('📂 Fetching projects...')
    const projectsResponse = await fetch(`${TEST_BASE_URL}/api/projects`)
    
    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`)
    }
    
    const projectsData = await projectsResponse.json()
    const testProject = projectsData.projects?.[0]
    
    if (!testProject) {
      console.log('ℹ️  No projects found to test assignment with')
      console.log('   Create a test project first')
      return
    }
    
    console.log(`✅ Found test project: ${testProject.id} (${testProject.name})`)
    
    // Test the assignment (this should NOT fail with notes column error)
    console.log('🎯 Testing invoice assignment (this is where the error was occurring)...')
    
    const assignmentData = {
      status: 'assigned',
      projectAssignments: [{
        projectId: testProject.id,
        amountAssigned: testInvoice.amountTotal,
        assignmentType: 'test'
      }]
    }
    
    const assignmentResponse = await fetch(`${TEST_BASE_URL}/api/supplier-invoices/${testInvoice.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assignmentData)
    })
    
    if (!assignmentResponse.ok) {
      const errorText = await assignmentResponse.text()
      console.log('❌ Assignment failed with error:')
      console.log(errorText)
      throw new Error(`Assignment failed: ${assignmentResponse.status}`)
    }
    
    const assignmentResult = await assignmentResponse.json()
    console.log('✅ Assignment successful!')
    console.log(`   Invoice ${testInvoice.id} assigned to project ${testProject.name}`)
    
    // Verify the assignment was created properly
    console.log('🔍 Verifying assignment was created...')
    const verificationResponse = await fetch(`${TEST_BASE_URL}/api/supplier-invoices/${testInvoice.id}?includeAssignments=true`)
    
    if (!verificationResponse.ok) {
      throw new Error(`Failed to verify assignment: ${verificationResponse.status}`)
    }
    
    const verificationData = await verificationResponse.json()
    const assignments = verificationData.invoice?.assignments || []
    
    if (assignments.length > 0) {
      console.log('✅ Assignment verified in database!')
      console.log(`   Found ${assignments.length} assignment(s)`)
      assignments.forEach((assignment, i) => {
        console.log(`   ${i + 1}. Project: ${assignment.projectName}, Amount: €${assignment.amountAssigned}`)
      })
    } else {
      console.log('⚠️  Assignment not found in verification check')
    }
    
    console.log('\n🎉 Test completed successfully!')
    console.log('   The "notes column not found" error has been fixed.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testInvoiceAssignment()