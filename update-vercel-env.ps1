# Update Vercel Environment Variables
# Make sure you have Vercel CLI installed: npm i -g vercel

# Pull current environment variables
echo "Pulling current Vercel environment variables..."
vercel env pull

# Set the SUPABASE_DB_URL
echo "Setting SUPABASE_DB_URL environment variable..."
$db_url = "postgresql://postgres:MCiuDua8s1wrGjVj@db.nuxlqxfbsocgmszwktwt.supabase.co:5432/postgres"
vercel env add SUPABASE_DB_URL "$db_url" --scope sidtricoders-projects --yes

# Set the JWT_SECRET
echo "Setting JWT_SECRET environment variable..."
$jwt_secret = "FPisgEdPYGalU7OGCwDnXywEHx3t7zqUPFU2idX5fCdZsuwWJyKtYf2nE4UyhvE8rNwtfK2cdLb3dq1ZxAEe2Q=="
vercel env add JWT_SECRET "$jwt_secret" --scope sidtricoders-projects --yes

# Set NODE_ENV to production
echo "Setting NODE_ENV environment variable..."
vercel env add NODE_ENV "production" --scope sidtricoders-projects --yes

# Redeploy the project
echo "Redeploying backend to Vercel..."
cd backend
vercel --prod

echo "Environment variables updated and redeployment triggered!"
