# Mobile Price Pro - Local Development Setup

This is a mobile price comparison website built with React, Express, and PostgreSQL.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (local or cloud)
- OpenAI API key (optional, for AI features)
- RapidAPI key (optional, for data import features)

## Local Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the `.env` file and update the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mobil_price_pro

# Port Configuration
PORT=5000

# Environment
NODE_ENV=development

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# RapidAPI Configuration (optional)
RAPIDAPI_KEY=your_rapidapi_key_here

# Site Configuration
VITE_SITE_URL=http://localhost:5000
```

### 3. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a database named `mobil_price_pro`
3. Update the `DATABASE_URL` in `.env` with your local credentials

#### Option B: Free Cloud Database (Recommended)
For easier setup and deployment, use a free cloud database:

**Quick Setup:**
```bash
npm run db:setup
```
This interactive wizard will help you configure your database connection.

**Manual Setup:**
1. Choose a provider:
   - **Neon** (Recommended): https://neon.tech - 512MB free
   - **Supabase**: https://supabase.com - 500MB free
   - **Railway**: https://railway.app - $5 monthly credit

2. Create account and new database
3. Copy the connection string
4. Update `DATABASE_URL` in `.env`

#### Migrating from Replit Database
If you have existing data on Replit, see the complete migration guide:
📖 **[DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md)**

**Quick Migration:**
```bash
# 1. Add your Replit database URL to .env as OLD_DATABASE_URL
# 2. Set up new database and update DATABASE_URL
# 3. Run migration
npm run db:migrate
### 4. Database Schema Setup

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Common Issues and Solutions

### Issue 1: "NODE_ENV is not recognized"
**Solution**: This has been fixed with `cross-env`. If you still encounter this, ensure you're using the latest package.json.

### Issue 2: "DATABASE_URL must be set"
**Solution**: 
1. Ensure the `.env` file exists in the root directory
2. Update the `DATABASE_URL` with a valid PostgreSQL connection string
3. Make sure your database is running and accessible

### Issue 3: "OPENAI_API_KEY environment variable is missing"
**Solution**: 
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file
3. Or comment out AI-related routes if not needed for development

### Issue 4: Database connection errors
**Solution**:
1. Verify your database is running
2. Check the connection string format
3. Ensure the database exists
4. Check firewall/network settings

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── public/          # Static assets
└── .env            # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - Type checking

## API Keys Setup (Optional)

### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and generate an API key
3. Add to `.env` file

### RapidAPI Key
1. Visit [RapidAPI](https://rapidapi.com/)
2. Create an account and get your API key
3. Add to `.env` file

## Need Help?

If you encounter any issues:
1. Check that all environment variables are set correctly
2. Ensure your database is running and accessible
3. Verify all dependencies are installed
4. Check the console for specific error messages