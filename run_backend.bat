@echo off
cd backend
call env\Scripts\activate.bat
python manage.py runserver
