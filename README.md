# WhatsCookin Backend API

## Prerequisites

- Python 3.8+
- PostgreSQL 12+

## Complete Setup Guide

### Step 1: Install PostgreSQL

#### On Mac:
```bash
# Install using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify it's running
psql postgres -c "SELECT version();"
```

#### On Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer (use default settings, remember your password)
3. PostgreSQL runs automatically after install
4. Add PostgreSQL to PATH (usually `C:\Program Files\PostgreSQL\15\bin`)

### Step 2: Create Database

#### On Mac:
```bash
psql postgres -c "CREATE DATABASE whatscookin;"
```

#### On Windows (using PowerShell or Command Prompt):
```bash
psql -U postgres -c "CREATE DATABASE whatscookin;"
# Enter the password you set during installation
```

### Step 3: Clone & Navigate to Project

```bash
cd WhatsCookin-AI/backend
```

### Step 4: Set Up Virtual Environment

#### On Mac:
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# You should see (venv) in your terminal now
```

#### On Windows (PowerShell):
```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\Activate.ps1

# If you get an error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# You should see (venv) in your terminal now
```

#### On Windows (Command Prompt):
```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate.bat

# You should see (venv) in your terminal now
```

### Step 5: Install Dependencies

**Make sure your virtual environment is activated (you see `(venv)` in terminal)!**

```bash
pip install -r requirements.txt
```

### Step 6: Configure Environment Variables

#### On Mac:
```bash
# Copy example file
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
code .env  # if you have VS Code
```

#### On Windows:
```bash
# Copy example file
copy .env.example .env

# Edit with Notepad
notepad .env
```

**Edit `.env` and set these values:**

```env
# Mac users (no password usually):
DATABASE_URL=postgresql://yourusername@localhost/whatscookin

# Windows users (with password from PostgreSQL install):
DATABASE_URL=postgresql://postgres:yourpassword@localhost/whatscookin

# Generate SECRET_KEY:
SECRET_KEY=paste-generated-key-here

# Your OpenAI API key:
OPENAI_API_KEY=sk-proj-your-key-here
```

**Generate SECRET_KEY:**

Mac/Linux:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Windows:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it as `SECRET_KEY` in `.env`

### Step 7: Run the Server

**Make sure you're in the `backend/app` directory and virtual environment is active!**

#### On Mac:
```bash
cd app
uvicorn main:app --reload
```

#### On Windows:
```bash
cd app
uvicorn main:app --reload
```

**You should see:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### "database 'whatscookin' does not exist"
```bash
# Create the database:
psql postgres -c "CREATE DATABASE whatscookin;"
# or on Windows:
psql -U postgres -c "CREATE DATABASE whatscookin;"
```

## Database Notes

**Data Persistence:**
- PostgreSQL stores data on disk (NOT in memory)
- Restarting your server does NOT delete data
- Data persists until you manually drop the database
- PostgreSQL runs as a separate service from your FastAPI app

**To reset database (delete all data):**
```bash
# Stop your FastAPI server (Ctrl+C)
psql postgres -c "DROP DATABASE whatscookin;"
psql postgres -c "CREATE DATABASE whatscookin;"
# Start server again - fresh database
```

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login and get JWT token

### Recipe Management
- `GET /recipes` - Get user's saved recipes (paginated)
- `DELETE /recipes/{recipe_id}` - Delete a recipe

### AI Features
- `POST /analyze-ingredients` - Upload food image, get detected ingredients
- `POST /get-recipes` - Send ingredients, get recipe recommendations with links

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## Authentication

Protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Environment Variables

| Variable | Description 
|----------|-------------
| `DATABASE_URL` | PostgreSQL connection string 
| `SECRET_KEY` | JWT token signing key 
| `OPENAI_API_KEY` | OpenAI API key 

## Technology Stack

- **FastAPI** - Python
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **OpenAI GPT-4o-mini** - Vision & text AI
- **JWT** - Authentication
- **Bcrypt** - Password hashing
