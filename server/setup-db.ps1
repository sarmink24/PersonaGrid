# PersonaGrid Database Setup Script
# Make sure to update server/.env with your PostgreSQL password first!

Write-Host "🚀 Setting up PersonaGrid database..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found. Please copy env.example to .env and update DATABASE_URL" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Pushing Prisma schema to database..." -ForegroundColor Yellow
npm run prisma:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema pushed successfully!" -ForegroundColor Green
    
    Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Yellow
    npm run prisma:seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup complete!" -ForegroundColor Green
    } else {
        Write-Host "❌ Seeding failed" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Schema push failed. Please check your DATABASE_URL in .env" -ForegroundColor Red
}

