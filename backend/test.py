import requests


api_key = "5aea50bf71c7108281cedbaba33ab152"
city = "Mumbai"

url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"

print(f"Testing URL: {url}")
response = requests.get(url)

print("\n--- RESULTS ---")
print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.json()}")