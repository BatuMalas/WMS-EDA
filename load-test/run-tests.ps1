# =============================================================
# WMS Load Test - Script Eksekusi Otomatis (PowerShell)
# =============================================================
# Menjalankan semua 9 skenario load test secara berurutan,
# menyimpan hasil JSON, dan mencetak ringkasan akhir.
#
# Cara menjalankan:
#   cd load-test
#   .\run-tests.ps1
#
# Untuk satu skenario saja:
#   .\run-tests.ps1 -Only UC01
# =============================================================

param(
  [string]$Only = "ALL",
  [string]$BaseUrl = "http://localhost:8000/api",
  [string]$StaffUser = "petugas1",
  [string]$StaffPass = "password",
  [string]$ManajerUser = "manajer1",
  [string]$ManajerPass = "password"
)

# --- Fungsi output berwarna ---
function Write-Header {
  param([string]$msg)
  Write-Host ""
  Write-Host "========================================================" -ForegroundColor Cyan
  Write-Host "  $msg" -ForegroundColor Cyan
  Write-Host "========================================================" -ForegroundColor Cyan
}

function Write-Step {
  param([string]$msg)
  Write-Host ""
  Write-Host ">> $msg" -ForegroundColor Yellow
}

function Write-OK {
  param([string]$msg)
  Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Fail {
  param([string]$msg)
  Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

# --- Buat direktori results jika belum ada ---
$resultsDir = "results"
if (-not (Test-Path $resultsDir)) {
  New-Item -ItemType Directory -Path $resultsDir | Out-Null
  Write-OK "Direktori '$resultsDir' dibuat"
}

# --- Header ---
Write-Header "WMS MODULAR MONOLITH - LOAD TEST SUITE"
Write-Host "  Base URL  : $BaseUrl" -ForegroundColor White
Write-Host "  Timestamp : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "  Mode      : $Only" -ForegroundColor White

# --- Cek k6 terinstall ---
try {
  $k6Version = & k6 version 2>&1
  Write-OK "k6 ditemukan: $k6Version"
} catch {
  Write-Fail "k6 tidak ditemukan!"
  Write-Host "  Install: winget install k6 --source winget" -ForegroundColor DarkYellow
  Write-Host "  Atau download: https://dl.k6.io/msi/k6-latest-amd64.msi" -ForegroundColor DarkYellow
  exit 1
}

# --- Cek backend hidup ---
Write-Step "Memeriksa koneksi ke backend..."
try {
  $null = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method GET -TimeoutSec 5 -ErrorAction Stop
  Write-OK "Backend merespons di $BaseUrl"
} catch {
  Write-Host "  [WARN] Backend belum merespons di $BaseUrl" -ForegroundColor DarkYellow
  Write-Host "    Pastikan: docker compose up -d (di folder be-WMS)" -ForegroundColor DarkYellow
  $confirm = Read-Host "  Lanjutkan tetap? (y/N)"
  if ($confirm -ne "y" -and $confirm -ne "Y") { exit 1 }
}

# --- Fungsi jalankan k6 ---
function Invoke-K6Test {
  param(
    [string]$ScriptPath,
    [string]$OutputFile,
    [string]$Label
  )

  Write-Step "Menjalankan: $Label"
  Write-Host "  Script : $ScriptPath" -ForegroundColor DarkGray
  Write-Host "  Output : $OutputFile" -ForegroundColor DarkGray
  Write-Host "  Mulai  : $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor DarkGray
  Write-Host ""

  $env:BASE_URL     = $BaseUrl
  $env:STAFF_USER   = $StaffUser
  $env:STAFF_PASS   = $StaffPass
  $env:MANAJER_USER = $ManajerUser
  $env:MANAJER_PASS = $ManajerPass

  $startTime = Get-Date
  $summaryFile = $OutputFile -replace "\.json$", "-summary.json"

  & k6 run --out "json=$OutputFile" --summary-export "$summaryFile" $ScriptPath

  $exitCode = $LASTEXITCODE
  $elapsed  = [math]::Round((Get-Date - $startTime).TotalSeconds, 1)

  if ($exitCode -eq 0) {
    Write-OK "$Label - SELESAI dalam ${elapsed}s (threshold terpenuhi)"
  } else {
    Write-Host "  [WARN] $Label - SELESAI dalam ${elapsed}s (ada threshold yang tidak terpenuhi)" -ForegroundColor DarkYellow
  }

  Write-Host "  Jeda 30 detik sebelum skenario berikutnya..." -ForegroundColor DarkGray
  Start-Sleep -Seconds 30
}

# --- Daftar skenario ---
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"

$scenarios = @(
  @{ Label="UC-01 Inbound | 50 RPS";   Script="scripts/uc01-inbound-50rps.js";   Output="$resultsDir/uc01-50rps-$timestamp.json";   UC="UC01" },
  @{ Label="UC-01 Inbound | 100 RPS";  Script="scripts/uc01-inbound-100rps.js";  Output="$resultsDir/uc01-100rps-$timestamp.json";  UC="UC01" },
  @{ Label="UC-01 Inbound | 200 RPS";  Script="scripts/uc01-inbound-200rps.js";  Output="$resultsDir/uc01-200rps-$timestamp.json";  UC="UC01" },
  @{ Label="UC-02 Stock Adj | 50 RPS"; Script="scripts/uc02-stock-50rps.js";     Output="$resultsDir/uc02-50rps-$timestamp.json";   UC="UC02" },
  @{ Label="UC-02 Stock Adj | 100 RPS";Script="scripts/uc02-stock-100rps.js";    Output="$resultsDir/uc02-100rps-$timestamp.json";  UC="UC02" },
  @{ Label="UC-02 Stock Adj | 200 RPS";Script="scripts/uc02-stock-200rps.js";    Output="$resultsDir/uc02-200rps-$timestamp.json";  UC="UC02" },
  @{ Label="UC-03 Outbound | 50 RPS";  Script="scripts/uc03-outbound-50rps.js";  Output="$resultsDir/uc03-50rps-$timestamp.json";   UC="UC03" },
  @{ Label="UC-03 Outbound | 100 RPS"; Script="scripts/uc03-outbound-100rps.js"; Output="$resultsDir/uc03-100rps-$timestamp.json";  UC="UC03" },
  @{ Label="UC-03 Outbound | 200 RPS"; Script="scripts/uc03-outbound-200rps.js"; Output="$resultsDir/uc03-200rps-$timestamp.json";  UC="UC03" }
)

# --- Filter berdasarkan -Only ---
if ($Only -ne "ALL") {
  $scenarios = $scenarios | Where-Object { $_.UC -eq $Only }
  if ($scenarios.Count -eq 0) {
    Write-Fail "Tidak ada skenario yang cocok dengan: $Only"
    Write-Host "  Gunakan: -Only UC01  atau  -Only UC02  atau  -Only UC03  atau  -Only ALL"
    exit 1
  }
}

Write-Host ""
Write-Host "  Total skenario : $($scenarios.Count)" -ForegroundColor White
Write-Host "  Estimasi waktu : ~$([math]::Round($scenarios.Count * 3.5, 0)) menit" -ForegroundColor White

$confirmRun = Read-Host "`n  Mulai sekarang? (y/N)"
if ($confirmRun -ne "y" -and $confirmRun -ne "Y") {
  Write-Host "  Dibatalkan." -ForegroundColor DarkGray
  exit 0
}

# --- Jalankan semua skenario ---
$totalStart = Get-Date

foreach ($s in $scenarios) {
  Invoke-K6Test -ScriptPath $s.Script -OutputFile $s.Output -Label $s.Label
}

# --- Ringkasan akhir ---
$totalElapsed = [math]::Round((Get-Date - $totalStart).TotalMinutes, 1)

Write-Header "SEMUA SKENARIO SELESAI - Waktu total: ${totalElapsed} menit"
Write-Host ""
Write-Host "  Hasil tersimpan di: .\$resultsDir\" -ForegroundColor Cyan
Write-Host ""
Write-Host "  FILE HASIL (JSON):" -ForegroundColor White

$jsonPattern = "$resultsDir\*$timestamp*.json"
Get-ChildItem $jsonPattern -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*summary*" } | ForEach-Object {
  $kb = [math]::Round($_.Length / 1KB, 1)
  Write-Host "    $($_.Name)  ($kb KB)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  FILE SUMMARY (untuk ekstrak metrik Bab IV):" -ForegroundColor White

$summaryPattern = "$resultsDir\*$timestamp*-summary.json"
Get-ChildItem $summaryPattern -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Host "    $($_.Name)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  LANGKAH BERIKUTNYA:" -ForegroundColor Yellow
Write-Host "    1. Buka file *-summary.json - ambil nilai avg dan p(95)" -ForegroundColor White
Write-Host "    2. Catat CPU/Memory dari Docker stats saat tes berlangsung" -ForegroundColor White
Write-Host "    3. Isi tabel data di Bab IV" -ForegroundColor White
Write-Host ""
