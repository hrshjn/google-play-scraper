import csv
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from google_play_scraper import Sort, reviews, app

def extract_app_id_from_url(url):
    """Extract the app ID from a Google Play Store URL."""
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    return query_params.get('id', [None])[0]

def scrape_app_reviews(app_id, lang='en', country='in', max_reviews=None):
    """
    Scrape reviews for a given app and save them to a CSV file.
    
    Args:
        app_id (str): The app's package name
        lang (str): Language of reviews to retrieve
        country (str): Country to focus on (use lowercase, e.g., 'us', 'in')
        max_reviews (int, optional): Maximum number of reviews to scrape. If None, scrape all reviews.
    """
    # First get app info
    app_info = app(app_id, country=country)
    total_ratings = app_info['ratings']  # Total number of ratings (with or without review)
    visible_reviews = app_info['reviews']  # Number of visible reviews
    rating_histogram = app_info['histogram']  # Distribution of ratings [1-star, 2-star, 3-star, 4-star, 5-star]
    average_score = app_info['score']  # Average rating score
    installs = app_info['installs']  # Number of installs
    
    print(f"\nApp: {app_info['title']}")
    print(f"App Statistics:")
    print(f"- Installs: {installs}")
    print(f"- Total ratings: {total_ratings:,}")
    print(f"- Visible reviews: {visible_reviews:,}")
    print(f"- Average score: {average_score:.2f} / 5.00")
    print(f"- Rating distribution:")
    for stars, count in enumerate(rating_histogram, 1):
        print(f"  {stars} stars: {count:,}")
    
    if max_reviews:
        print(f"\nStarting review scrape (limited to {max_reviews:,} reviews)...")
    else:
        print("\nStarting review scrape...")
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"reviews_{app_id}_{timestamp}.csv"
    
    # Write reviews to CSV
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'reviewId',
            'userName',
            'score',
            'content',
            'thumbsUpCount',
            'reviewCreatedVersion',
            'at',
            'replyContent',
            'repliedAt'
        ])
        
        writer.writeheader()
        
        # Initialize variables for pagination
        continuation_token = None
        reviews_scraped = 0
        batch_size = 100  # Max allowed by the API
        
        while True:
            # Check if we've reached the maximum reviews limit
            if max_reviews and reviews_scraped >= max_reviews:
                break
            
            # Adjust batch size for last request if we have a limit
            if max_reviews:
                remaining = max_reviews - reviews_scraped
                batch_size = min(100, remaining)
            
            # Get batch of reviews
            result, continuation_token = reviews(
                app_id,
                lang=lang,
                country=country,
                sort=Sort.NEWEST,  # Get newest first to ensure we don't miss any
                count=batch_size,
                continuation_token=continuation_token
            )
            
            # If no more reviews, break
            if not result:
                break
            
            # Write reviews to CSV
            for r in result:
                writer.writerow({
                    'reviewId': r['reviewId'],
                    'userName': r['userName'],
                    'score': r['score'],
                    'content': r['content'],
                    'thumbsUpCount': r['thumbsUpCount'],
                    'reviewCreatedVersion': r['reviewCreatedVersion'],
                    'at': r['at'],
                    'replyContent': r['replyContent'],
                    'repliedAt': r['repliedAt']
                })
            
            # Update progress
            reviews_scraped += len(result)
            print(f"Progress: {reviews_scraped:,} reviews scraped", end='\r')
            
            # If no continuation token or we've reached the limit, we're done
            if not continuation_token or (max_reviews and reviews_scraped >= max_reviews):
                break
    
    print(f"\nDone! Scraped {reviews_scraped:,} reviews to {filename}")
    return filename

if __name__ == "__main__":
    # Get app URL from user
    app_url = input("Enter the Google Play Store URL of the app: ")
    app_id = extract_app_id_from_url(app_url)
    
    if app_id:
        # Scrape reviews with 20k limit
        output_file = scrape_app_reviews(
            app_id=app_id,
            lang='en',
            country='in',
            max_reviews=20000  # Limit to 20k reviews
        )
    else:
        print("Error: Could not extract app ID from the URL")