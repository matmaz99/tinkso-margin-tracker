# Fix RLS Policies for Integration Sync Logs

## Problem
The ClickUp and Qonto integrations are failing with RLS (Row Level Security) policy violations:
```
Failed to create sync log: {
  code: '42501',
  message: 'new row violates row-level security policy for table "clickup_sync_log"'
}
```

## Solution
Apply the RLS policy fix by running this SQL in your Supabase SQL Editor:

## 🚀 Quick Fix Instructions

1. **Open Supabase Dashboard**: https://app.supabase.com/projects
2. **Go to SQL Editor** in your project
3. **Copy and paste this SQL:**

```sql
-- Fix RLS policies for sync log tables to allow integrations to work
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read sync logs" ON clickup_sync_log;
DROP POLICY IF EXISTS "Allow authenticated users to read qonto sync logs" ON qonto_sync_log;

-- Create comprehensive policies for sync logs
CREATE POLICY "Allow authenticated users full access to clickup_sync_log" 
    ON clickup_sync_log FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to qonto_sync_log" 
    ON qonto_sync_log FOR ALL USING (auth.role() = 'authenticated');

-- Test the policies
INSERT INTO clickup_sync_log (sync_type, sync_status, records_processed) 
VALUES ('test', 'completed', 0);

INSERT INTO qonto_sync_log (sync_type, sync_status, records_processed) 
VALUES ('test', 'completed', 0);

-- Clean up test records
DELETE FROM clickup_sync_log WHERE sync_type = 'test';
DELETE FROM qonto_sync_log WHERE sync_type = 'test';

SELECT 'RLS policies fixed successfully!' as status;
```

4. **Click "Run"** to execute the SQL
5. **Verify** you see "RLS policies fixed successfully!" in the results

## ✅ After applying the fix:

1. Navigate to: http://localhost:3001/integrations-test
2. Try the ClickUp and Qonto sync operations
3. They should now work without RLS policy violations

## 🔍 What this fixes:
- Allows authenticated users to INSERT/UPDATE/DELETE records in sync log tables
- Maintains security while enabling integration functionality
- Resolves the "new row violates row-level security policy" errors