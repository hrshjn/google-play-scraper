from google_play_scraper import app
from pprint import pprint

# App package name from the URL
APP_ID = "com.reelies.hermes"

print("Trying with US region:")
app_info_us = app(
    APP_ID,
    lang='en',
    country='us'  # Changed to US
)
pprint(app_info_us)

print("\nTrying with India region:")
app_info_in = app(
    APP_ID,
    lang='en',
    country='in'
)
pprint(app_info_in) 