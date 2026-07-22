param(
  [string]$NodeVersion = "22.14.0",
  [string]$MariaVersion = "11.7.2"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectRoot "dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  POS Rahmat - Portable Package Builder " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Install dependencies
Write-Host "[1/7] Installing dependencies..." -ForegroundColor Yellow
Set-Location $ProjectRoot
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

# 2. Build Next.js app (standalone)
Write-Host "[2/7] Building Next.js app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

# 3. Prepare migration SQL files
Write-Host "[3/7] Preparing migration SQL..." -ForegroundColor Yellow
$MigrationsDir = Join-Path $ProjectRoot "src\db\migrations"
$CombinedSql = Join-Path $ProjectRoot "tools\schema.sql"

$sqlFiles = @(
  "0000_sour_sugar_man.sql",
  "0001_bumpy_zaran.sql",
  "0002_nappy_brood.sql",
  "0003_icy_ender_wiggin.sql",
  "0004_complex_winter_soldier.sql",
  "0005_bumpy_whiplash.sql",
  "0006_young_george_stacy.sql"
)

$lines = @()
foreach ($file in $sqlFiles) {
  $path = Join-Path $MigrationsDir $file
  if (Test-Path $path) {
    $content = Get-Content $path -Raw
    $content -split "`n" | Where-Object { $_ -notmatch "^-->" } | ForEach-Object { $lines += $_ }
    $lines += ""
  }
}
$combined = $lines -join "`n"
# Fix: serial -> int (MariaDB compatibility)
$combined = $combined -replace 'serial AUTO_INCREMENT NOT NULL', 'int AUTO_INCREMENT NOT NULL'
# Fix: remove ALTER TABLE MODIFY COLUMN id int (conflicts with serial)
$combined = $combined -replace '(?m)^ALTER TABLE .+ MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;.*\n?', ''
$combined | Set-Content -Path $CombinedSql -Encoding utf8
Write-Host "  -> Combined SQL created (serial→int fixed): $CombinedSql" -ForegroundColor Gray

# 4. Create dist directory
Write-Host "[4/7] Creating dist directory..." -ForegroundColor Yellow
if (Test-Path $DistDir) {
  Remove-Item -Recurse -Force $DistDir
}
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $DistDir "app") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $DistDir "sql") -Force | Out-Null

# 5. Copy standalone build
Write-Host "[5/7] Copying standalone build..." -ForegroundColor Yellow
Copy-Item -Recurse -Path (Join-Path $ProjectRoot ".next\standalone\*") -Destination (Join-Path $DistDir "app\")
Copy-Item -Recurse -Path (Join-Path $ProjectRoot "public") -Destination (Join-Path $DistDir "app\public")

# Copy .next/static (not included in standalone output)
$staticSrc = Join-Path $ProjectRoot ".next\static"
$staticDst = Join-Path $DistDir "app\.next\static"
if (Test-Path $staticSrc) {
  New-Item -ItemType Directory -Path $staticDst -Force | Out-Null
  Copy-Item -Recurse -Path "$staticSrc\*" -Destination $staticDst
  Write-Host "  -> Copied .next/static" -ForegroundColor Gray
}

# Clean up dev artifacts from standalone output
$appEnv = Join-Path $DistDir "app\.env"
if (Test-Path $appEnv) { Remove-Item -Force $appEnv }

# 6. Copy SQL + setup-db
Write-Host "[6/7] Copying setup files..." -ForegroundColor Yellow
Copy-Item -Path $CombinedSql -Destination (Join-Path $DistDir "sql\schema.sql")
$UpgradeSql = Join-Path $ProjectRoot "portable\sql\upgrade.sql"
if (Test-Path $UpgradeSql) { Copy-Item -Path $UpgradeSql -Destination (Join-Path $DistDir "sql\upgrade.sql") }
# Copy print-server
Copy-Item -Recurse -Path (Join-Path $ProjectRoot "print-server") -Destination (Join-Path $DistDir "print-server")
# Clean print-server node_modules lock file
$psLock = Join-Path $DistDir "print-server\node_modules\.package-lock.json"
if (Test-Path $psLock) { Remove-Item -Force $psLock -ErrorAction SilentlyContinue }

# Copy batch scripts
foreach ($file in @(  "setup.bat", "start.bat", "uninstall.bat", "seed-db.bat", "db-upgrade.bat", "fix-auth-url.bat", "README.md")) {
  $src = Join-Path $ProjectRoot "portable\$file"
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination $DistDir
  }
}

Remove-Item -Force $CombinedSql -ErrorAction SilentlyContinue

# 6.5. Generate seed SQL (pre-computed bcrypt hash)
Write-Host "[6.5/7] Generating seed SQL..." -ForegroundColor Yellow
Set-Location $ProjectRoot
node tools/generate-seed-sql.js
if ($LASTEXITCODE -ne 0) { throw "Seed SQL generation failed" }

# 7. Generate .env.example + version file
Write-Host "[7/7] Generating config files..." -ForegroundColor Yellow
@"
# This is a reference only. Setup.bat generates .env automatically.
# AUTH_URL is intentionally omitted — auth config has trustHost: true,
# so NextAuth v5 uses the request's Host header. This makes login work
# from any LAN IP without reconfiguration.
DATABASE_URL=mysql://root:@localhost:3307/pos_db
AUTH_SECRET=GENERATE_ME
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@ | Out-File -FilePath (Join-Path $DistDir ".env.example") -Encoding utf8

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
@"
{
  "app": "POS Rahmat",
  "version": "1.0.0",
  "buildDate": "$timestamp",
  "node": "$NodeVersion",
  "mariadb": "$MariaVersion"
}
"@ | Out-File -FilePath (Join-Path $DistDir "version.json") -Encoding utf8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Portable package: $DistDir" -ForegroundColor White
Write-Host ""
Write-Host "Before distributing, download these and place them:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Node.js v${NodeVersion} (Windows x64 ZIP)" -ForegroundColor White
Write-Host "     Link: https://nodejs.org/dist/v${NodeVersion}/node-v${NodeVersion}-win-x64.zip" -ForegroundColor Gray
Write-Host "     Extract to: $DistDir\node\" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. MariaDB v${MariaVersion} (Windows ZIP)" -ForegroundColor White
Write-Host "     Link: https://archive.mariadb.org/mariadb-${MariaVersion}/winx64-packages/mariadb-${MariaVersion}-winx64.zip" -ForegroundColor Gray
Write-Host "     Extract to: $DistDir\mariadb\" -ForegroundColor Gray
Write-Host ""
Write-Host "Then on target computer, run: setup.bat" -ForegroundColor Yellow
Write-Host ""
