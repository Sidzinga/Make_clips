import React, { useRef, useState } from 'react';
import { 
  Container,
  Card,
  Button,
  Badge,
  ListGroup,
  Stack,
  ButtonGroup,
  Form
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const VideoEditor = () => {
  const api = axios.create({
    baseURL:  'http://localhost:5000/api',})
  const videoRef = useRef(null);
  const [currentStep, setCurrentStep] = useState('upload');
  const [videoSource, setVideoSource] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [scenes, setScenes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [inputType, setInputType] = useState('upload');
  const [externalUrl, setExternalUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [nowEditing, setNowEditing] = useState('');
  const [previewEdit, setPreviewEdit] = useState(false);
  const [previewSource, setPreviewSource] = useState(null);

  // File upload handling
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      const response = await api.post('/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      setVideoSource(response.data.videoUrl);
      setNowEditing(response.data.videoName);
      setCurrentStep('edit');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    }
  };

  // URL handling
  const handleUrlSubmit = async () => {
    try {
      const response = await api.post('/process_url', { url: externalUrl });
      setVideoSource(response.data.videoUrl);
      setNowEditing(response.data.videoName);

      setCurrentStep('edit');
    } catch (error) {
      console.error('URL processing failed:', error);
      alert('URL processing failed: ' + error.message);
    }
  };

  // Video processing
  const processVideo = async () => {
    // Validate title
    if (!videoTitle.trim()) {
      setTitleError(true);
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await api.post('/process', {
        segments: scenes,
        source: videoSource,
        title: videoTitle,
        backEndRef: nowEditing
      });
      setProcessedUrl(response.data.videoUrl);
      setCurrentStep('download');
      setPreviewSource(response.data.videoUrl);
      setPreviewEdit(true);
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Processing failed: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Existing video controls
  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };

  const setStart = () => {
    setStartTime(videoRef.current.currentTime);
  };

  const setEnd = () => {
    setEndTime(videoRef.current.currentTime);
  };

  const saveScene = () => {
    if (startTime === null || endTime === null) {
      alert('Please set both start and end times');
      return;
    }
    
    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    const newScene = {
      id: Date.now(),
      start: startTime,
      end: endTime,
      order: scenes.length + 1
    };

    setScenes([...scenes, newScene]);
    setStartTime(null);
    setEndTime(null);
  };

  const handleReorder = (index, direction) => {
    const newScenes = [...scenes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newScenes.length) return;

    [newScenes[index].order, newScenes[targetIndex].order] = 
      [newScenes[targetIndex].order, newScenes[index].order];

    newScenes.sort((a, b) => a.order - b.order);
    setScenes(newScenes);
  };

  // Reset state when going back to upload
  const goToUploadStep = () => {
    setVideoSource(null);
    setScenes([]);
    setStartTime(null);
    setEndTime(null);
    setVideoTitle('');
    setTitleError(false);
    setCurrentStep('upload');
  };

  return (
    <Container className="mt-4">
      <div className={`modal fade ${isSaving ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mt-3">Processing video...</h5>
              <p>Please wait while we process your video</p>
            </div>
          </div>
        </div>
      </div>

      {currentStep === 'upload' && (
        <Card className="shadow">
          <Card.Header className="bg-primary text-white">
            <h3 className="mb-0">Upload Video</h3>
          </Card.Header>
          <Card.Body>
            <Stack gap={3}>
              <ButtonGroup>
                <Button
                  variant={inputType === 'upload' ? 'primary' : 'outline-primary'}
                  onClick={() => setInputType('upload')}
                >
                  Upload File
                </Button>
                <Button
                  variant={inputType === 'url' ? 'primary' : 'outline-primary'}
                  onClick={() => setInputType('url')}
                >
                  Use URL
                </Button>
              </ButtonGroup>

              {inputType === 'upload' ? (
                <Form.Group>
                  <Form.Label>Select Video File</Form.Label>
                  <Form.Control 
                    type="file" 
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  {uploadProgress > 0 && (
                    <div className="progress mt-3">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {uploadProgress}%
                      </div>
                    </div>
                  )}
                </Form.Group>
              ) : (
                <Stack gap={2}>
                  <Form.Control
                    type="url"
                    placeholder="Enter video URL (e.g., https://example.com/video.mp4)"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                  />
                  <Button onClick={handleUrlSubmit}>Load URL</Button>
                </Stack>
              )}
            </Stack>
          </Card.Body>
        </Card>
      )}

      {currentStep === 'edit' && (
        <Card className="shadow mt-4">
          <Card.Header className="bg-primary text-white">
            <h3 className="mb-0">Video Scene Editor</h3>
          </Card.Header>
          <Card.Body>
            <div className="ratio ratio-16x9 rounded-lg mb-4">
              <video
                ref={videoRef}
                src={`http://localhost:5000/api${videoSource}`}
                controls
                onTimeUpdate={handleTimeUpdate}
                className="embed-responsive-item"
              />
            </div>

            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
              <Stack direction="horizontal" gap={2}>
                <Button 
                  onClick={handlePlayPause}
                  variant={isPlaying ? 'danger' : 'success'}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </Button>
                <div className="d-flex align-items-center bg-light p-2 rounded">
                  <Badge bg="primary" className="me-2">Current Time</Badge>
                  <span className="fw-bold">{currentTime.toFixed(2)}s</span>
                </div>
              </Stack>
            </Stack>

            <div className="mb-4">
              <h4 className="mb-3">Scene Markers</h4>
              <Stack direction="horizontal" gap={2} className="mb-3">
                <Button 
                  onClick={setStart}
                  variant="outline-primary"
                >
                  ⏺ Set Start ({startTime !== null ? startTime.toFixed(2) + 's' : '--'})
                </Button>
                <Button 
                  onClick={setEnd}
                  variant="outline-primary"
                >
                  ⏺ Set End ({endTime !== null ? endTime.toFixed(2) + 's' : '--'})
                </Button>
                <Button 
                  onClick={saveScene} 
                  disabled={!startTime || !endTime}
                  variant="primary"
                >
                  💾 Save Scene
                </Button>
              </Stack>
            </div>

            <div className="mb-4">
              <h4 className="mb-3">Saved Scenes</h4>
              <ListGroup>
                {scenes.sort((a, b) => a.order - b.order).map((scene, index) => (
                  <ListGroup.Item key={scene.id} className="d-flex justify-content-between align-items-center">
                    <Stack direction="horizontal" gap={2}>
                      <Badge bg="primary">{scene.order}</Badge>
                      <span className="fw-bold">{scene.start.toFixed(2)}s</span>
                      <span>–</span>
                      <span className="fw-bold">{scene.end.toFixed(2)}s</span>
                    </Stack>
                    <ButtonGroup>
                      <Button
                        onClick={() => handleReorder(index, 'up')}
                        variant="outline-secondary"
                        size="sm"
                        disabled={index === 0}
                      >
                        ▲
                      </Button>
                      <Button
                        onClick={() => handleReorder(index, 'down')}
                        variant="outline-secondary"
                        size="sm"
                        disabled={index === scenes.length - 1}
                      >
                        ▼
                      </Button>
                    </ButtonGroup>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>

            {/* ADDED: Title input field */}
            <Form.Group className="mb-3">
              <Form.Label>Video Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter a title for your video"
                value={videoTitle}
                onChange={(e) => {
                  setVideoTitle(e.target.value);
                  setTitleError(false);
                }}
                isInvalid={titleError}
                required
              />
              {titleError && (
                <Form.Control.Feedback type="invalid">
                  Please enter a title for your video
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Stack direction="horizontal" gap={3} className="justify-content-end">
              <Button 
                onClick={goToUploadStep}
                variant="outline-secondary"
              >
                ← Back to Upload
              </Button>
              <Button 
                onClick={processVideo}
                disabled={scenes.length === 0}
                variant="success"
              >
                🚀 Process Video
              </Button>
            </Stack>
          </Card.Body>
        </Card>
      )}
      {previewEdit && (
        <Card className="shadow mt-4">
          <Card.Header className="bg-warning text-white">
            <h3 className="mb-0">Preview Edit</h3>
          </Card.Header>
          <Card.Body className="text-center">
            <div className="ratio ratio-16x9 mb-4">
              <video
                controls
                src={videoSource}
                className="embed-responsive-item"
              />
            </div>  
            <h4 className="mb-3">{nowEditing}</h4>
            <Stack gap={3}>
              <Button
                onClick={() => setPreviewEdit(false)}
                variant="outline-secondary" 
              >
                Close Preview
              </Button>
              
              </Stack>
          </Card.Body>
        </Card>
      )}


      {currentStep === 'download' && (
        <Card className="shadow mt-4">
          <Card.Header className="bg-success text-white">
            <h3 className="mb-0">Download Processed Video</h3>
          </Card.Header>
          <Card.Body className="text-center">
            <div className="ratio ratio-16x9 mb-4">
              <video
                controls
                src={`http://localhost:5000/api/${processedUrl}`}
                className="embed-responsive-item"
              />
            </div>
            <h4 className="mb-3">{videoTitle}</h4>
            <Stack gap={3}>
              <Button 
                href={processedUrl}
                download={`${videoTitle.replace(/\s+/g, '_')}.mp4`}
                variant="primary"
                size="lg"
              >
                ⬇ Download Video
              </Button>
              <Button
                onClick={goToUploadStep}
                variant="outline-secondary"
              >
                Edit Another Video
              </Button>
            </Stack>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default VideoEditor;