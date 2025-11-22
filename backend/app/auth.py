from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv

load_dotenv()

# JWT Tokens (JSON Web Token) when you log in server gives you this pass and every time you make request you show this
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production") # Secret password only the server knows used to sign tokens no one can fake
ALGORITHM = "HS256" # The encription method used to sign the tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Tokens expires after 30 min for security

# Takes user data adds expiration time and encodes it into a token string
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Takes plain password and returns a hashed version
def hash_password(password: str) -> str:
    """Hash a plain password"""
    return pwd_context.hash(password)

# Checks if the plain password matches the hash (for login later)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

# Takes the tokens from the request and decodes it using 
# our secret key, returns the user_id or None if invalid
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except: 
        return None
    
    