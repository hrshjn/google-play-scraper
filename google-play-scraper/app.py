from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from examples.review_classifier import analyze_app_reviews
from google_play_scraper import app as gplay_app
from google_play_scraper import reviews as gplay_reviews
import asyncio
import json
from typing import Dict, Optional
import logging
import uuid
import traceback

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Store ongoing analyses
analyses: Dict[str, Dict] = {}

# Helper key names we’ll use later to store every individual review,
# grouped by *subcategory* (the tag shown in the UI, e.g. “Performance”)
REVIEWS_KEY = "reviews_by_subcategory"

class AnalysisRequest(BaseModel):
    appUrl: str

@app.post("/api/analyze")
async def start_analysis(request: AnalysisRequest):
    try:
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        logger.debug(f"Received analysis request for URL: {request.appUrl}")
        
        # Extract app ID from URL
        app_id = request.appUrl.split('id=')[-1].split('&')[0]
        logger.info(f"Extracted app ID: {app_id}")
        
        # Store initial status
        analyses[job_id] = {
            'status': 'starting',
            'progress': 0,
            'stage': 'Fetching app info',
            'app_id': app_id,
            'url': request.appUrl,
            REVIEWS_KEY: {}  # will be filled once analysis completes
        }
        
        # Start analysis in background
        asyncio.create_task(run_analysis(job_id, app_id))
        logger.info(f"Started analysis task with job ID: {job_id}")
        
        return JSONResponse(content={'jobId': job_id}, status_code=200)
        
    except Exception as e:
        error_details = f"Failed to start analysis: {str(e)}"
        logger.error(error_details)
        return JSONResponse(
            content={'error': str(e), 'details': error_details},
            status_code=500
        )

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    try:
        logger.debug(f"Checking status for job ID: {job_id}")
        
        if job_id not in analyses:
            logger.warning(f"Job ID not found: {job_id}")
            return JSONResponse(
                content={
                    'error': 'Analysis job not found',
                    'status': 'error',
                    'stage': 'Job not found',
                    'progress': 0
                },
                status_code=404
            )
            
        status = analyses[job_id]
        logger.debug(f"Returning status for job {job_id}: {status}")
        
        # Ensure all required fields are present
        if not all(key in status for key in ['status', 'progress', 'stage']):
            logger.error(f"Invalid status object for job {job_id}: {status}")
            return JSONResponse(
                content={
                    'error': 'Invalid status object',
                    'status': 'error',
                    'stage': 'Internal server error',
                    'progress': 0
                },
                status_code=500
            )
        
        return JSONResponse(content=status, status_code=200)
        
    except Exception as e:
        error_details = f"Error checking status: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_details)
        return JSONResponse(
            content={
                'error': str(e),
                'details': error_details,
                'status': 'error',
                'stage': 'Internal server error',
                'progress': 0
            },
            status_code=500
        )

