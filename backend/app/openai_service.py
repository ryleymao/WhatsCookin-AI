import os
import base64
from openai import OpenAI
from dotenv import load_dotenv
import json

# Load environment variables from the .env file
load_dotenv()

# Create OpenAI client using API key from .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_ingredients_from_image(image_bytes: bytes) -> list[str]:
    """
    Takes an image and returns list of ingredients detected.

    Args:
    image_bytes: Raw image data (from the uploaded file)

    Returns: 
    List of ingredient names like {"chicken", "soysauce", "onion"]
    """
    # Step 1) Convert image bytes to base64 string
    # OpenAI API need base64 wont accept raw image bytes (binary -> text)
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    # Step 2) Call OpenAI Vision API
    response = client.chat.completions.create(
        model="gpt-4o-mini", 
        messages = [ # send image and instructions
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this image and list all the food ingredients you can identify. Return ONLY a JSON array of the ingredient names, nothing else. Example: [\"chicken thighs\", \"onions\", \"garlic\"]"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=300 # Limits response length 
    )

    # Step 3) Extract AI response
    content = response.choices[0].message.content.strip()

    # Step 4) Parse JSON response
    # LLM returns ["chicken", "onions"]
    try:
        ingredients = json.loads(content)
        return ingredients
    except json.JSONDecodeError:
        # Backup: If AI didn't return pure JSON, try to isolate the JSON in the text
        import re
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group())
        return [] # If all else fails, return empty list
    
def get_recipe_recommendations(ingredients: list[str]) -> list[dict]:
    """
    Gets recipe recommendations based on ingredients.
    
    Args: 
        ingredients: List of ingredient names like ["chicken", "onions"]
        
    Returns:
        List of dicts with 'name' and 'link' keys
        Example: [{"name": "Chicken Alfredo", "link": "https://...}]
    """

    # Join ingredients into a comma-separated string 
    ingredients_str = ", ".join(ingredients)

    # Call OpenAI to get recipe recommendations
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": f"""Given these ingredients: {ingredients_str}

Suggest 5 recipe ideas that can be made with these ingredients. For each recipe, provide:
1. A descriptive recipe name
2. A link to a highly-rated recipe from popular cooking websites (AllRecipes, BonAppetit, SeriousEats, NYTimes Cooking, Food Network, etc.)

Return ONLY a JSON array in this exact format, nothing else:
[
  {{"name": "Recipe Name", "link": "https://..."}},
  {{"name": "Recipe Name", "link": "https://..."}}
]"""
            }
        ],
        max_tokens=800  # More tokens since we need 5 recipes with links
    )

    content = response.choices[0].message.content.strip()

    # Parse the JSON response
    try:
        recommendations = json.loads(content)
        return recommendations
    except json.JSONDecodeError:
        # Backup: extract JSON from text
        import re
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group())
        return []
    