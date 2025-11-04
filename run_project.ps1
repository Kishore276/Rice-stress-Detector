# =====================================================
# Rice Stress Detector - Project Launcher (PowerShell)
# =====================================================

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Rice Stress Detector - Starting Application" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# Check if venv exists
if (-Not (Test-Path "venv")) {
    Write-Host "[*] Virtual environment not found. Creating venv..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "[+] Virtual environment created" -ForegroundColor Green
    Write-Host ""
}

# Activate virtual environment
Write-Host "[*] Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install/update dependencies
Write-Host "[*] Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt -q
Write-Host "[+] Dependencies installed" -ForegroundColor Green

# Check if database is initialized
if (-Not (Test-Path "rice_disease.db")) {
    Write-Host "[*] Initializing database..." -ForegroundColor Yellow
    python init_db.py
    Write-Host "[+] Database initialized" -ForegroundColor Green
    Write-Host ""
}

# Start Flask application
Write-Host "[+] Starting Flask application..." -ForegroundColor Green
Write-Host "[+] Server will be available at: http://localhost:5000/login" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

python app_auth.py
