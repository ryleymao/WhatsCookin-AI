from pydantic import BaseModel, EmailStr
from typing import List

# Backend uses to validate traffic 
# Create user schema
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

# Login schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token schema
class Token(BaseModel):
    token: str

# Recipe schemas
class RecipeCreate(BaseModel):
    name: str
    ingredients: list[str]

class RecipeResponse(BaseModel):
    id: int
    name: str
    ingredients: list[str]
    user_id: int

    class Config:
        from_attributes = True

# Ingredient detection response
class IngredientsResponse(BaseModel):
    ingredients: list[str]

# Recipe recommendation request
class RecipeRecommendationRequest(BaseModel):
    ingredients: list[str]

# Individual recipe recommendation
class RecipeRecommendation(BaseModel):
    name: str
    link: str

# Recipe recommendations response
class RecipeRecommendationsResponse(BaseModel):
    recommendations: list[RecipeRecommendation] 