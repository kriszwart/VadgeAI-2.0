// services/geminiService.ts
import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { AdRequest, VeoVideo } from '../types';

// Per guidelines, create a new instance before making an API call to ensure it always uses the most up-to-date API key from the dialog.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const MAX_RETRIES = 3;

// Helper for retries
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            console.error(`Attempt ${i + 1} failed. Retrying...`, e);
            await new Promise(res => setTimeout(res, 1000 * (i + 1)));
        }
    }
    throw lastError;
}

export const brainstormConcepts = async (product: string, notes?: string) => {
    return withRetry(async () => {
        const ai = getAI();
        const prompt = `Brainstorm 3 distinct, creative ad concepts for a product called "${product}". 
For each concept, provide a catchy headline, a short tagline, a suggested tone (choose from this list: Wholesome, Edgy, Nostalgic, Sophisticated, Humorous, Dramatic, Minimalist, Surreal), and a compelling visual idea.
${notes ? `Keep these notes in mind: "${notes}"` : ''}
Return the concepts as a JSON array.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            headline: { type: Type.STRING },
                            tagline: { type: Type.STRING },
                            tone: { type: Type.STRING },
                            visualIdea: { type: Type.STRING },
                        },
                        required: ['headline', 'tagline', 'tone', 'visualIdea'],
                    },
                },
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    });
};

export const generateRandomIdea = async () => {
     return withRetry(async () => {
        const ai = getAI();
        const prompt = `Generate a single, fun, and slightly absurd product name and a one-sentence visual idea for a fictional ad.
Return the result as a JSON object with keys "product" and "visualIdea".`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        product: { type: Type.STRING },
                        visualIdea: { type: Type.STRING },
                    },
                    required: ['product', 'visualIdea'],
                },
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    });
};


export const generateScript = async (request: AdRequest, previousScript?: string[]): Promise<string[]> => {
     return withRetry(async () => {
        const ai = getAI();
        const { product, era, tone, visualIdea, visualType, notes } = request;
        
        const contextPrompt = previousScript && previousScript.length > 0
            ? `This is a multi-part ad. The script for the previous scene(s) was: "${previousScript.join(' ')}". Continue the story seamlessly.`
            : '';

        const prompt = `Write a short, punchy ad script for a ${visualType} ad for a product called "${product}".
The ad should evoke the style of the ${era}.
The tone should be ${tone}.
${contextPrompt}
The core visual idea for THIS SCENE is: "${visualIdea}".
${notes ? `Additional notes for this scene: "${notes}"` : ''}
The script should be concise, ideally 1-2 lines for this specific scene. Return the script as a JSON array of strings.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    });
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
     return withRetry(async () => {
        const ai = getAI();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
                outputMimeType: 'image/jpeg',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Image generation failed.");
        }
        return response.generatedImages[0].image.imageBytes;
    });
};

export const generateVideo = async (prompt: string, aspectRatio: string, previousVideo?: VeoVideo): Promise<{ visualUrl: string; veoVideo: VeoVideo }> => {
    return withRetry(async () => {
        const ai = getAI();
        
        let operation;

        if (previousVideo) {
            // Extending an existing video
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-generate-preview',
                prompt: prompt,
                video: previousVideo,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as '16:9' | '9:16',
                }
            });
        } else {
             // Generating a new, first scene video
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as '16:9' | '9:16',
                }
            });
        }


        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const generatedVideo = operation.response?.generatedVideos?.[0]?.video;
        if (!generatedVideo?.uri) {
            throw new Error("Video generation failed or returned no URI.");
        }
        
        const downloadLink = generatedVideo.uri;
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            console.error("Video download failed:", errorBody);
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const blob = await videoResponse.blob();
        const visualUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        
        const veoVideoResult: VeoVideo = {
            uri: generatedVideo.uri,
            aspectRatio: generatedVideo.aspectRatio,
        };

        return { visualUrl, veoVideo: veoVideoResult };
    });
};

export const generateAudio = async (script: string, voice: string): Promise<string> => {
     return withRetry(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("Audio generation failed.");
        }
        return `data:audio/wav;base64,${base64Audio}`;
    });
};