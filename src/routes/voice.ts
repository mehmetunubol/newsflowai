import { Request, Response, Router } from 'express';
import { generateVoice } from '../services/generateVoice';

const router = Router();

interface VoiceRequest {
    script: string;
}

router.post('/', async (req: Request, res: Response) => {
    try {
        const { script } = req.body as VoiceRequest;
        
        if (!script) {
            return res.status(400).json({ error: 'Script is required' });
        }

        const { voicePath, voiceId } = await generateVoice(script);
        return res.json({ 
            voicePath,
            voiceId 
        });
    } catch (error) {
        console.error('Error generating voice:', error);
        return res.status(500).json({ error: 'Failed to generate voice' });
    }
});

export default router;
