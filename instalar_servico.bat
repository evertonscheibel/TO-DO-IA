@echo off
echo =======================================================
echo Instalando o servico de inicializacao do TO DO IA...
echo =======================================================

copy "iniciar_oculto.vbs" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\iniciar_todo_ia.vbs" /Y

echo.
echo Instalacao concluida com sucesso!
echo O sistema iniciara automaticamente oculto no proximo login.
echo.
pause
