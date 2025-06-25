import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const existsAsync = promisify(fs.exists);

async function getAudioDuration(filePath: string): Promise<number> {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${filePath}`
        );
        return parseFloat(stdout.trim());
    } catch (error) {
        console.error('Error getting audio duration:', error);
        throw new Error('Failed to get audio duration');
    }
}

interface VideoResult {
    buffer: Buffer;
    contentType: string;
    originalPath: string;
}

export async function createVideo(
    voiceoverPath: string,
    visualsPaths: string[],
    subtitlesPath: string
): Promise<VideoResult> {
    try {
        // Use /tmp in production (Cloud Run), local assets folder in development
        const isProduction = process.env.NODE_ENV === 'production';
        const outputDir = isProduction ? '/tmp' : path.join(__dirname, '../../assets');
        
        // Ensure directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, 'final_reel.mp4');
        const fontConfig = `:force_style=\'FontName=Roboto,FontSize=12,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3\'`;

        // Handle video case (single MP4 file)
        if (visualsPaths.length === 1 && visualsPaths[0].endsWith('.mp4')) {
            const ffmpegCommand = `ffmpeg -loglevel warning -y -i ${visualsPaths[0]} -i ${voiceoverPath} ` +
                `-vf "subtitles=${subtitlesPath}${fontConfig},` +
                `scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,` +
                `setsar=1:1" ` +
                `-c:v libx264 -c:a aac -strict experimental ` +
                `-shortest -pix_fmt yuv420p ${outputPath}`;
                
            await execAsync(ffmpegCommand);
        } 
        // Handle images case (multiple images)
        else {
            // Get voiceover duration
            const { stdout: durationOutput } = await execAsync(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${voiceoverPath}`
            );
            const totalDuration = parseFloat(durationOutput.trim());
            const imageDuration = totalDuration / visualsPaths.length;

            // Build input and filter complex strings
            let inputs = '';
            let filters = '';
            visualsPaths.forEach((path, index) => {
                inputs += `-loop 1 -t ${imageDuration} -i ${path} `;
                filters += `[${index}:v]scale=720:1280:force_original_aspect_ratio=decrease,` +
                          `pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,` +
                          `setsar=1:1,format=yuv420p[v${index}];`;
            });

            // Build concat filter and add subtitles
            filters += visualsPaths.map((_, i) => `[v${i}]`).join('') + 
                      `concat=n=${visualsPaths.length}:v=1:a=0[v];` +
                      `[v]subtitles=${subtitlesPath}${fontConfig}[outv]`;

            const ffmpegCommand = `ffmpeg -loglevel warning -y ${inputs}-i ${voiceoverPath} ` +
                `-filter_complex "${filters}" ` +
                `-map "[outv]" -map ${visualsPaths.length}:a ` +
                `-c:v libx264 -preset fast -crf 22 ` +
                `-c:a aac -b:a 192k ` +
                `-movflags +faststart ${outputPath}`;

            await execAsync(ffmpegCommand);
        }
        
        if (!await existsAsync(outputPath)) {
            throw new Error('FFmpeg failed to create output file');
        }

        // Read the video file into memory
        const videoBuffer = await fs.promises.readFile(outputPath);
        
        // Clean up temp file in production
        if (isProduction) {
            await fs.promises.unlink(outputPath).catch(console.error);
        }

        return {
            buffer: videoBuffer,
            contentType: 'video/mp4',
            originalPath: outputPath
        };
    } catch (error) {
        console.error('Error creating video:', error);
        throw new Error('Failed to create video');
    }
}