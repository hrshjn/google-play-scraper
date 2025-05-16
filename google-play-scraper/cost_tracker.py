import json
import os
from datetime import datetime
from pathlib import Path
import logging

# Set up a separate logger for cost tracking
cost_logger = logging.getLogger('cost_tracker')
cost_logger.setLevel(logging.INFO)

# Create a file handler
cost_log_file = 'cost_tracker.log'
handler = logging.FileHandler(cost_log_file)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
cost_logger.addHandler(handler)

# Keep cost logger separate from root logger
cost_logger.propagate = False

class CostTracker:
    def __init__(self, log_file="api_costs.json"):
        self.log_file = log_file
        self.ensure_log_file_exists()
    
    def ensure_log_file_exists(self):
        """Create the log file with initial structure if it doesn't exist"""
        if not os.path.exists(self.log_file):
            initial_data = {
                "total_cost": 0,
                "total_tokens": 0,
                "calls": []
            }
            with open(self.log_file, 'w') as f:
                json.dump(initial_data, f, indent=2)
    
    def log_api_call(self, app_id: str, review_count: int, completion_tokens: int, prompt_tokens: int):
        """
        Log an API call with its associated costs
        
        Args:
            app_id: The Google Play Store app ID
            review_count: Number of reviews analyzed
            completion_tokens: Number of completion tokens used
            prompt_tokens: Number of prompt tokens used
        """
        try:
            # GPT-4 Turbo pricing (as of March 2024)
            input_cost_per_1k = 0.01  # $0.01 per 1K input tokens
            output_cost_per_1k = 0.03  # $0.03 per 1K output tokens
            
            # Calculate costs
            input_cost = (prompt_tokens / 1000) * input_cost_per_1k
            output_cost = (completion_tokens / 1000) * output_cost_per_1k
            total_cost = input_cost + output_cost
            
            # Read existing data
            with open(self.log_file, 'r') as f:
                data = json.load(f)
            
            # Create new entry
            new_entry = {
                "timestamp": datetime.now().isoformat(),
                "app_id": app_id,
                "review_count": review_count,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
                "input_cost": round(input_cost, 4),
                "output_cost": round(output_cost, 4),
                "total_cost": round(total_cost, 4)
            }
            
            # Update totals
            data["total_cost"] = round(data["total_cost"] + total_cost, 4)
            data["total_tokens"] += (prompt_tokens + completion_tokens)
            data["calls"].append(new_entry)
            
            # Write updated data
            with open(self.log_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            cost_logger.info(f"API call for {app_id}: ${total_cost:.4f} ({prompt_tokens + completion_tokens} tokens)")
            
        except Exception as e:
            cost_logger.error(f"Failed to log API call: {str(e)}")
    
    def get_summary(self):
        """Get a summary of all API costs"""
        try:
            with open(self.log_file, 'r') as f:
                data = json.load(f)
            return data
        except Exception as e:
            cost_logger.error(f"Failed to get cost summary: {str(e)}")
            return None 