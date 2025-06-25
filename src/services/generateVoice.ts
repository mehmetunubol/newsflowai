import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Voice } from '../models/Voice';
import type { IVoice } from '../models/Voice';

interface VoiceResponse {
    voicePath: string;
    voiceId: string;
}

export async function generateVoice(script: string): Promise<VoiceResponse> {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY environment variable not set');
    }

    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                text: script,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            {
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );

        const tempDir = path.join('/tmp', 'newsflowai-voice');
        fs.mkdirSync(tempDir, { recursive: true });
        
        const voicePath = path.join(tempDir, `${uuidv4()}.mp3`);
        fs.writeFileSync(voicePath, response.data);

        const voice = await Voice.create({
            script,
            audioPath: voicePath,
            audioData: response.data
        });

        return { 
            voicePath,
            voiceId: voice._id?.toString() || ''
        };
    } catch (error) {
        console.error('Error generating voice:', error);
        throw new Error('Failed to generate voice');
    }
}
