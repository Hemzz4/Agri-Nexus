import pandas as pd
import os

def generate_farmer_queries(output_path):
    data = [
        {"query": "My wheat crop is showing yellow spots on the leaves.", "category": "Disease", "action": "Apply fungicide"},
        {"query": "The soil seems very dry even after watering, what fertilizer to use?", "category": "Soil", "action": "Increase organic matter and use NPK"},
        {"query": "I see small green insects on my tomato plants.", "category": "Pest", "action": "Apply neem oil or insecticide"},
        {"query": "What is the best time to sow rice in Tamil Nadu?", "category": "General", "action": "June to July"},
        {"query": "Leaves are curling downwards and turning brown.", "category": "Disease", "action": "Check for viral infection or water stress"},
        {"query": "White powdery substance on the stems of my grapes.", "category": "Disease", "action": "Apply sulfur-based fungicide"},
        {"query": "Caterpillars are eating all the cabbage leaves!", "category": "Pest", "action": "Use biological control or appropriate pesticide"},
        {"query": "Is black soil good for growing cotton?", "category": "Soil", "action": "Yes, it has high moisture retention"},
        {"query": "How much urea should I add to a 1 acre plot?", "category": "Fertilizer", "action": "Depends on crop, usually 50-100kg"},
        {"query": "Locust swarm spotted near my farm, what to do?", "category": "Pest", "action": "Notify local authorities immediately"},
        {"query": "Brown patches on my lawn grass, spreading quickly.", "category": "Disease", "action": "Likely brown patch fungus, reduce watering"},
        {"query": "My soil pH is 5.5, what should I grow?", "category": "Soil", "action": "Grow acid-tolerant crops like potatoes or add lime"},
        {"query": "Aphids are destroying my roses.", "category": "Pest", "action": "Spray soapy water or neem oil"},
        {"query": "Roots of my carrots are rotting underground.", "category": "Disease", "action": "Improve drainage, likely root rot fungus"},
        {"query": "When will the monsoon start in Coimbatore?", "category": "Weather", "action": "Check local meteorological department"}
    ] * 10 # duplicate to create a larger dummy dataset
    
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"Created {output_path} with {len(df)} rows.")

def generate_agri_news(output_path):
    data = [
        {"text": "Government announces new subsidies for solar water pumps.", "sentiment": "Positive", "topic": "Subsidies"},
        {"text": "Severe drought expected in southern districts this summer.", "sentiment": "Negative", "topic": "Weather"},
        {"text": "Market price for onions crashes due to oversupply.", "sentiment": "Negative", "topic": "Market"},
        {"text": "New pest-resistant cotton variety released by researchers.", "sentiment": "Positive", "topic": "Research"},
        {"text": "Heavy unexpected rainfall damages standing paddy crops.", "sentiment": "Negative", "topic": "Weather"},
        {"text": "Export demand for Indian mangoes rises significantly.", "sentiment": "Positive", "topic": "Market"},
        {"text": "Farmers protest demanding higher minimum support price.", "sentiment": "Neutral", "topic": "Politics"},
        {"text": "Locust invasion threatens crops in bordering states.", "sentiment": "Negative", "topic": "Pest"},
        {"text": "Monsoon arrives on time, favorable for Kharif sowing.", "sentiment": "Positive", "topic": "Weather"},
        {"text": "Fertilizer shortage reported in several northern districts.", "sentiment": "Negative", "topic": "Supply"},
        {"text": "New organic farming techniques yield better results.", "sentiment": "Positive", "topic": "Farming"},
        {"text": "Crop insurance payouts delayed for last season's damage.", "sentiment": "Negative", "topic": "Insurance"},
        {"text": "Tomato prices hit record high due to low yield.", "sentiment": "Positive", "topic": "Market"}, # Positive for seller, negative for buyer, but let's say positive for farmer
        {"text": "Agricultural university to host seminar on modern tech.", "sentiment": "Neutral", "topic": "Education"},
        {"text": "Groundwater levels deplete further in central regions.", "sentiment": "Negative", "topic": "Environment"}
    ] * 10 # duplicate to create a larger dummy dataset
    
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"Created {output_path} with {len(df)} rows.")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    generate_farmer_queries(os.path.join(base_dir, "farmer_queries.csv"))
    generate_agri_news(os.path.join(base_dir, "agri_news.csv"))
