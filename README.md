# Age & Gender Prediction

A full-stack deep learning project to predict age group and gender from facial images using a fine-tuned ResNet50 model. The project features a FastAPI backend for inference and a modern React frontend for real-time webcam and image upload predictions.



## Features
- Deep Learning Model: ResNet50 with dual heads for age (20 classes, 5-year buckets) and gender (male/female).
- Face Detection: Uses MTCNN for robust face localization.
- FastAPI Backend: Simple, production-ready REST API for predictions.
- React Frontend: Clean, responsive UI with webcam and image upload support.
- Live Overlay: Real-time bounding box and prediction display on webcam feed.



## Project Structure

age-gender-prediction-main/
├── backend/
│   ├── app.py                # FastAPI backend
│   ├── requirements.txt      # Python dependencies
│   └── age_gender_resnet50/
│       └── age_gender_resnet50.pth  # Pretrained model (see below)
├── frontend/
│   ├── src/                  # React source code
│   ├── public/               # Static assets (background, logo)
│   └── package.json          # Frontend dependencies
└── README.md




## Setup Instructions

### 2. Backend Setup (FastAPI)
bash
cd backend
pip install -r requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8000

### 3. Frontend Setup (React + Vite)
bash
cd frontend
npm install
npm run dev


- The frontend will run on [http://localhost:5173](http://localhost:5173)
- The backend will run on [http://localhost:8000](http://localhost:8000)



## Usage
- Open the frontend in your browser.
- Choose Webcam for live prediction or Upload to select an image.
- The app will display the predicted age range, gender, and face bounding box.



## API Reference
### POST `/predict/`
- Request: Multipart form with image file (`file`)
- Response:
  json
  {
    "gender": "Male",
    "gender_confidence": 0.98,
    "age_range": "25-29",
    "age_confidence": 0.87,
    "box": { "x": 100, "y": 50, "w": 120, "h": 120 }
  }
  
- Errors: Returns JSON with `error` key and appropriate HTTP status code.



## Requirements
- Python 3.8+
- Node.js 18+
- See `backend/requirements.txt` and `frontend/package.json` for details



## Credits
- Model architecture: ResNet50, PyTorch
- Face detection: facenet-pytorch (MTCNN)
- Frontend: React + Vite
- Backend: FastAPI