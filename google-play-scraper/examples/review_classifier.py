import json
from typing import List, Dict, Any, Optional
import openai
from openai import OpenAI
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from pathlib import Path
import time
from dotenv import load_dotenv
from cost_tracker import CostTracker, cost_logger

# Load environment variables
load_dotenv()

# Set up logging for review classifier
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def load_api_key() -> str:
    """Load OpenAI API key from environment variable or .env file."""
    # First try environment variable
    api_key = os.getenv('OPENAI_API_KEY')
    
    # If not found, try loading from .env file
    if not api_key:
        env_path = Path('.env')
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    if line.startswith('OPENAI_API_KEY='):
                        api_key = line.split('=')[1].strip()
                        break
    
    if not api_key:
        raise ValueError(
            "OpenAI API key not found. Please set it using either:\n"
            "1. Environment variable: export OPENAI_API_KEY='your-key'\n"
            "2. .env file with OPENAI_API_KEY=your-key"
        )
    
    return api_key

# Initialize OpenAI client
try:
    client = OpenAI(api_key=load_api_key())
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    client = None

# Initialize cost tracker
cost_tracker = CostTracker()

# SYSTEM_PROMPT updated to include subcategory classification and rationale extraction
SYSTEM_PROMPT = """You are an expert at analyzing app reviews. Your task is to classify each review into one of these categories:
- complaints: Reviews expressing dissatisfaction, bugs, or issues
- praise: Reviews expressing satisfaction, positive experiences
- feature_requests: Reviews requesting new features or improvements

In addition to the main classification, assign a subcategory and rationale based on the content. Use both universal subcategories and domain-specific ones inferred from the app's context.

Universal subcategories include:
- bugs
- performance
- pricing
- ux
- onboarding
- support
- data/sync
- cross-platform

You may infer additional subcategories if relevant.

You must respond with ONLY a JSON object in this exact format:
{
    "classification": "complaints|praise|feature_requests",
    "subcategory": "string",
    "context_category": "string",
    "confidence": 0.95,
    "rationale": "string"
}

The confidence score (0.0-1.0) indicates how confident you are in the classification.
Do not include any other text in your response, only the JSON object."""


SUBCATEGORIES = {
    'complaints': [
        'Performance',
        'Bugs',
        'Pricing',
        'UX',
        'Integration Issues',
        'Support'
    ],
    'praise': [
        'Performance',
        'UX',
        'Support',
        'Pricing',
        'Integration'
    ],
    'feature_requests': [
        'Performance',
        'UX',
        'Integration',
        'Pricing',
        'Support'
    ]
}

def normalize_subcategory(subcategory: str) -> str:
    """
    Normalize subcategory names so that logically equivalent variants are grouped
    under a single canonical label (e.g. "performance" -> "Performance").
    """
    if not subcategory:
        return "N/A"

    sub = subcategory.strip().lower()

    mapping = {
        "bugs": "Bugs",
        "bug": "Bugs",
        "performance": "Performance",
        "perf": "Performance",
        "pricing": "Pricing",
        "price": "Pricing",
        "ux": "UX",
        "user experience": "UX",
        "integration": "Integration Issues",
        "integration issues": "Integration Issues",
        "support": "Support",
        "customer support": "Support",
        "onboarding": "Onboarding",
        "data/sync": "Data/Sync",
        "cross-platform": "Cross-Platform"
    }

    if sub in mapping:
        return mapping[sub]

    # Default: title‑case words, keeping acronyms uppercase
    return " ".join(
        w.upper() if w.lower() in {"ux", "ui"} else w.capitalize()
        for w in subcategory.strip().split()
    )

def classify_review(review: Dict[str, Any], max_retries: int = 3) -> Dict[str, Any]:
    """Classify a single review using GPT-4."""
    prompt = f"""Analyze this app review and classify it into one of these categories:
- Complaints
- Praise
- Feature Requests

Then assign it to one of these subcategories based on the main category:
Complaints: {', '.join(SUBCATEGORIES['complaints'])}
Praise: {', '.join(SUBCATEGORIES['praise'])}
Feature Requests: {', '.join(SUBCATEGORIES['feature_requests'])}

Review: "{review['content']}"

Return your analysis as a JSON object with this structure:
{{
    "category": "complaints|praise|feature_requests",
    "subcategory": "one of the subcategories",
    "confidence": 0.0-1.0,
    "summary": "brief summary of the key point",
    "quote": "most relevant quote from the review"
}}"""

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4-0125-preview",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a review analysis expert. Analyze app reviews and return structured JSON responses."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            # Track API usage (logged privately)
            app_id = review.get('appId', 'unknown')
            cost_tracker.log_api_call(
                app_id=app_id,
                review_count=1,
                completion_tokens=response.usage.completion_tokens,
                prompt_tokens=response.usage.prompt_tokens
            )
            
            result = json.loads(response.choices[0].message.content)
            # Normalise the subcategory to a canonical label
            result["subcategory"] = normalize_subcategory(result.get("subcategory", ""))
            logger.info(f"Successfully classified review: {result['category']} - {result['subcategory']}")
            return result
            
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed to classify review after {max_retries} attempts: {str(e)}")
                raise
            time.sleep(2 ** attempt)  # Exponential backoff

