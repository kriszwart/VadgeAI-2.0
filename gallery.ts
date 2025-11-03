// gallery.ts
import type { AdResult } from './types';

export const galleryAds: AdResult[] = [
    {
        id: 'gallery-1',
        product: 'Starlight Soda',
        era: '1980s',
        tone: 'Nostalgic',
        visualIdea: 'Teenagers at a retro arcade, sharing a can of Starlight Soda under neon lights. Quick cuts, vibrant colors, and a synth-pop soundtrack.',
        aspectRatio: '16:9',
        script: [
            "Unlock a universe of flavor.",
            "Starlight Soda. It's cosmic!"
        ],
        voice: 'Puck',
        visualType: 'video',
        visualUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        textOverlays: [
            {
                id: 'g1-t1',
                text: 'Starlight Soda',
                font: "'Orbitron', sans-serif",
                size: 8,
                color: '#FF00FF',
                position: { x: 50, y: 85 },
                width: 80,
            }
        ],
        createdAt: new Date('2024-07-01T10:00:00Z'),
    },
    {
        id: 'gallery-2',
        product: 'Odyssey Watch',
        era: '2020s',
        tone: 'Sophisticated',
        visualIdea: 'Close-up shots of a sleek, minimalist watch on a person hiking a mountain at sunrise. The focus is on craftsmanship and adventure.',
        aspectRatio: '16:9',
        script: [
            "Your journey is timeless.",
            "Odyssey. Master your time."
        ],
        voice: 'Fenrir',
        visualType: 'video',
        visualUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        textOverlays: [
            {
                id: 'g2-t1',
                text: 'ODYSSEY',
                font: "'Lato', sans-serif",
                size: 7,
                color: '#FFFFFF',
                position: { x: 50, y: 15 },
                width: 60,
            }
        ],
        createdAt: new Date('2024-07-02T11:00:00Z'),
    },
    {
        id: 'gallery-3',
        product: 'Bloom Cereal',
        era: '1960s',
        tone: 'Wholesome',
        visualIdea: 'A happy family in a brightly lit kitchen enjoys breakfast. The mom serves Bloom Cereal to her smiling children. Bright, cheerful, and idyllic.',
        aspectRatio: '16:9',
        script: [
            "Start your day with a spoonful of sunshine!",
            "Bloom Cereal, part of a happy breakfast."
        ],
        voice: 'Zephyr',
        visualType: 'video',
        visualUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        textOverlays: [
            {
                id: 'g3-t1',
                text: 'Bloom!',
                font: "'Pacifico', cursive",
                size: 10,
                color: '#FFD700',
                position: { x: 50, y: 50 },
                width: 50,
            }
        ],
        createdAt: new Date('2024-07-03T12:00:00Z'),
    },
];