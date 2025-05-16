from google_play_scraper import Sort, reviews

# App package name from the URL
app_id = "com.reelies.hermes"

# Get reviews
result, continuation_token = reviews(
    app_id,
    lang='en',  # Language of reviews to be retrieved
    country='IN',  # Country to focus on
    sort=Sort.MOST_RELEVANT,  # Sort order (MOST_RELEVANT or NEWEST)
    count=100,  # Number of reviews to retrieve
)

# Print reviews
for review in result:
    print(f"Score: {review['score']}")
    print(f"Content: {review['content']}")
    print(f"Date: {review['at']}")
    print("-" * 50)

# If you want to get more reviews, you can use the continuation token
# result, _ = reviews(
#     app_id,
#     continuation_token=continuation_token  # Pass the previous continuation token
# ) 