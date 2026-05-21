@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% show --stat HEAD
echo ---
%GIT% log --oneline -5
