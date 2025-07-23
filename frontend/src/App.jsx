import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const [mode, setMode] = useState("webcam");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "webcam") {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "webcam") return;
    const interval = setInterval(captureFrame, 2000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setPrediction(null);

    const formData = new FormData();
    formData.append("file", file);

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageURL(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      const res = await axios.post("http://localhost:8000/predict/", formData);
      if (res.data.error) {
        setError(res.data.error);
        setPrediction(null);
      } else {
        setPrediction(res.data);
        setError("");
      }
    } catch (err) {
      setError(`Prediction failed. Please try again. ${err}`);
      setPrediction(null);
    }
    setLoading(false);
  };

  const captureFrame = async () => {
    if (mode !== "webcam") return;
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");
      setLoading(true);
      try {
        const res = await axios.post(
          "http://localhost:8000/predict/",
          formData
        );
        if (res.data.error) {
          setError(res.data.error);
          setPrediction(null);
        } else {
          setPrediction(res.data);
          setError("");
        }
      } catch (err) {
        setError("Prediction failed.");
        setPrediction(null);
      }
      setLoading(false);
    }, "image/jpeg");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const drawOverlay = () => {
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");
      if (!video || !canvas) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      if (prediction?.box) {
        const { x, y, w, h } = prediction.box;
        ctx.strokeStyle = "#00e676";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = "#00e676";
        ctx.font = "18px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(
          `${prediction.gender}, ${prediction.age_range}`,
          canvas.width - x,
          y - 12
        );
        ctx.restore();
      }
      ctx.restore();
      requestAnimationFrame(drawOverlay);
    };
    if (mode === "webcam") {
      drawOverlay();
    } else {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [prediction, mode]);

  return (
    <div
      className="app-container"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        minHeight: "100vh",
        padding: 0,
        background: `linear-gradient(rgba(10,20,40,0.82), rgba(10,20,40,0.92)), url('/bg-age-gender.jpg') center/cover no-repeat fixed`,
        backgroundBlendMode: "overlay"
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 32 }}>
        <h1 style={{ margin: 0, fontWeight: 800, fontSize: 38, letterSpacing: 1, color: '#00e676', textShadow: '0 2px 8px #0008', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          Age & Gender Prediction
        </h1>
      </div>
      <header style={{ background: "#222b", color: "#fff", padding: "16px 0 8px 0", marginBottom: 32, boxShadow: "0 2px 8px #0002", borderRadius: 12, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
        <p style={{ margin: 0, fontWeight: 400, fontSize: 18, color: "#bdbdbd", textAlign: 'center' }}>
          Upload an image or use your webcam for real-time prediction
        </p>
      </header>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 40, flexWrap: "wrap", width: '100%' }}>
        <div style={{ minWidth: 340, maxWidth: 400, background: "#fff3", borderRadius: 20, boxShadow: "0 2px 24px #0004", padding: 36, backdropFilter: 'blur(2px)', marginBottom: 32 }}>
          <div style={{ marginBottom: 12, textAlign: "center", fontWeight: 700, fontSize: 20, color: "#1976d2", letterSpacing: 1 }}>
            Choose Input Mode
          </div>
          <div style={{ marginBottom: 28, display: "flex", gap: 28, justifyContent: "center" }}>
            <label style={{ fontWeight: 600, fontSize: 17, color: mode === 'webcam' ? '#00e676' : '#1976d2' }}>
              <input
                type="radio"
                value="webcam"
                checked={mode === "webcam"}
                onChange={() => setMode("webcam")}
                style={{ marginRight: 8 }}
              />
              Webcam
            </label>
            <label style={{ fontWeight: 600, fontSize: 17, color: mode === 'upload' ? '#00e676' : '#1976d2' }}>
              <input
                type="radio"
                value="upload"
                checked={mode === "upload"}
                onChange={() => setMode("upload")}
                style={{ marginRight: 8 }}
              />
              Upload
            </label>
          </div>
          {mode === "upload" && (
            <div className="upload-container" style={{ marginBottom: 24 }}>
              <label className="upload-label" style={{ fontWeight: 600, fontSize: 16, color: '#1976d2' }}>
                Upload Image:
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "block", marginTop: 8 }} />
              </label>
            </div>
          )}
          <div className="video-container" style={{ display: mode === "webcam" ? "block" : "none", position: "relative", marginBottom: 12 }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="video-element"
              style={{ width: "100%", borderRadius: 14, boxShadow: "0 1px 8px #0002" }}
            />
            <canvas ref={canvasRef} className="canvas-element" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
          </div>
          {mode === "upload" && uploadedImageURL && (
            <div className="uploaded-image-container" style={{ marginTop: 16, textAlign: "center" }}>
              <img
                src={uploadedImageURL}
                alt="Uploaded"
                className="uploaded-image"
                style={{
                  maxWidth: "100%",
                  border: "1px solid #e0e0e0",
                  borderRadius: 14,
                  marginTop: "10px",
                  boxShadow: "0 1px 8px #0002"
                }}
              />
            </div>
          )}
        </div>
        <div style={{ minWidth: 300, maxWidth: 400, background: "#fff3", borderRadius: 20, boxShadow: "0 2px 24px #0004", padding: 36, marginTop: 0, backdropFilter: 'blur(2px)', marginBottom: 32 }}>
          <h2 style={{ fontWeight: 700, fontSize: 26, marginBottom: 18, color: "#00e676", textAlign: 'center', letterSpacing: 1 }}>Prediction</h2>
          <div className="prediction-display" style={{ minHeight: 60, fontSize: 24, fontWeight: 600, color: error ? "#d32f2f" : "#00e676", background: 'rgba(20,30,50,0.7)', borderRadius: 14, marginBottom: 18 }}>
            {loading ? (
              <span style={{ color: "#1976d2" }}>Predicting...</span>
            ) : error ? (
              <span>{error}</span>
            ) : prediction ? (
              <>
                <span style={{ fontSize: 28 }}>{prediction.gender}, {prediction.age_range}</span>
                {prediction.box && (
                  <div style={{ fontSize: 16, color: "#bdbdbd", marginTop: 10 }}>
                    <span>Face box: [x: {prediction.box.x}, y: {prediction.box.y}, w: {prediction.box.w}, h: {prediction.box.h}]</span>
                  </div>
                )}
              </>
            ) : (
              <span style={{ color: "#bdbdbd" }}>Waiting for prediction...</span>
            )}
          </div>
          <div style={{ marginTop: 32, fontSize: 15, color: "#bdbdbd", textAlign: 'center' }}>
            <p>• For best results, use a clear, well-lit image with a visible face.</p>
            <p>• No face detected? Try adjusting your position or uploading a different image.</p>
          </div>
        </div>
      </div>
      <footer style={{ marginTop: 24, textAlign: "center", color: "#bdbdbd", fontSize: 15, padding: 18, letterSpacing: 1, background: '#222b', borderRadius: 12, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 8px #0002' }}>
      </footer>
    </div>
  );
}

export default App;
