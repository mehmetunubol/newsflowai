import { Request, Response, Router } from 'express';
import { createVideo } from '../services/createVideo';
import { generateSubtitles } from '../services/generateSubtitles';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface ComposeRequest {
  voiceUrl: string;
  visualsUrls: string[];
  script: string;
}

async function downloadFile(url: string, outputPath: string) {
  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream'
    });
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    return new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    throw error;
  }
}

const composeVideoHandler = async (req: Request<{}, {}, ComposeRequest>, res: Response) => {
  const tempDir = path.join('/tmp', 'newsflowai-temp', uuidv4());
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const { voiceUrl, visualsUrls, script } = req.body;
    if (!voiceUrl || !visualsUrls?.length || !script) {
      res.status(400).json({ error: 'voiceUrl, visualsUrls (array) and script are required' });
      return;
    }

    // Download files
    const voicePath = path.join(tempDir, 'voice.mp3');
    await downloadFile(voiceUrl, voicePath);

    const visualsPaths = await Promise.all(
      visualsUrls.map(async (url, i) => {
        const visualPath = path.join(tempDir, `visual-${i}.png`);
        await downloadFile(url, visualPath);
        return visualPath;
      })
    );

    const subtitlesPath = await generateSubtitles(script, voicePath);
    const videoUrl = await createVideo(voicePath, visualsPaths, subtitlesPath);
    res.json({ videoUrl });
  } catch (error) {
    console.error('Error composing video:', error);
    res.status(500).json({ error: 'Failed to compose video' });
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
};

router.post('/compose', composeVideoHandler);

export default router;
