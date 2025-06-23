#!/usr/bin/env node

/**
 * Apply Database Migration - Fix RLS Policies for Sync Logs
 * This script applies the migration to fix Row Level Security policies
 * for ClickUp and Qonto sync log tables.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔧 Applying RLS policy fix migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/002_fix_sync_log_rls_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('⚠️  You may need to apply this migration manually in the Supabase SQL Editor.');
      console.log('📁 Migration file location:', migrationPath);
      return false;
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('🔒 RLS policies for sync log tables have been updated.');
    return true;
    
  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    console.log('⚠️  Please apply the migration manually in the Supabase SQL Editor.');
    return false;
  }
}

async function testPolicies() {
  try {
    console.log('🧪 Testing RLS policies...');
    
    // Try to insert a test record into clickup_sync_log
    const { error: clickupError } = await supabase
      .from('clickup_sync_log')
      .insert({
        sync_type: 'test',
        sync_status: 'completed',
        records_processed: 0
      });
    
    if (clickupError) {
      console.error('❌ ClickUp sync log test failed:', clickupError.message);
      return false;
    }
    
    // Try to insert a test record into qonto_sync_log
    const { error: qontoError } = await supabase
      .from('qonto_sync_log')
      .insert({
        sync_type: 'test',
        sync_status: 'completed',
        records_processed: 0
      });
    
    if (qontoError) {
      console.error('❌ Qonto sync log test failed:', qontoError.message);
      return false;
    }
    
    // Clean up test records
    await supabase.from('clickup_sync_log').delete().eq('sync_type', 'test');
    await supabase.from('qonto_sync_log').delete().eq('sync_type', 'test');
    
    console.log('✅ RLS policies are working correctly!');
    return true;
    
  } catch (err) {
    console.error('❌ Error testing policies:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting RLS policy fix for integration sync logs...\n');
  
  // First try to test if policies already work
  const policiesWork = await testPolicies();
  
  if (policiesWork) {
    console.log('✨ RLS policies are already working correctly!');
    console.log('🎯 You can now use the ClickUp and Qonto integrations.');
    return;
  }
  
  console.log('🔧 RLS policies need to be fixed. Applying migration...\n');
  
  // Apply the migration
  const migrationSuccess = await applyMigration();
  
  if (migrationSuccess) {
    // Test again after migration
    const retestSuccess = await testPolicies();
    if (retestSuccess) {
      console.log('\n🎉 Success! Integration sync logs are now working.');
      console.log('🌐 Navigate to: http://localhost:3001/integrations-test');
      console.log('📊 You can now sync data from ClickUp and Qonto.');
    }
  } else {
    console.log('\n📝 Manual Migration Required:');
    console.log('1. Open your Supabase project dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and run the contents of:');
    console.log('   supabase/migrations/002_fix_sync_log_rls_policies.sql');
  }
}

// Run the script
main().catch(console.error);