# Google Play Store Review Analysis

A tool to analyze Google Play Store app reviews using GPT-4 for sentiment analysis and feedback categorization.

## Features

- Scrapes reviews from Google Play Store apps
- Classifies reviews into categories (complaints, praise, feature requests)
- Provides detailed subcategories for each type of feedback
- Real-time analysis progress tracking
- Modern React frontend with Tailwind CSS
- FastAPI backend with async processing

## Setup

### Backend Setup

1. Install Poetry (if not already installed):
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
poetry install
```

3. Create a `.env` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your-key-here
```

4. Start the backend server:
```bash
poetry run python app.py
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Enter a Google Play Store app URL
3. Click "Analyze" to start the review analysis
4. Monitor the progress in real-time
5. View the detailed analysis results when complete

## API Endpoints

- `POST /api/analyze` - Start a new analysis
- `GET /api/status/{job_id}` - Get analysis progress
- `GET /api/results/{job_id}` - Get analysis results

## Development

- Backend code is in `app.py` and the `examples` directory
- Frontend code is in the `frontend` directory
- Types and interfaces are in `frontend/src/types`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
