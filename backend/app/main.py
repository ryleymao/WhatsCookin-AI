from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from database import engine, get_db
from schemas import UserCreate, UserResponse, UserLogin, Token, RecipeResponse, IngredientsResponse, RecipeRecommendationRequest, RecipeRecommendationsResponse
from models import User, Recipes
import openai_service
from auth import hash_password, verify_password, create_access_token, verify_token
from models import Base
import uvicorn

# Create all tables
Base.metadata.create_all(bind=engine)

# Create instance
app = FastAPI()

# Define a path opperation for the root URL that responds to get requests 
@app.get("/")
def root():
    return {"message": "Whats Cookin AI"}

# Endpoint to register
@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if the email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    hashed_pw = hash_password(user.password)

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
    
# Endpoint to login
@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)): # Receives email and password
    db_user = db.query(User).filter(User.email == user.email).first() # Finds user by email in database
    if not db_user or not verify_password(user.password, db_user.password): # If user not found OR password doesn't match -> Reject
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(db_user.id)}) # Create token with user's ID inside and return it to the user
    return {"token": token}

# Read the Authorization: Bearer <token> header and extracts/verifies the token and returns loggedin user
def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.replace("Bearer ", "")
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Delete recipes
@app.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipes(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_recipe = db.query(Recipes).filter(Recipes.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if db_recipe.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(db_recipe)
    db.commit()

# API to Read all recipes for user
@app.get("/recipes")
def get_recipes(
    page: int = 1, # Query parameter, defaults to page 1
    limit: int = 10, # How many items per page, defaults to 10
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    # Count total recipes for this user
    total = db.query(Recipes).filter(Recipes.user_id == user.id).count()

    # Calculate how many to skip
    skip = (page - 1) * limit # Page 1 skips 0, page 2 skips 10 etc
    
    # Get only the recipes for this page
    recipes = db.query(Recipes).filter(Recipes.user_id == user.id).offset(skip).limit(limit).all() # offset(skip)... SQL magic, skip rows, take y rows

    return {
        "data": recipes,
        "page": page,
        "limit": limit,
        "total": total # Total count so front end knows how many pages exist
    }

# API to analyze image and detect ingredients
@app.post("/analyze-ingredients", response_model=IngredientsResponse)
async def analyze_ingredients( # this function can pause and resume
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """
    Receives an image file, sends to OpenAI Vision, returns detected ingredients.

    Flow:
    1. Mobile app uploads image
    2. We read the image bytes
    3. Send to OpenAI service
    4. Return list of ingredients to user
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

    # Read the uploaded image file into bytes
    image_bytes = await file.read() # await to read file server work on other requests (pause here let other users request run, resume when ready)

    # Check if file is empty
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Call our OpenAI service to analyze the image
    try:
        ingredients = openai_service.analyze_ingredients_from_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")

    # Check if any ingredients were detected
    if not ingredients or len(ingredients) == 0:
        raise HTTPException(status_code=400, detail="No ingredients detected in image. Please try a clearer photo.")

    # Return the ingredients list
    return {"ingredients": ingredients}

# Endpoint to get recipe recommendations
@app.post("/get-recipes", response_model=RecipeRecommendationsResponse)
def get_recipe_recommendations_endpoint(
    request: RecipeRecommendationRequest,
    user: User = Depends(get_current_user)
):
    # Validate ingredients list
    if not request.ingredients or len(request.ingredients) == 0:
        raise HTTPException(status_code=400, detail="Ingredients list cannot be empty")

    # Call OpenAI service to get recipe recommendations
    try:
        recommendations = openai_service.get_recipe_recommendations(request.ingredients)
    except Exception as e:
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")

    # Check if any recommendations were returned
    if not recommendations or len(recommendations) == 0:
        raise HTTPException(status_code=400, detail="No recipes found for these ingredients. Try different ingredients.")

    return {"recommendations": recommendations}

# Starts server make it accessable on http
if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)