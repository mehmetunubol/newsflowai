import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const writeFile = promisify(fs.writeFile);

export async function generateSubtitles(script: string, voiceoverPath: string): Promise<string> {
    try {
        // Get total duration and word timings
        const { duration, wordTimings } = await analyzeAudio(voiceoverPath, script);
        
        // Generate segmented subtitles with word-level timing
        const subtitlesContent = generateSegmentedSubtitles(script, duration, wordTimings);

        // Use /tmp in production (Cloud Run), local assets folder in development
        const isProduction = process.env.NODE_ENV === 'production';
        const outputDir = isProduction ? '/tmp' : path.join(__dirname, '../../assets');
        
        // Ensure directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const subtitlesPath = path.join(outputDir, 'subtitles.srt');
        await writeFile(subtitlesPath, subtitlesContent);
        return subtitlesPath;
    } catch (error) {
        console.error('Error generating subtitles:', error);
        throw new Error('Failed to generate subtitles');
    }
}

async function analyzeAudio(filePath: string, script: string): Promise<{ duration: number, wordTimings: number[] }> {
    return new Promise((resolve, reject) => {
        // First get total duration
        exec(`ffprobe -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`, 
            { maxBuffer: 1024 * 1024 * 5 },
            (durationError, durationOutput, durationStderr) => {
                if (durationError) return reject(durationError);
                
                const duration = parseFloat(durationOutput.trim());
                if (isNaN(duration)) return reject(new Error('Invalid duration'));
                
                // Estimate word timings (simplified - would use speech-to-text API for precise timing)
                const wordCount = script.split(/\s+/).length;
                const avgWordDuration = duration / wordCount;
                const wordTimings = Array.from({length: wordCount}, (_, i) => avgWordDuration * (i + 1));
                
                resolve({ duration, wordTimings });
            }
        );
    });
}

function generateSegmentedSubtitles(script: string, duration: number, wordTimings: number[]): string {
    const sentences = splitIntoSentences(script);
    const words = script.split(/\s+/);
    let srtContent = '';
    let segmentNumber = 1;
    let currentWordIndex = 0;

    for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/);
        const sentenceWordCount = sentenceWords.length;
        const startTime = currentWordIndex < wordTimings.length 
            ? wordTimings[currentWordIndex] - (wordTimings[1] - wordTimings[0]) 
            : 0;
        const endTime = currentWordIndex + sentenceWordCount < wordTimings.length 
            ? wordTimings[currentWordIndex + sentenceWordCount - 1]
            : duration;

        // Karaoke-style word highlights
        let highlightedSentence = '';
        
        for (let i = 0; i < sentenceWords.length; i++) {
            const wordIdx = currentWordIndex + i;
            const wordStart = wordIdx < wordTimings.length 
                ? wordTimings[wordIdx] - (wordTimings[1] - wordTimings[0])
                : 0;
            const wordEnd = wordIdx < wordTimings.length 
                ? wordTimings[wordIdx]
                : duration;
            
            const durationMs = Math.round((wordEnd - wordStart) * 1000);
            highlightedSentence += `{\\kf${durationMs}}${sentenceWords[i]} `;
        }

        srtContent += `${segmentNumber++}\n` +
                     `${formatTime(startTime)} --> ${formatTime(endTime)}\n` +
                     `${highlightedSentence.trim()}\n\n`;

        currentWordIndex += sentenceWordCount;
    }

    return srtContent.trim();
}

function splitIntoSentences(text: string): string[] {
    // Split by common punctuation while keeping the delimiters
    return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(3).replace('.', ',');
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs}`;
}
