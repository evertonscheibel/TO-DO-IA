@echo off
echo =======================================================
echo Iniciando o sistema TO DO IA...
echo =======================================================

echo Iniciando o Backend...
start "Backend - TO DO IA" cmd /c "cd /d "%~dp0backend" && npm start"

echo.
echo Aguardando 3 segundos para iniciar o Frontend...
timeout /t 3 /nobreak > nul

echo.
echo Iniciando o Frontend...
start "Frontend - TO DO IA" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =======================================================
echo Sistema iniciado com sucesso!
echo Duas novas janelas foram abertas para o Backend e Frontend.
echo =======================================================
echo.
pause
