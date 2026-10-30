@echo off
title Zapato Kiosco — Siempre Encendido ✅
cd /d "%~dp0"
pm2 resurrect
echo.
echo ✅ Tienda encendida y protegida
echo --------------------------------
echo No cierres esta ventana si queres ver el estado
echo.
pm2 logs zapato-kiosco --lines 5
pause