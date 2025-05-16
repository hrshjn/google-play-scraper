from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        
        # Extract app ID from URL
        app_id = request.appUrl.split('id=')[-1].split('&')[0]
        logger.info(f"Starting analysis for app ID: {app_id}")
        
        # Store initial status
        analyses[job_id] = {
            'status': 'starting',
            'progress': 0,
            'stage': 'Fetching app info',
            'app_id': app_id  # Store app_id for debugging
        }
        
        # Start analysis in background
        asyncio.create_task(run_analysis(job_id, app_id))
        
        return {'jobId': job_id}
        
    except Exception as e:
        logger.error(f"Failed to start analysis: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in analyses:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return analyses[job_id]

async def run_analysis(job_id: str, app_id: str):
    try:
        logger.info(f"Fetching app info for {app_id}")
        # Fetch app info
        app_info = gplay_app(app_id)
        logger.info(f"Successfully fetched app info: {app_info['title']}")
        
        analyses[job_id]['stage'] = 'Fetching reviews'
        analyses[job_id]['progress'] = 10
        
        # Fetch reviews
        reviews = []
        continuation_token = None
        review_count = 0
        max_reviews = 500  # Limit to 500 reviews for now
        
        while review_count < max_reviews:
            try:
                logger.info(f"Fetching reviews batch for {app_id} (count: {review_count})")
                result, continuation_token = gplay_reviews(
                    app_id,
                    count=100,
                    continuation_token=continuation_token
                )
                reviews.extend(result)
                review_count += len(result)
                
                # Update progress
                progress = min(80, int(10 + (review_count / max_reviews * 70)))
                analyses[job_id].update({
                    'progress': progress,
                    'stage': f'Fetched {review_count} reviews'
                })
                logger.info(f"Successfully fetched {len(result)} reviews. Total: {review_count}")
                
                if not continuation_token:
                    break
            except Exception as e:
                logger.error(f"Error fetching reviews batch: {str(e)}\n{traceback.format_exc()}")
                raise
        
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