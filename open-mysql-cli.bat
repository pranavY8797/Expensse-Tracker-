@echo off
title SafeSpend AI - MySQL 8.0 Console
echo =======================================================================
echo   Connecting to SafeSpend AI Database: [safespend_vault]
echo   MySQL Server 8.0 on localhost:3306 (User: root)
echo =======================================================================
echo.
echo Quick commands:
echo   SHOW TABLES;
echo   SELECT * FROM transactions ORDER BY id DESC LIMIT 10;
echo   SELECT * FROM budgets;
echo   SELECT * FROM recurring_subscriptions;
echo.
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot safespend_vault
pause
