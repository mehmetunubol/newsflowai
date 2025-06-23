import { Request, Response, Router } from 'express';
import { createVideo } from '../services/createVideo';
import { generateSubtitles } from '../services/generateSubtitles';

const router = Router();

interface ComposeRequest {
  voicePath: string;
  visualsPaths: string[];
  script: string;
}

const composeVideoHandler = async (req: Request<{}, {}, ComposeRequest>, res: Response) => {
  try {
    const { voicePath, visualsPaths, script } = req.body;
    if (!voicePath || !visualsPaths?.length || !script) {
      res.status(400).json({ error: 'voicePath, visualsPaths (array) and script are required' });
      return;
    }
    const subtitlesPath = await generateSubtitles(script, voicePath);
    const videoUrl = await createVideo(voicePath, visualsPaths, subtitlesPath);
    res.json({ videoUrl });
  } catch (error) {
    console.error('Error composing video:', error);
    res.status(500).json({ error: 'Failed to compose video' });
  }
};

router.post('/compose', composeVideoHandler);

export default router;
