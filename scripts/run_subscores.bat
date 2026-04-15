@echo off
echo Berechne WohnWert-Subscores...
cd /d "%~dp0"
python calculate_wohnwert_subscores.py
echo.
echo Fertig! WohnWert-Gewichtung ist jetzt aktiv.
pause
