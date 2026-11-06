"""
Synthetic Farmer Query Dataset Generator.
Part of AgriNexus / Agri-Insight Framework.

METHODOLOGICAL & SCIENTIFIC LIMITATIONS NOTICE:
----------------------------------------------
This script generates synthetic farmer queries across 7 operational categories
using 21 sentence templates slotted with 9 crop names.
Because 5,000 samples are generated from only 189 unique combinations:
1. ~96.2% of rows are repeated duplicate queries.
2. Random train/test splits lead to high data leakage, causing inflated evaluation scores.
3. Real-world farmer queries feature varied syntax, dialectal phrasing, and spelling errors not present here.
Use this dataset for functional integration testing only.
"""

import pandas as pd
import random
from pathlib import Path

# Generate a synthetic dataset for crop disease advisory
templates = [
    ("My {crop} leaves are turning yellow and have brown spots.", "Disease"),
    ("I see white powdery mildew on the stem of my {crop}.", "Disease"),
    ("There is a fungal infection spreading on my {crop}.", "Disease"),
    ("The {crop} plants are wilting and the roots look rotten.", "Disease"),
    
    ("My {crop} is being eaten by small green insects.", "Pest"),
    ("There are aphids all over my {crop} leaves.", "Pest"),
    ("Caterpillars are destroying the {crop} harvest.", "Pest"),
    ("How do I get rid of whiteflies on my {crop}?", "Pest"),
    
    ("The soil for my {crop} seems very dry and cracked.", "Water"),
    ("How often should I water my {crop} during the summer?", "Water"),
    ("My {crop} is suffering from severe drought.", "Water"),
    ("The irrigation pump is broken and my {crop} needs water.", "Water"),
    
    ("What fertilizer should I use for {crop} to increase yield?", "Nutrient"),
    ("The {crop} growth is stunted, I think it lacks nitrogen.", "Nutrient"),
    ("My {crop} needs a potassium boost, what do you recommend?", "Nutrient"),
    
    ("My tractor broke down while ploughing the {crop} field.", "Equipment"),
    ("The harvester is jammed, what should I do?", "Equipment"),
    
    ("What is the current market price for {crop}?", "Market"),
    ("Where can I sell my {crop} for the best profit?", "Market"),
    
    ("Will it rain tomorrow? I need to harvest my {crop}.", "Weather"),
    ("Is there a storm coming? I am worried about my {crop}.", "Weather")
]

crops = ["tomato", "wheat", "cotton", "rice", "corn", "potato", "soybean", "onion", "tea"]

data = []
for _ in range(5000):  # Generate 5000 rows
    template, category = random.choice(templates)
    crop = random.choice(crops)
    query = template.format(crop=crop)
    data.append({"query": query, "category": category})

df = pd.DataFrame(data)
out_path = Path(__file__).resolve().parent / "farmer_queries.csv"
df.to_csv(out_path, index=False)
print("English dataset generated successfully at", out_path)