@app.get("/api/reviews/{job_id}/category/{category}")
async def get_reviews_by_category(
    job_id: str,
    category: str,
    page: int = 1,
    limit: int = 10,
    sort: str = "confidence"  # any numeric field inside each review dict
):
    """
    Paginated review fetcher.
    - `category` is the *subcategory/tag* (e.g. "Performance").
    - `page` is 1‑based.
    - `limit` is items per page.
    - `sort` (optional) sorts descending by that key if present.
    """
    if job_id not in analyses:
        return JSONResponse(
            content={'error': 'Analysis job not found'},
            status_code=404
        )

    data = analyses[job_id]
    if data.get('status') != 'completed':
        return JSONResponse(
            content={'error': 'Results not ready'},
            status_code=409
        )

    reviews_map = data.get(REVIEWS_KEY, {})
    reviews = reviews_map.get(category)
    if reviews is None:
        return JSONResponse(
            content={'error': f'Category "{category}" not found'},
            status_code=404
        )

    # Optional sorting
    if sort and all(isinstance(r.get(sort), (int, float)) for r in reviews if r.get(sort) is not None):
        reviews = sorted(reviews, key=lambda r: r.get(sort, 0), reverse=True)

    total = len(reviews)
    pages = max((total + limit - 1) // limit, 1)
    # Clamp page number
    page = max(1, min(page, pages))
    start = (page - 1) * limit
    end = start + limit
    paginated = reviews[start:end]

    return JSONResponse(
        content={
            'category': category,
            'page': page,
            'limit': limit,
            'pages': pages,
            'total': total,
            'reviews': paginated
        },
        status_code=200
    )

@app.get("/api/results/{job_id}")
async def get_results(job_id: str):
    try:
        logger.debug(f"Fetching results for job ID: {job_id}")
        
        if job_id not in analyses:
            logger.warning(f"Job ID not found: {job_id}")
            return JSONResponse(
                content={'error': 'Analysis job not found'},
                status_code=404
            )
            
        status = analyses[job_id]
        
        if 'result' not in status:
            logger.warning(f"Results not ready for job {job_id}")
            return JSONResponse(
                content={'error': 'Results not ready'},
                status_code=404
            )
            
        logger.info(f"Returning results for job {job_id}")
        return JSONResponse(content=status['result'], status_code=200)
        
    except Exception as e:
        error_details = f"Error fetching results: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_details)
        return JSONResponse(
            content={'error': str(e), 'details': error_details},
            status_code=500
        )

async def run_analysis(job_id: str, app_id: str):
    try:
        logger.info(f"Starting analysis for app ID: {app_id}")
        
        # Fetch app info
        try:
            logger.debug(f"Fetching app info from Play Store...")
            app_info = gplay_app(app_id)
            logger.info(f"Successfully fetched app info: {app_info.get('title', 'Unknown App')}")
        except Exception as e:
            error_msg = f"Failed to fetch app info: {str(e)}"
            logger.error(error_msg)
            analyses[job_id].update({
                'status': 'error',
                'stage': error_msg
            })
            return
        
        analyses[job_id].update({
            'stage': 'Fetching reviews',
            'progress': 10
        })
        
        # Fetch reviews
        reviews = []
        continuation_token = None
        review_count = 0
        max_reviews = 250
        
        while review_count < max_reviews:
            try:
                logger.debug(f"Fetching reviews batch (current count: {review_count})")
                result, continuation_token = gplay_reviews(
                    app_id,
                    count=250,
                    continuation_token=continuation_token
                )
                
                if not result:
                    logger.warning("Received empty result from review fetch")
                    break
                    
                # Process reviews in smaller chunks to avoid memory issues
                chunk_size = 50
                for i in range(0, len(result), chunk_size):
                    chunk = result[i:i + chunk_size]
                    reviews.extend(chunk)
                    review_count = len(reviews)
                    
                    # Update progress
                    progress = min(80, int(10 + (review_count / max_reviews * 70)))
                    analyses[job_id].update({
                        'progress': progress,
                        'stage': f'Fetched {review_count} reviews'
                    })
                    
                    # Break if we've reached max_reviews
                    if review_count >= max_reviews:
                        break
                
                if not continuation_token or review_count >= max_reviews:
                    logger.info("Completed fetching reviews")
                    break
                    
            except Exception as e:
                error_msg = f"Error fetching reviews batch: {str(e)}"
                logger.error(f"{error_msg}\n{traceback.format_exc()}")
                analyses[job_id].update({
                    'status': 'error',
                    'stage': error_msg
                })
                return
        
        if not reviews:
            error_msg = "No reviews found for the app"
            logger.error(error_msg)
            analyses[job_id].update({
                'status': 'error',
                'stage': error_msg
            })
            return
        
        # Start analysis
        analyses[job_id].update({
            'stage': 'Analyzing reviews',
            'progress': 80
        })
        
        # Prepare app info
        app_metadata = {
            'name': app_info['title'],
            'icon': app_info['icon'],
            'rating': app_info['score']
        }
        
        # Dict that will collect *all* individual reviews keyed by sub‑category
        full_review_map: Dict[str, list] = {}
        
        # Process reviews in chunks to avoid memory issues
        result = None
        chunk_size = 50
        for i in range(0, len(reviews), chunk_size):
            chunk = reviews[i:i + chunk_size]
            chunk_result = analyze_app_reviews(chunk, app_metadata)

            if result is None:
                # First chunk – deep copy so we can extend later
                result = chunk_result
            else:
                # Merge top‑level KPI counters
                for k in ['total', 'complaints', 'praise', 'features']:
                    result['kpi'][k] += chunk_result['kpi'][k]

                # Extend lists without truncating
                for top_cat in ['complaints', 'praise', 'feature_requests']:
                    result[top_cat].extend(chunk_result[top_cat])

            # --- NEW: capture every individual review by sub‑category ---
            for top_cat in ['complaints', 'praise', 'feature_requests']:
                for item in chunk_result[top_cat]:
                    sub_cat = item.get('subcategory') or 'N/A'
                    full_review_map.setdefault(sub_cat, []).append(item)
        
        logger.info("Review analysis completed successfully")
        
        # Persist the fully‑expanded review map for pagination
        analyses[job_id][REVIEWS_KEY] = full_review_map
        
        # Store result
        try:
            analyses[job_id].update({
                'status': 'completed',
                'progress': 100,
                'stage': 'Analysis complete',
                'result': result,
                REVIEWS_KEY: full_review_map
            })
        except Exception as e:
            error_msg = f"Failed to store analysis result: {str(e)}"
            logger.error(error_msg)
            analyses[job_id].update({
                'status': 'error',
                'stage': error_msg
            })
            
    except Exception as e:
        error_details = f"Analysis failed: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_details)
        analyses[job_id].update({
            'status': 'error',
            'stage': f'Error: {str(e)}',
            'error_details': error_details
        })

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001) 