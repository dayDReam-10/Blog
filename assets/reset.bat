@echo off
chcp 65001 >nul
echo 正在同步笔记数据...
powershell -ExecutionPolicy Bypass -File "%~dp0build_notes.ps1"
echo 同步完成！
pause