# News Video API Documentation

## Base URL
`http://localhost:3001` (Development)
`https://your-cloud-run-url.a.run.app` (Production)

## Script Generation Endpoint

### POST /script
Generates a news script from a headline and stores it in the database.

**Request Body**:
```json
{
  "headline": "Your news headline here"
}
```

**Success Response**:
```json
{
  "script": "Generated news script content...",
  "id": "507f1f77bcf86cd799439011"
}
```

**Error Responses**:
- `400 Bad Request`: Missing headline
- `500 Internal Server Error`: Script generation failed

## Video Generation Endpoint

### POST /generate/compose
Combines voiceover, visuals and subtitles into a final video with precise duration matching.

**Request Body Schema**:
```typescript
interface GenerateVideoRequest {
  voicePath: string;          // Path to voiceover audio file
  visualsPaths: string[];     // Array of image/video paths
  script: string;             // News script text
  options?: {
    dimensions?: string;      // Optional output dimensions (default: "720x1280")
    subtitles?: boolean;      // Enable/disable subtitles (default: true)
    transition?: {           // Transition effects
      type: 'crossfade'|'slide'|'none';
      duration?: number;      // Transition duration in seconds
    };
  };
}
```

**Example Request**:
```json
{
  "voicePath": "/assets/voiceover.mp3",
  "visualsPaths": [
    "/assets/image1.jpg",
    "/assets/image2.jpg"
  ],
  "script": "Breaking news today...",
  "options": {
    "dimensions": "720x1280",
    "subtitles": true,
    "transition": {
      "type": "crossfade",
      "duration": 0.5
    }
  }
}
```

**Response Schema**:
```typescript
interface VideoResult {
  buffer: string;            // Base64 encoded video buffer
  contentType: string;       // MIME type ("video/mp4")
  metadata: {
    path: string;           // Generated file path
    duration: number;       // Video duration in seconds
    dimensions: string;     // Output resolution
    sizeMB: number;        // File size in megabytes
    timestamp: string;      // ISO 8601 creation timestamp
  };
  subtitles?: {
    srt: string;            // Generated subtitles in SRT format
    wordTimings: number[];  // Array of word timings in seconds
  };
}
```

**Example Success Response**:
```json
{
  "buffer": "AAAAIGZ0eXBpc29t...",
  "contentType": "video/mp4",
  "metadata": {
    "path": "/tmp/final_reel.mp4",
    "duration": 21.65,
    "dimensions": "720x1280",
    "sizeMB": 4.2,
    "timestamp": "2025-06-26T15:33:20Z"
  },
  "subtitles": {
    "srt": "1\n00:00:00,000 --> 00:00:02,500\nBreaking news today...",
    "wordTimings": [0.0, 0.5, 1.2, 2.1]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input parameters
- `500 Internal Server Error`: Video processing failed
- `503 Service Unavailable`: FFmpeg processing timeout

## Implementation Details

### Video Processing Features:
- Precise duration matching to voiceover
- Automatic aspect ratio correction (720x1280)
- Dynamic subtitle generation with timing
- Crossfade transitions between images
- Optimized for Cloud Run environment

### File Handling:
- Production: Uses `/tmp` directory (ephemeral storage)
- Development: Uses local `assets` directory
- Automatic cleanup of temporary files

## Troubleshooting
```bash
# Verify video duration:
ffprobe -i final_reel.mp4 -show_entries format=duration -v quiet -of csv="p=0"

# Check processing logs:
docker logs <container_id> | grep FFmpeg
```
