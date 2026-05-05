@echo off
echo =======================================================
echo Parando o sistema TO DO IA (processos Node.js)...
echo =======================================================

taskkill /F /IM node.exe

echo.
echo Processos encerrados. O backend e o frontend vinculados ao Node foram finalizados.
echo.
pause