def classify_reviews_batch(reviews: List[Dict[str, Any]], max_workers: int = 3) -> Dict[str, List[Dict[str, Any]]]:
    """Classify a batch of reviews in parallel."""
    classified_reviews = {
        'complaints': [],
        'praise': [],
        'feature_requests': []
    }
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_review = {
            executor.submit(classify_review, review): review 
            for review in reviews
        }
        
        for future in as_completed(future_to_review):
            try:
                result = future.result()
                classified_reviews[result['category']].append(result)
            except Exception as e:
                logger.error(f"Failed to process review: {str(e)}")
    
    return classified_reviews

def summarize_classified_reviews(classified_reviews: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Generate a summary of classified reviews (keeps the full item list, adds total_items for pagination)."""
    summary = {
        'app': {
            'name': '',  # To be filled by the caller
            'icon': '',  # To be filled by the caller
            'rating': 0  # To be filled by the caller
        },
        'kpi': {
            'total': sum(len(reviews) for reviews in classified_reviews.values()),
            'complaints': len(classified_reviews['complaints']),
            'praise': len(classified_reviews['praise']),
            'features': len(classified_reviews['feature_requests'])
        }
    }
    
    # Process each category
    for category, reviews in classified_reviews.items():
        # Group by subcategory
        subcategories = {}
        for review in reviews:
            subcategory = normalize_subcategory(review['subcategory'])
            if subcategory not in subcategories:
                subcategories[subcategory] = {
                    'items': [],
                    'count': 0,
                    'confidence_sum': 0
                }
            subcategories[subcategory]['items'].append({
                'summary': review['summary'],
                'quote': review['quote'],
                'confidence': review['confidence']
            })
            subcategories[subcategory]['count'] += 1
            subcategories[subcategory]['confidence_sum'] += review['confidence']
        
        # Convert to final format
        summary[category] = [
            {
                'subcategory': subcategory,
                'count': data['count'],
                'confidence': data['confidence_sum'] / data['count'],
                'items': sorted(data['items'], key=lambda x: x['confidence'], reverse=True),
                'total_items': data['count'],
            }
            for subcategory, data in subcategories.items()
        ]
        
        # Sort subcategories by count
        summary[category].sort(key=lambda x: x['count'], reverse=True)
    
    return summary

def analyze_app_reviews(reviews: List[Dict[str, Any]], app_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Analyze app reviews and generate a comprehensive report."""
    logger.info(f"Starting analysis of {len(reviews)} reviews")
    
    try:
        # Classify reviews
        classified_reviews = classify_reviews_batch(reviews)
        
        # Generate summary
        summary = summarize_classified_reviews(classified_reviews)
        
        # Add app info if provided
        if app_info:
            summary['app'] = app_info
        
        logger.info("Analysis completed successfully")
        return summary
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        # Return a partial result if possible
        return {
            'app': app_info or {},
            'kpi': {
                'total': len(reviews),
                'complaints': 0,
                'praise': 0,
                'features': 0
            },
            'complaints': [],
            'praise': [],
            'feature_requests': []
        }

# Example usage
if __name__ == "__main__":
    # Example reviews
    sample_reviews = [
        {
            'reviewId': '1',
            'score': 1,
            'content': 'App keeps crashing every time I try to open it. Terrible experience!'
        },
        {
            'reviewId': '2',
            'score': 5,
            'content': 'Love this app! Best one I\'ve used for task management.'
        },
        {
            'reviewId': '3',
            'score': 4,
            'content': 'Great app but would be better with dark mode and calendar integration.'
        }
    ]
    
    try:
        # Classify reviews
        results = classify_reviews_batch(sample_reviews)
        
        # Generate summary
        summary = summarize_classified_reviews(results)
        
        # Print results
        print("\nClassified Reviews:")
        print(json.dumps(results, indent=2))
        
        print("\nSummary Analysis:")
        print(json.dumps(summary, indent=2))
        
    except Exception as e:
        logger.error(f"Failed to process reviews: {str(e)}")