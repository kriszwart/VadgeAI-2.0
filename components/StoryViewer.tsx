// components/StoryViewer.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { AdResult } from '../types';
import { SpinnerIcon } from './icons';

interface StoryViewerProps {
    story: AdResult[];
    isOpen: boolean;
    onClose: () => void;
    onDownloadStory: (story: AdResult[]) => void;
    isDownloading: boolean;
    downloadProgress: number;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story, isOpen, onClose, onDownloadStory, isDownloading, downloadProgress }) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        setCurrentSceneIndex(0); // Reset to first scene when story changes
    }, [story]);

    const currentAd = story[currentSceneIndex];

    // This effect loads the media for the current scene
    useEffect(() => {
        const video = videoRef.current;
        if (video && currentAd) {
            video.src = currentAd.visualUrl || '';
            video.load();
            video.play().catch(e => console.error("Autoplay failed", e));
        }
        
        const audio = audioRef.current;
        if (audio && currentAd) {
            audio.src = currentAd.audioUrl || '';
            audio.load();
        }
    }, [currentAd]);
    
    // These effects sync audio playback to video controls
    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video || !audio || !currentAd?.audioUrl) return;

        const syncPlay = () => audio.play();
        const syncPause = () => audio.pause();
        const syncSeek = () => { audio.currentTime = video.currentTime; };

        video.addEventListener('play', syncPlay);
        video.addEventListener('pause', syncPause);
        video.addEventListener('seeking', syncSeek);

        return () => {
            video.removeEventListener('play', syncPlay);
            video.removeEventListener('pause', syncPause);
            video.removeEventListener('seeking', syncSeek);
        };
    }, [currentAd]);


    const handleVideoEnded = () => {
        if (currentSceneIndex < story.length - 1) {
            setCurrentSceneIndex(currentSceneIndex + 1);
        }
    };

    if (!isOpen || story.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-[fade-in-animation_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">{currentAd.product}</h2>
                        <p className="text-sm text-slate-400">Scene {currentSceneIndex + 1} of {story.length}</p>
                    </div>
                     <div>
                        {isDownloading ? (
                             <div className="flex items-center gap-3">
                                <div className="w-32 bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                                </div>
                                <span className="text-sm text-slate-300">{downloadProgress.toFixed(0)}%</span>
                            </div>
                        ) : (
                            <button onClick={() => onDownloadStory(story)} className="btn-primary text-sm">
                                Download Story
                            </button>
                        )}
                     </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-grow aspect-video bg-black rounded-lg relative">
                        <video ref={videoRef} onEnded={handleVideoEnded} controls className="w-full h-full" muted={!!currentAd.audioUrl}></video>
                        {currentAd.audioUrl && <audio ref={audioRef}></audio>}
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex-shrink-0">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {story.map((scene, index) => (
                                <div 
                                    key={scene.id} 
                                    onClick={() => setCurrentSceneIndex(index)}
                                    className={`w-32 flex-shrink-0 aspect-video rounded-md cursor-pointer overflow-hidden border-2 ${index === currentSceneIndex ? 'border-teal-400' : 'border-transparent hover:border-slate-600'}`}
                                >
                                    <video src={scene.visualUrl} className="w-full h-full object-cover pointer-events-none"></video>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="p-4 border-t border-slate-800 text-right">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                 </div>
            </div>
        </div>
    );
};

export default StoryViewer;