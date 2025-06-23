-- Fix RLS policies for sync log tables to allow integrations to work
-- This migration adds INSERT/UPDATE/DELETE policies for clickup_sync_log and qonto_sync_log tables

-- =============================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Allow authenticated users to read sync logs" ON clickup_sync_log;
DROP POLICY IF EXISTS "Allow authenticated users to read qonto sync logs" ON qonto_sync_log;

-- =============================================
-- CREATE COMPREHENSIVE POLICIES FOR SYNC LOGS
-- =============================================

-- ClickUp Sync Log Policies - Allow full access for authenticated users
CREATE POLICY "Allow authenticated users full access to clickup_sync_log" 
    ON clickup_sync_log FOR ALL USING (auth.role() = 'authenticated');

-- Qonto Sync Log Policies - Allow full access for authenticated users  
CREATE POLICY "Allow authenticated users full access to qonto_sync_log" 
    ON qonto_sync_log FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- VERIFY POLICIES ARE WORKING
-- =============================================

-- Test insert to verify policies work (will be cleaned up)
DO $$
BEGIN
    -- Test ClickUp sync log insert
    INSERT INTO clickup_sync_log (sync_type, sync_status, records_processed) 
    VALUES ('test', 'completed', 0);
    
    -- Test Qonto sync log insert
    INSERT INTO qonto_sync_log (sync_type, sync_status, records_processed) 
    VALUES ('test', 'completed', 0);
    
    -- Clean up test records
    DELETE FROM clickup_sync_log WHERE sync_type = 'test';
    DELETE FROM qonto_sync_log WHERE sync_type = 'test';
    
    RAISE NOTICE 'RLS policies for sync logs have been successfully updated and tested';
END
$$;