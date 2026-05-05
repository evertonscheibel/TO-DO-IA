Set WshShell = CreateObject("WScript.Shell")

' Inicia o Backend oculto (janela invisivel)
WshShell.Run "cmd /c cd /d ""c:\Projetos\TO DO IA\backend"" && npm start > ""c:\Projetos\TO DO IA\backend\backend.log"" 2>&1", 0, False

' Inicia o Frontend oculto (janela invisivel)
WshShell.Run "cmd /c cd /d ""c:\Projetos\TO DO IA\frontend"" && serve -s dist -l 7153 > ""c:\Projetos\TO DO IA\frontend\frontend.log"" 2>&1", 0, False

