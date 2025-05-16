from scrape_reviews_to_csv import scrape_app_reviews, extract_app_id_from_url
from review_classifier import classify_reviews, summarise_classified_reviews
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_app_reviews(app_url: str, max_reviews: int = 100) -> dict:
    """
    Scrape and analyze reviews for a given app.
    
    Args:
        app_url: Google Play Store URL of the app
        max_reviews: Maximum number of reviews to analyze
    
    Returns:
        Dictionary containing:
        - App statistics
        - Classified reviews
        - Summary metrics
        - Markdown summary
    """
    # Extract app ID from URL
    app_id = extract_app_id_from_url(app_url)
    if not app_id:
        raise ValueError("Could not extract app ID from URL")
    
    # Scrape reviews
    logger.info(f"Scraping up to {max_reviews} reviews...")
    csv_file = scrape_app_reviews(
        app_id=app_id,
        lang='en',
        country='in',
        max_reviews=max_reviews
    )
    
    # Read reviews from CSV
    import csv
    reviews = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            reviews.append({
                'reviewId': row['reviewId'],
                'score': int(row['score']),
                'content': row['content']
            })
    
    # Classify reviews
    logger.info(f"Classifying {len(reviews)} reviews...")
    classified = classify_reviews(reviews)
    
    # Generate detailed summary
    logger.info("Generating summary analysis...")
    summary = summarise_classified_reviews(classified)
    
    # Calculate metrics
    total_reviews = len(reviews)
    metrics = {
        'total_reviews': total_reviews,
        'categories': {
            'complaints': {
                'count': len(classified['complaints']),
                'percentage': round(len(classified['complaints']) / total_reviews * 100, 2)
            },
            'praise': {
                'count': len(classified['praise']),
                'percentage': round(len(classified['praise']) / total_reviews * 100, 2)
            },
            'feature_requests': {
                'count': len(classified['feature_requests']),
                'percentage': round(len(classified['feature_requests']) / total_reviews * 100, 2)
            }
        }
    }
    
    # Add average confidence per category
    for category in classified:
        if classified[category]:
            avg_confidence = sum(r['confidence'] for r in classified[category]) / len(classified[category])
            metrics['categories'][category]['avg_confidence'] = round(avg_confidence, 2)
    
    return {
        'metrics': metrics,
        'classified_reviews': classified,
        'summary': summary
    }

if __name__ == "__main__":
    # Example app URL for Splitkaro
    default_url = "https://play.google.com/store/apps/details?id=com.bsquare.splitkaro"
    
    # Get app URL from user or use default
    app_url = input(f"Enter the Google Play Store URL of the app (press Enter for {default_url}): ").strip()
    if not app_url:
        app_url = default_url
    
    # Get max reviews with default
    max_reviews = input("Enter maximum number of reviews to analyze (press Enter for 100): ").strip()
    max_reviews = int(max_reviews) if max_reviews else 100
    
    # Analyze reviews
    results = analyze_app_reviews(app_url, max_reviews)
    
    # Print metrics
    print("\nAnalysis Results:")
    print("================")
    print(f"\nTotal Reviews Analyzed: {results['metrics']['total_reviews']}")
    print("\nBreakdown by Category:")
    for category, stats in results['metrics']['categories'].items():
        print(f"\n{category.replace('_', ' ').title()}:")
        print(f"- Count: {stats['count']}")
        print(f"- Percentage: {stats['percentage']}%")
        if 'avg_confidence' in stats:
            print(f"- Average Confidence: {stats['avg_confidence']}")
    
    # Print detailed summary
    print("\nDetailed Analysis:")
    print("=================")
    print(results['summary'])
    
    # Save detailed results to JSON
    output_file = 'review_analysis_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"\nDetailed results saved to {output_file}") 