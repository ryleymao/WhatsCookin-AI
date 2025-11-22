# WhatsCookin-AI

## RUNNING THE BACKEND
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
psql postgres -c "CREATE DATABASE whatscookin;"