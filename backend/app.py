from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from io import BytesIO
from facenet_pytorch import MTCNN
import logging
import torch.nn.functional as F
import os

# FastAPI setup
app = FastAPI()

# Configurable CORS origins
ALLOWED_ORIGINS = ["*"]  # Change this to restrict origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
IMAGE_SIZE = 224
NUM_AGE_CLASSES = 20
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Model Definition
class AgeGenderModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.base = models.resnet50(pretrained=True)
        self.base.fc = nn.Identity()
        self.gender_head = nn.Linear(2048, 2)
        self.age_head = nn.Linear(2048, NUM_AGE_CLASSES)

    def forward(self, x):
        x = self.base(x)
        return self.gender_head(x), self.age_head(x)

# Load model
model = AgeGenderModel().to(DEVICE)
model_path = os.path.join(os.path.dirname(__file__), "age_gender_resnet50", "age_gender_resnet50.pth")
model.load_state_dict(torch.load(model_path, map_location=DEVICE))
model.eval()

# Face detector (MTCNN)
mtcnn = MTCNN(keep_all=False, device=DEVICE)

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Convert class to readable age range
def class_to_age_range(age_class):
    return "95+" if age_class == 19 else f"{age_class * 5}-{age_class * 5 + 4}"

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------
# Prediction Route
# -----------------------
@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    """Predict age and gender from an uploaded image file.
    Returns gender, age range, and face bounding box.
    """
    contents = await file.read()

    try:
        img = Image.open(BytesIO(contents)).convert("RGB")
    except Exception as e:
        logger.error(f"Invalid image: {str(e)}")
        return {"error": f"Invalid image: {str(e)}"}, 400

    # Detect face
    try:
        boxes, _ = mtcnn.detect(img)
    except Exception as e:
        logger.error(f"Face detection failed: {str(e)}")
        return {"error": f"Face detection failed: {str(e)}"}, 500

    if boxes is None or len(boxes) == 0:
        logger.warning("No face detected. Please upload a clear image with a visible face.")
        return {"error": "No face detected. Please upload a clear image with a visible face."}, 422

    # Use the first detected face
    try:
        x1, y1, x2, y2 = map(int, boxes[0])
        face = img.crop((x1, y1, x2, y2))
        input_tensor = transform(face).unsqueeze(0).to(DEVICE)
    except Exception as e:
        logger.error(f"Face crop/transform failed: {str(e)}")
        return {"error": f"Face crop/transform failed: {str(e)}"}, 500

    try:
        with torch.no_grad():
            gender_out, age_out = model(input_tensor)
            gender_probs = F.softmax(gender_out, dim=1).cpu().numpy()[0]
            age_probs = F.softmax(age_out, dim=1).cpu().numpy()[0]
            gender_idx = int(gender_probs.argmax())
            age_class = int(age_probs.argmax())
            gender_conf = float(gender_probs[gender_idx])
            age_conf = float(age_probs[age_class])
    except Exception as e:
        logger.error(f"Model inference failed: {str(e)}")
        return {"error": f"Model inference failed: {str(e)}"}, 500

    logger.info(f"Prediction successful: gender={gender_idx}, age_class={age_class}, gender_conf={gender_conf:.2f}, age_conf={age_conf:.2f}")
    return {
        "gender": "Male" if gender_idx == 0 else "Female",
        "gender_confidence": round(gender_conf, 3),
        "age_range": class_to_age_range(age_class),
        "age_confidence": round(age_conf, 3),
        "box": {
            "x": int(x1),
            "y": int(y1),
            "w": int(x2 - x1),
            "h": int(y2 - y1)
        }
    }
