path = "e:/AGRI-DASH/frontend/public/Final_Model_Ready_Dataset.csv"
with open(path, 'r') as f:
    headers = f.readline().strip().split(',')
    first_row = f.readline().strip().split(',')
    
print(f"Header Count: {len(headers)}")
print(f"First Row Count: {len(first_row)}")
print("--- HEAD ---")
print(headers)
print("--- FIRST ROW ---")
print(first_row)

# Verify alignment
hardcoded = [
    'State', 'District', 'Crop_Year', 'Season', 'Crop', 
    'Area', 'Production', 'Yield', 
    'Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed'
]

print(f"Hardcoded Count: {len(hardcoded)}")
for i, val in enumerate(first_row):
    if i < len(hardcoded):
        print(f"{i}: {hardcoded[i]} = {val}")
    else:
        print(f"{i}: [Unknown] = {val}")
