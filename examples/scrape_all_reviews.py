import csv
from datetime import datetime
from google_play_scraper import Sort, reviews, app

def get_app_info(app_id):
    """Get basic app information including total reviews count"""
    app_info = app(app_id)
    return app_info

def scrape_all_reviews(app_id, lang='en', country='IN'):
    """
    Scrape ALL reviews for a given app and save them to a CSV file.
    Returns the total number of reviews scraped.
    """
    # First get app info to show total reviews available
    app_info = get_app_info(app_id)
    total_reviews_available = app_info['reviews']
    print(f"Total reviews available: {total_reviews_available:,}")
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"all_reviews_{app_id}_{timestamp}.csv"
    
    # Prepare CSV file
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
            print(f"Progress: {reviews_scraped:,}/{total_reviews_available:,} reviews scraped", end='\r')
            
            # If no continuation token, we're done
            if not continuation_token:
                break
    
    print(f"\nDone! Scraped {reviews_scraped:,} reviews to {filename}")
    return reviews_scraped, filename

if __name__ == "__main__":
    # App package name from the URL
    APP_ID = "com.reelies.hermes"
    
    # Scrape all reviews
    total_scraped, output_file = scrape_all_reviews(
        app_id=APP_ID,
        lang='en',
        country='IN'
    ) 