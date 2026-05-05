@echo off
echo =======================================================
echo Removendo o servico de inicializacao do TO DO IA...
echo =======================================================

if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\iniciar_todo_ia.vbs" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\iniciar_todo_ia.vbs" /F /Q
    echo.
    echo Servico removido com sucesso. O sistema nao iniciara mais no login.
) else (
    echo.
    echo O servico nao estava instalado.
)

echo.
pause
