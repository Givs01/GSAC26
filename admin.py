import json
import requests
from pathlib import Path

# Load config
config_path = Path("config.json")
with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

url = config["gas_url"]
timeout = config.get("timeout", 10)
output_file = config.get("output_file", "data.json")

# Fetch data
response = requests.get(url, timeout=timeout)
response.raise_for_status()
data = response.json()

# Save JSON
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Saved JSON to {output_file}")
