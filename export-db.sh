#!/bin/bash

# Database Export Script for mobile-price.com
# Multiple export methods for different deployment platforms

echo "🗄️  Mobile Price Database Export"
echo "================================="

# Method 1: Using our custom export script (JSON + SQL)
echo "📦 Method 1: Exporting via TypeScript script..."
npx tsx server/scripts/export-data.ts

# Method 2: Direct PostgreSQL dump (if pg_dump available)
if command -v pg_dump &> /dev/null; then
    echo "📦 Method 2: Creating PostgreSQL dump..."
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > postgresql-dump.sql
        echo "✅ PostgreSQL dump created: postgresql-dump.sql"
    else
        echo "⚠️  DATABASE_URL not found for pg_dump"
    fi
else
    echo "ℹ️  pg_dump not available, skipping PostgreSQL dump"
fi

# Method 3: Heroku-style backup (if on Heroku)
if [ -n "$HEROKU_APP_NAME" ]; then
    echo "📦 Method 3: Creating Heroku backup..."
    heroku pg:backups:capture --app "$HEROKU_APP_NAME"
    heroku pg:backups:download --app "$HEROKU_APP_NAME"
    echo "✅ Heroku backup downloaded"
fi

echo ""
echo "📁 Export Files Created:"
echo "  - database-export.json (JSON format)"
echo "  - database-export.sql (SQL format)"
[ -f postgresql-dump.sql ] && echo "  - postgresql-dump.sql (pg_dump)"
[ -f latest.dump ] && echo "  - latest.dump (Heroku backup)"

echo ""
echo "🚀 Ready for deployment to:"
echo "  - Railway: Use database-export.sql"
echo "  - Render: Use postgresql-dump.sql" 
echo "  - Vercel: Use JSON export with Neon"
echo "  - Any PostgreSQL: Use postgresql-dump.sql"