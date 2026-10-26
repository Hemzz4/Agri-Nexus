import pandas as pd
import random

# Diverse, realistic agricultural news sentiment dataset generator
templates = [
    # Positive News
    ("Monsoon rains boost {crop} crop yields across the country.", "Positive"),
    ("Government announces new subsidies for {crop} farmers this year.", "Positive"),
    ("Government increases fertilizer subsidies by 15% to stabilize input costs for farmers.", "Positive"),
    ("Record {crop} procurement and surplus monsoon drive strong agricultural commodity optimism.", "Positive"),
    ("New organic fertilizers show a 20% increase in {crop} production.", "Positive"),
    ("Export demand for {crop} reaches an all-time high in global markets.", "Positive"),
    ("Innovative farming tech helps reduce water usage for {crop} by half.", "Positive"),
    ("Farmers celebrate record-breaking {crop} harvest this season.", "Positive"),
    ("Market prices for {crop} surge, bringing relief to local farmers.", "Positive"),
    ("High yields and bumper harvest bring record profits to {crop} growers.", "Positive"),
    ("Government increases MSP and financial incentives for {crop} cultivators.", "Positive"),
    ("Favorable weather and timely rainfall boost {crop} sowing prospects.", "Positive"),
    ("New high-yielding pest-resistant {crop} seed variety approved by agricultural university.", "Positive"),
    ("Prices of {crop} rebound strongly as domestic and export demand expands.", "Positive"),
    ("Farmers receive swift crop insurance payouts and relief compensation.", "Positive"),
    ("Subsidized solar pump scheme drives double-cropping in {crop} fields.", "Positive"),
    ("Good weather and healthy soil conditions lead to prosperous {crop} yield.", "Positive"),
    ("Record breaking profit margins recorded for {crop} producers this quarter.", "Positive"),

    # Negative News
    ("Severe drought destroys thousands of acres of {crop} crops.", "Negative"),
    ("Locust swarm outbreak threatens the entire {crop} harvest.", "Negative"),
    ("Unseasonal heavy rain and hail devastate standing {crop} harvest in southern districts.", "Negative"),
    ("Prices of {crop} crash due to oversupply and market glut.", "Negative"),
    ("Fungus infection causes massive losses in {crop} farms.", "Negative"),
    ("Unexpected hail storm ruins {crop} yields right before harvest.", "Negative"),
    ("Farmers protest over low minimum support price for {crop}.", "Negative"),
    ("Supply chain disruptions cause {crop} to rot in warehouses.", "Negative"),
    ("Severe pest infestation damages large tracts of {crop} fields.", "Negative"),
    ("Acute water shortage and drying reservoirs threaten {crop} irrigation.", "Negative"),
    ("Rising fuel and pesticide costs squeeze smallholder {crop} farmer incomes.", "Negative"),
    ("Blight disease spreads rapidly across {crop} plantations.", "Negative"),
    ("Distress sales reported as {crop} farmers struggle to find buyers.", "Negative"),
    ("Unprecedented heatwave scorches developing {crop} blossoms.", "Negative"),
    ("Floodwaters submerge thousands of hectares of {crop} acreage.", "Negative"),

    # Neutral News
    ("Agricultural board to review the current minimum support price for {crop}.", "Neutral"),
    ("Experts debate the long-term effects of climate change on {crop} farming.", "Neutral"),
    ("A new report published on the standard practices of {crop} cultivation.", "Neutral"),
    ("Farmers attend a seminar on modern {crop} harvesting techniques.", "Neutral"),
    ("The agriculture ministry will release the {crop} production data next week.", "Neutral"),
    ("Scientists are studying the genetic traits of a new {crop} variety.", "Neutral"),
    ("District administration organizes annual exhibition showcasing {crop} farm implements.", "Neutral"),
    ("Routine inspection of {crop} grain godowns scheduled for next month.", "Neutral"),
    ("State agriculture department conducts soil testing camps for {crop} growers.", "Neutral"),
    ("Symposium on sustainable {crop} cultivation practices concludes in the capital.", "Neutral"),
    ("Survey underway to assess total acreage under {crop} cultivation this fiscal year.", "Neutral")
]

crops = [
    "wheat", "rice", "paddy", "cotton", "sugarcane", "soybean",
    "maize", "tomato", "potato", "onion", "chilli", "groundnut", "turmeric"
]

data = []
for _ in range(6000):
    template, sentiment = random.choice(templates)
    crop = random.choice(crops)
    headline = template.format(crop=crop)
    data.append({"headline": headline, "sentiment": sentiment})

df = pd.DataFrame(data)
df.to_csv("backend/data/agri_news.csv", index=False)
print("Agricultural News dataset generated successfully with", len(df), "records!")
