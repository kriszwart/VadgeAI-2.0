// types.ts

export type VisualType = 'image' | 'video';

export interface VeoVideo {
    uri: string;
    aspectRatio: string;
}

export interface AdRequest {
    product: string;
    era: string;
    tone: string;
    aspectRatio: string;
    visualType: VisualType;
    voice?: string;
    visualIdea?: string;
    notes?: string;
}

export interface TextStyle {
    id: string;
    text: string;
    font: string;
    size: number; // as a percentage of container height
    color: string;
    position: { x: number; y: number }; // as percentages
    width: number; // as a percentage of container width
}

export interface LogoOverlay {
    id: string;
    url: string; // data URL
    position: { x: number; y: number }; // as percentages of center
    size: number; // as a percentage of container width
}

export interface AdResult {
    id: string;
    product: string;
    era: string;
    tone: string;
    aspectRatio: string;
    visualType: VisualType;
    createdAt: Date;
    visualIdea?: string;
    script?: string[];
    voice?: string;
    visualUrl?: string;
    veoVideo?: VeoVideo;
    audioUrl?: string;
    textOverlays?: TextStyle[];
    logo?: LogoOverlay;
    parentId?: string;
    sceneNumber?: number;
}
