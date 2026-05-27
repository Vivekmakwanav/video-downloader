# Runner script for local development
Write-Host "Launching Nexus Video Downloader local environment..." -ForegroundColor Cyan

# Start Backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; ..\venv\Scripts\activate; uvicorn main:app --reload --port 8001"
Write-Host "✓ Backend server starting on http://localhost:8001" -ForegroundColor Green

# Start Frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Write-Host "✓ Frontend development server starting..." -ForegroundColor Green

Write-Host "Both servers have been launched in separate terminal windows!" -ForegroundColor Yellow
