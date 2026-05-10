# Script pemantauan resource Docker saat load test berlangsung
# Simpan output ke file untuk dicatat ke tabel Bab IV
#
# Cara pakai:
#   Jalankan di terminal TERPISAH saat run-tests.ps1 berjalan:
#   .\monitor-resources.ps1

$outputFile = "results\resource-monitor-$(Get-Date -Format 'yyyyMMdd-HHmm').csv"

Write-Host "Memulai pemantauan resource Docker..." -ForegroundColor Cyan
Write-Host "Output: $outputFile" -ForegroundColor DarkGray
Write-Host "Tekan Ctrl+C untuk berhenti`n" -ForegroundColor DarkYellow

# Header CSV
"Timestamp,Container,CPU%,MemUsage,MemLimit,MemPct,NetIO,BlockIO" | Out-File $outputFile

while ($true) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

  # docker stats sekali (tanpa --stream)
  $stats = docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemLimit}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}}" 2>&1

  foreach ($line in $stats) {
    if ($line -match "^wms-") {
      "$timestamp,$line" | Out-File $outputFile -Append
      Write-Host "[$timestamp] $line" -ForegroundColor Green
    }
  }

  Start-Sleep -Seconds 10
}
