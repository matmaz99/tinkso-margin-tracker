-- Add ClickUp folder ID to projects table for proper folder-based project sync
-- This migration adds the clickup_folder_id column to track ClickUp folders as projects

-- =============================================
-- ADD CLICKUP FOLDER ID COLUMN
-- =============================================

-- Add clickup_folder_id column to projects table
ALTER TABLE projects ADD COLUMN clickup_folder_id VARCHAR(50) UNIQUE;

-- Create index for performance
CREATE INDEX idx_projects_clickup_folder_id ON projects(clickup_folder_id);

-- Add comment for documentation
COMMENT ON COLUMN projects.clickup_folder_id IS 'ClickUp folder ID that represents this project - folders are client project containers';

-- =============================================
-- UPDATE EXISTING PROJECTS
-- =============================================

-- Set clickup_folder_id to NULL for existing projects (they can be synced later)
-- This ensures no conflicts with future folder syncs

-- =============================================
-- VERIFY CHANGES
-- =============================================

-- Test that the column was added successfully
DO $$
BEGIN
    -- Check if column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'clickup_folder_id'
    ) THEN
        RAISE NOTICE 'Column clickup_folder_id successfully added to projects table';
    ELSE
        RAISE EXCEPTION 'Failed to add clickup_folder_id column to projects table';
    END IF;
END
$$;