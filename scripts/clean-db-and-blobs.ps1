# ============================================================
#  Dhanak Trinket — Clean DB + Blob Storage
#  Drops all business data. Leaves schema and migrations intact.
#  Run from the repo root:
#    .\scripts\clean-db-and-blobs.ps1 [-DryRun]
# ============================================================
param(
    [switch]$DryRun  # Pass -DryRun to preview without deleting anything
)

$ErrorActionPreference = "Stop"

# ─── Configuration ──────────────────────────────────────────
$StorageAccount = "stdhanak2026prod"
$ProductsContainer = "product-images"
$ExpensesContainer = "product-images"  # bills are stored in the same container under expenses/ prefix
$ResourceGroup = "rg-dhanak-trinket-prod"
$ServerName = "sql-dhanak-trinket-prod"
$DatabaseName = "db-dhanak-trinket"

# ─── Safety gate ────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Red
Write-Host "  WARNING: This will permanently delete ALL data!" -ForegroundColor Red
Write-Host "  Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "  Blob containers: $ProductsContainer (products + expenses/)" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Red
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] No changes will be made." -ForegroundColor Cyan
    Write-Host ""
}

if (-not $DryRun) {
    $confirm = Read-Host "Type CLEAN to confirm deletion"
    if ($confirm -ne "CLEAN") {
        Write-Host "Aborted." -ForegroundColor Green
        exit 0
    }
}

# ─── STEP 1: Clean Blob Storage ─────────────────────────────
Write-Host ""
Write-Host "[ Blob Storage ]" -ForegroundColor Cyan

# Product images
$productBlobs = az storage blob list `
    --account-name $StorageAccount `
    --container-name $ProductsContainer `
    --prefix "products/" `
    --query "[].name" `
    --output tsv `
    --auth-mode login 2>$null

if ($productBlobs) {
    $count = ($productBlobs -split "`n" | Where-Object { $_ }).Count
    Write-Host "  Found $count product image blobs"
    if (-not $DryRun) {
        Write-Host "  Deleting product images..." -NoNewline
        az storage blob delete-batch `
            --account-name $StorageAccount `
            --source $ProductsContainer `
            --pattern "products/*" `
            --auth-mode login | Out-Null
        Write-Host " done" -ForegroundColor Green
    }
    else {
        Write-Host "  [DRY RUN] Would delete $count product image blobs"
    }
}
else {
    Write-Host "  No product image blobs found"
}

# Expense bills
$expenseBlobs = az storage blob list `
    --account-name $StorageAccount `
    --container-name $ProductsContainer `
    --prefix "expenses/" `
    --query "[].name" `
    --output tsv `
    --auth-mode login 2>$null

if ($expenseBlobs) {
    $count = ($expenseBlobs -split "`n" | Where-Object { $_ }).Count
    Write-Host "  Found $count expense bill blobs"
    if (-not $DryRun) {
        Write-Host "  Deleting expense bills..." -NoNewline
        az storage blob delete-batch `
            --account-name $StorageAccount `
            --source $ProductsContainer `
            --pattern "expenses/*" `
            --auth-mode login | Out-Null
        Write-Host " done" -ForegroundColor Green
    }
    else {
        Write-Host "  [DRY RUN] Would delete $count expense bill blobs"
    }
}
else {
    Write-Host "  No expense bill blobs found"
}

# ─── STEP 2: Clean Database via az sql ──────────────────────
Write-Host ""
Write-Host "[ Azure SQL Database ]" -ForegroundColor Cyan

# TSQL: delete in FK-safe order, reset identity seeds
$sql = @"
-- FK-safe delete order
DELETE FROM [dbo].[Sales];
DELETE FROM [dbo].[Expenses];
DELETE FROM [dbo].[ProductImages];
DELETE FROM [dbo].[Products];

-- Reset identity seeds so IDs start from 1 again
DBCC CHECKIDENT ('[Sales]',        RESEED, 0);
DBCC CHECKIDENT ('[Expenses]',     RESEED, 0);
DBCC CHECKIDENT ('[ProductImages]', RESEED, 0);
DBCC CHECKIDENT ('[Products]',     RESEED, 0);

SELECT 'Products'     AS [Table], COUNT(*) AS Rows FROM [dbo].[Products]
UNION ALL
SELECT 'ProductImages', COUNT(*) FROM [dbo].[ProductImages]
UNION ALL
SELECT 'Sales',         COUNT(*) FROM [dbo].[Sales]
UNION ALL
SELECT 'Expenses',      COUNT(*) FROM [dbo].[Expenses];
"@

if (-not $DryRun) {
    Write-Host "  Running DELETE + RESEED on $DatabaseName..." -NoNewline
    try {
        $result = az sql db query `
            --resource-group $ResourceGroup `
            --server $ServerName `
            --name $DatabaseName `
            --query-text $sql `
            --output json 2>&1

        Write-Host " done" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Row counts after clean:" -ForegroundColor Yellow
        $result | ConvertFrom-Json | ForEach-Object {
            $_.resultSets[0].rows | ForEach-Object {
                Write-Host ("    {0,-20} {1} rows" -f $_[0], $_[1])
            }
        }
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host ""
        Write-Host "  az sql db query requires AAD token auth. Run the SQL below manually" -ForegroundColor Yellow
        Write-Host "  in Azure Portal → SQL Database → Query editor:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host $sql -ForegroundColor Gray
    }
}
else {
    Write-Host "  [DRY RUN] Would run the following SQL on $DatabaseName`:"
    Write-Host ""
    Write-Host $sql -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
if ($DryRun) {
    Write-Host "  DRY RUN complete — no data was deleted" -ForegroundColor Cyan
}
else {
    Write-Host "  Clean complete!" -ForegroundColor Green
}
Write-Host "=====================================================" -ForegroundColor Green
