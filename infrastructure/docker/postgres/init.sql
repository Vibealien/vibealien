-- Initialize databases for each microservice

-- Auth Service Database
CREATE DATABASE auth_db;

-- User Service Database
CREATE DATABASE user_db;

-- Project Service Database
CREATE DATABASE project_db;

-- Compiler Service Database
CREATE DATABASE compiler_db;

-- Notification Service Database
CREATE DATABASE notification_db;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE auth_db TO vibe_user;
GRANT ALL PRIVILEGES ON DATABASE user_db TO vibe_user;
GRANT ALL PRIVILEGES ON DATABASE project_db TO vibe_user;
GRANT ALL PRIVILEGES ON DATABASE compiler_db TO vibe_user;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO vibe_user;
