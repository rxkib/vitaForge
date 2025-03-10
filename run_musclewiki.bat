@echo off
cd backend
call env\Scripts\activate.bat
cd ..\musclewiki\musclewiki
python api.py
