-- Initialize additional databases for services
-- Main openspawn database is created by POSTGRES_DB env var

-- Create langfuse database if it doesn't exist
SELECT 'CREATE DATABASE langfuse'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'langfuse')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE langfuse TO openspawn;
