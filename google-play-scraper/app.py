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
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Store ongoing analyses
analyses: Dict[str, Dict] = {}

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
            'url': request.appUrl
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
        max_reviews = 50  # Changed from 500 to 50 for prototyping
        
        while review_count < max_reviews:
            try:
                logger.debug(f"Fetching reviews batch (current count: {review_count})")
                result, continuation_token = gplay_reviews(
                    app_id,
                    count=50,  # Also reduced batch size to match max_reviews
                    continuation_token=continuation_token
                )
                
                if not result:
                    logger.warning("Received empty result from review fetch")
                    break
                    
                reviews.extend(result)
                review_count += len(result)
                logger.info(f"Fetched {len(result)} reviews. Total: {review_count}")
                
                # Update progress
                progress = min(80, int(10 + (review_count / max_reviews * 70)))
                analyses[job_id].update({
                    'progress': progress,
                    'stage': f'Fetched {review_count} reviews'
                })
                
                if not continuation_token:
                    logger.info("No more reviews available")
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
        
        logger.info(f"Starting review analysis for {review_count} reviews")
        # Run analysis
        result = analyze_app_reviews(reviews, app_metadata)
        logger.info("Review analysis completed successfully")
        
        # Store result
        analyses[job_id].update({
            'status': 'completed',
            'progress': 100,
            'stage': 'Analysis complete',
            'result': result
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