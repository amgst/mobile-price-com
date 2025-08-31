#!/bin/bash

# Neon Database Migration Script for mobile-price.com
# This script deploys your mobile database to Neon

echo "🚀 Neon Database Migration for mobile-price.com"
echo "=============================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "Please set your Neon database connection string:"
    echo "export DATABASE_URL='postgresql://username:password@your-neon-host/dbname'"
    exit 1
fi

# Validate connection
echo "📡 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to database"
    echo "Please check your DATABASE_URL and network connection"
    exit 1
fi

echo "✅ Database connection successful"

# Import the schema and data
echo "📥 Importing database schema and data..."
if psql "$DATABASE_URL" -f neon-database.sql; then
    echo "✅ Database import completed successfully!"
    
    # Verify the import
    echo "📊 Verifying import..."
    BRAND_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM brands;")
    MOBILE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM mobiles;")
    
    echo "   - Brands imported: $BRAND_COUNT"
    echo "   - Mobiles imported: $MOBILE_COUNT"
    
    echo ""
    echo "🎉 Migration completed successfully!"
    echo "Your mobile-price.com database is now ready on Neon"
    echo ""
    echo "Next steps:"
    echo "1. Update your application's DATABASE_URL"
    echo "2. Deploy your application to your chosen platform"
    echo "3. Test the mobile comparison features"
    
else
    echo "❌ ERROR: Database import failed"
    exit 1
fi
