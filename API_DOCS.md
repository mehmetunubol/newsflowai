# News Video Bot API Documentation (Simplified)

## Base URL
`http://localhost:3001`

## Single Endpoint

### Compose Final Video
- **Endpoint**: `POST /generate/compose`
- **Description**: Combines voiceover, visuals and script into a final video
- **Request Body**:
  ```json
  {
    "voicePath": "/path/to/voiceover.mp3",
    "visualsPaths": ["/path/to/image1.jpg", "/path/to/image2.jpg"],
    "script": "Your news script text here"
  }
  ```
- **Success Response**:
  ```json
  {
    "videoUrl": "/path/to/generated/final_reel.mp4"
  }
  ```
- **Error Responses**:
  - 400: Missing required fields (voicePath, visualsPaths, or script)
  - 500: Video composition failed

## Notes
- All generated assets are available under `/assets/` endpoint
- The API runs on port 3001 by default
- Error responses include detailed error messages
