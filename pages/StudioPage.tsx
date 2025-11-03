// pages/StudioPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import AdGeneratorForm from '../components/AdGeneratorForm';
import AdPreview from '../components/AdPreview';
import HistoryPanel from '../components/HistoryPanel';
import InspirationGallery from '../components/InspirationGallery';
import ConceptLabModal from '../components/ConceptLabModal';
import StoryViewer from '../components/StoryViewer';
import JSZip from 'jszip';
import saveAs from 'file-saver';

import type { AdRequest, AdResult, TextStyle, VeoVideo } from '../types';
import { ERAS, TONES, VOICES, ASPECT_RATIOS } from '../constants';
import * as geminiService from '../services/geminiService';
import { useVeoApiKey } from '../hooks/useVeoApiKey';

const defaultRequest: AdRequest = {
    product: 'Starlight Soda',
    era: '1980s',
    tone: 'Nostalgic',
    aspectRatio: '16:9',
    visualType: 'video',
    voice: 'Puck',
    visualIdea: 'Teenagers at a retro arcade, sharing a can of Starlight Soda under neon lights.',
    notes: '',
};

const dataURLToBlob = (dataurl: string): Blob | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const StudioPage: React.FC = () => {
    const [formData, setFormData] = useState<AdRequest>(defaultRequest);
    const [ads, setAds] = useState<AdResult[]>([]);
    const [currentAd, setCurrentAd] = useState<AdResult | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isSparking, setIsSparking] = useState(false);
    
    const [isConceptLabOpen, setIsConceptLabOpen] = useState(false);
    const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
    const [activeStory, setActiveStory] = useState<AdResult[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const [storyContext, setStoryContext] = useState<AdResult | null>(null);

    const { isKeySelected, isChecking, selectKey, resetKeyState } = useVeoApiKey();
    const needsApiKey = formData.visualType === 'video' && !isKeySelected;
    
    // Load history from local storage
    useEffect(() => {
        try {
            const savedAds = localStorage.getItem('artie-ads-history');
            if (savedAds) {
                const parsedAds: AdResult[] = JSON.parse(savedAds).map((ad: any) => ({...ad, createdAt: new Date(ad.createdAt) }));
                setAds(parsedAds);
                if (parsedAds.length > 0) {
                     const sortedAds = parsedAds.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                     setCurrentAd(sortedAds[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load history from localStorage", error);
        }
    }, []);

    // Save history to local storage
    useEffect(() => {
        if (ads.length > 0) {
            try {
                localStorage.setItem('artie-ads-history', JSON.stringify(ads));
            } catch (error) {
                console.error("Failed to save history to localStorage", error);
            }
        }
    }, [ads]);
    
    const handleFormChange = (data: AdRequest) => {
        setFormData(data);
    };

    const handleAddScene = (ad: AdResult) => {
        const storyParent = ad.parentId ? ads.find(a => a.id === ad.parentId) : ad;
        if (!storyParent) {
            console.error("Could not find parent ad for story");
            return;
        }

        const storyScenes = ads.filter(a => a.id === storyParent.id || a.parentId === storyParent.id);
        const nextSceneNumber = storyScenes.length + 1;

        setStoryContext({ ...storyParent, sceneNumber: nextSceneNumber });

        setFormData({
            ...storyParent,
            visualIdea: '',
            notes: '',
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelAddScene = () => {
        setStoryContext(null);
        if(currentAd) {
             setFormData({
                 product: currentAd.product,
                 era: currentAd.era,
                 tone: currentAd.tone,
                 aspectRatio: currentAd.aspectRatio,
                 visualType: currentAd.visualType,
                 voice: currentAd.voice,
                 visualIdea: currentAd.visualIdea,
                 notes: currentAd.notes,
            });
        } else {
            setFormData(defaultRequest);
        }
    };

    const handleSubmit = async () => {
        if (needsApiKey) {
            selectKey();
            return;
        }

        setIsLoading(true);
        setCurrentAd(null);
        try {
            let script: string[];
            let previousVideo: VeoVideo | undefined;

            if (storyContext) {
                const storyScenes = ads
                    .filter(a => a.id === storyContext.id || a.parentId === storyContext.id)
                    .sort((a, b) => (a.sceneNumber || 0) - (b.sceneNumber || 0));
                
                const previousScripts = storyScenes.flatMap(s => s.script || []);
                const lastScene = storyScenes[storyScenes.length - 1];
                previousVideo = lastScene.veoVideo;

                if (!previousVideo) {
                    throw new Error("Cannot add a scene because the previous scene's video data is missing. Please regenerate the first scene.");
                }

                setLoadingMessage('Generating next scene script...');
                script = await geminiService.generateScript(formData, previousScripts);
            } else {
                setLoadingMessage('Generating script...');
                script = await geminiService.generateScript(formData);
            }

            setLoadingMessage(formData.visualType === 'image' ? 'Generating image...' : 'Generating video (this may take a minute)...');
            
            let visualUrl: string = '';
            let veoVideo: VeoVideo | undefined;

            if (formData.visualType === 'image') {
                visualUrl = `data:image/jpeg;base64,${await geminiService.generateImage(formData.visualIdea || '', formData.aspectRatio)}`;
            } else {
                const videoResult = await geminiService.generateVideo(formData.visualIdea || '', formData.aspectRatio, previousVideo);
                visualUrl = videoResult.visualUrl;
                veoVideo = videoResult.veoVideo;
            }

            let audioUrl = '';
            if (formData.visualType === 'video' && formData.voice && script.length > 0) {
                setLoadingMessage('Generating voiceover...');
                audioUrl = await geminiService.generateAudio(script.join(' '), formData.voice);
            }
            
            const newAd: AdResult = {
                id: `ad_${Date.now()}`,
                createdAt: new Date(),
                ...formData,
                script,
                visualUrl,
                veoVideo,
                audioUrl,
                textOverlays: script.map((line, index) => ({
                    id: `txt_${Date.now()}_${index}`,
                    text: line,
                    font: "'Bebas Neue', cursive",
                    size: 8,
                    color: '#FFFFFF',
                    position: { x: 50, y: 75 + index * 10 },
                    width: 80,
                })),
                parentId: storyContext ? (storyContext.parentId || storyContext.id) : undefined,
                sceneNumber: storyContext ? storyContext.sceneNumber : 1,
            };
            
            setAds(prev => [newAd, ...prev]);
            setCurrentAd(newAd);
            setStoryContext(null);

        } catch (error: any) {
            console.error("Ad generation failed:", error);
            alert(`An error occurred: ${error.message}`);
            if (error.message?.includes("Requested entity was not found")) {
                resetKeyState();
                alert("Your API key might be invalid. Please select a valid API key and try again.");
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleAskArtie = async () => {
        setIsSparking(true);
        try {
            const { product, visualIdea } = await geminiService.generateRandomIdea();
            setFormData(prev => ({ ...prev, product, visualIdea }));
        } catch (error: any) {
            alert(`Failed to get an idea from Artie: ${error.message}`);
        } finally {
            setIsSparking(false);
        }
    };

    const handleGenerateRandom = () => {
        const randomEra = ERAS[Math.floor(Math.random() * ERAS.length)];
        const randomTone = TONES[Math.floor(Math.random() * TONES.length)];
        const randomVoice = VOICES[Math.floor(Math.random() * VOICES.length)].value;
        const randomRatio = ASPECT_RATIOS[Math.floor(Math.random() * ASPECT_RATIOS.length)];
        setFormData(prev => ({ ...prev, era: randomEra, tone: randomTone, voice: randomVoice, aspectRatio: randomRatio }));
        handleAskArtie();
    };
    
    const handleUpdateAd = (updatedAd: Partial<AdResult>) => {
        if (!currentAd) return;
        const newCurrentAd = { ...currentAd, ...updatedAd };
        setCurrentAd(newCurrentAd);
        setAds(prevAds => prevAds.map(ad => ad.id === currentAd.id ? newCurrentAd : ad));
    };

    const handleSelectAd = (ad: AdResult) => {
        setCurrentAd(ad);
    };

    const handleDeleteAd = (adId: string) => {
        setAds(prev => prev.filter(ad => ad.parentId !== adId && ad.id !== adId));
        if (currentAd?.id === adId || currentAd?.parentId === adId) {
            const remainingAds = ads.filter(ad => ad.id !== adId && ad.parentId !== adId);
            setCurrentAd(remainingAds.length > 0 ? remainingAds[0] : null);
        }
    };

    const handleApplyConcept = ({ tone, visualIdea }: { tone: string, visualIdea: string }) => {
        setFormData(prev => ({...prev, tone, visualIdea}));
        setIsConceptLabOpen(false);
    };
    
    const handleViewStory = (ad: AdResult) => {
        const parentId = ad.parentId || ad.id;
        const storyAds = ads
            .filter(a => a.id === parentId || a.parentId === parentId)
            .sort((a,b) => (a.sceneNumber || 0) - (b.sceneNumber || 0));
        setActiveStory(storyAds);
        setIsStoryViewerOpen(true);
    };

    const handleDownloadStory = async (story: AdResult[]) => {
        if (story.length === 0) return;
        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            const zip = new JSZip();
            const totalFiles = story.reduce((acc, scene) => acc + (scene.visualUrl ? 1 : 0) + (scene.audioUrl ? 1 : 0), 0);
            let filesProcessed = 0;
            const videoFileNames: string[] = [];

            for (let i = 0; i < story.length; i++) {
                const scene = story[i];
                const sceneNum = i + 1;
                const fileNameBase = `scene_${sceneNum}`;

                if (scene.visualUrl) {
                    const blob = dataURLToBlob(scene.visualUrl);
                    if (blob) {
                        const extension = scene.visualType === 'image' ? 'jpg' : 'mp4';
                        const visualFileName = `${fileNameBase}_visual.${extension}`;
                        zip.file(visualFileName, blob);
                         if (scene.visualType === 'video') {
                            videoFileNames.push(visualFileName);
                        }
                    }
                    filesProcessed++;
                    setDownloadProgress((filesProcessed / totalFiles) * 100);
                    await new Promise(res => setTimeout(res, 50)); // Allow UI to update
                }

                if (scene.audioUrl) {
                    const blob = dataURLToBlob(scene.audioUrl);
                    if (blob) {
                        zip.file(`${fileNameBase}_audio.wav`, blob);
                    }
                    filesProcessed++;
                    setDownloadProgress((filesProcessed / totalFiles) * 100);
                    await new Promise(res => setTimeout(res, 50)); // Allow UI to update
                }
            }
            
            if (videoFileNames.length > 0) {
                 const playlistHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${story[0].product} Story</title>
    <style>
        body { background-color: #111827; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #e5e7eb; font-family: sans-serif; }
        video { max-width: 90%; max-height: 80vh; border: 1px solid #374151; border-radius: 8px; }
        .container { text-align: center; }
        h1 { font-size: 2em; margin-bottom: 1em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${story[0].product}</h1>
        <video id="player" controls autoplay playsinline>
            <p>Your browser doesn't support HTML video.</p>
        </video>
        <p id="scene-indicator" style="margin-top: 1em;"></p>
        <script>
            const videoPlaylist = ${JSON.stringify(videoFileNames)};
            let currentVideoIndex = 0;
            const videoPlayer = document.getElementById('player');
            const sceneIndicator = document.getElementById('scene-indicator');
            
            function playNextVideo() {
                if (currentVideoIndex < videoPlaylist.length) {
                    const currentFile = videoPlaylist[currentVideoIndex];
                    videoPlayer.src = currentFile;
                    videoPlayer.load();
                    videoPlayer.play().catch(e => console.error("Autoplay failed:", e));
                    sceneIndicator.textContent = 'Playing: Scene ' + (currentVideoIndex + 1) + ' of ' + videoPlaylist.length;
                } else {
                    sceneIndicator.textContent = 'Playlist finished.';
                }
            }
            
            videoPlayer.addEventListener('ended', () => {
                currentVideoIndex++;
                playNextVideo();
            });
            
            // Start the playlist
            playNextVideo();
        <\/script>
    </div>
</body>
</html>`;
                zip.file("play_story.html", playlistHtml);
            }

            setDownloadProgress(100);
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${story[0].product.replace(/\s+/g, '_')}_story.zip`);

        } catch (error) {
            console.error("Failed to create zip file for story", error);
            alert("An error occurred while preparing the download.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="container mx-auto p-4 flex-grow">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-1 space-y-6">
                    <AdGeneratorForm
                        formData={formData}
                        onFormChange={handleFormChange}
                        onSubmit={handleSubmit}
                        onAskArtie={handleAskArtie}
                        onGenerateRandom={handleGenerateRandom}
                        isLoading={isLoading}
                        isSparking={isSparking}
                        isConceptLabOpen={isConceptLabOpen}
                        onConceptLabToggle={() => setIsConceptLabOpen(true)}
                        needsApiKey={needsApiKey}
                        onSelectApiKey={selectKey}
                        storyContext={storyContext}
                        onCancelAddScene={handleCancelAddScene}
                    />
                </div>

                <div className="lg:col-span-2">
                    <AdPreview
                        ad={currentAd}
                        onUpdateAd={handleUpdateAd}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        onAddScene={handleAddScene}
                    />
                </div>
                
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <HistoryPanel
                        ads={ads}
                        onSelectAd={handleSelectAd}
                        onDeleteAd={handleDeleteAd}
                        currentAdId={currentAd?.id}
                        onViewStory={handleViewStory}
                    />
                    <InspirationGallery onSelectAd={handleSelectAd} />
                </div>
            </div>
            
            <ConceptLabModal
                isOpen={isConceptLabOpen}
                onClose={() => setIsConceptLabOpen(false)}
                onApplyConcept={handleApplyConcept}
                product={formData.product}
                notes={formData.notes || ''}
            />

            <StoryViewer
                story={activeStory}
                isOpen={isStoryViewerOpen}
                onClose={() => setIsStoryViewerOpen(false)}
                onDownloadStory={handleDownloadStory}
                isDownloading={isDownloading}
                downloadProgress={downloadProgress}
            />
        </main>
    );
};

export default StudioPage;