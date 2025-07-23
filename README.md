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

