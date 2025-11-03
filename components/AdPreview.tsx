// components/AdPreview.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AdResult, TextStyle } from '../types';
import { SpinnerIcon, FilmIcon, DownloadIcon } from './icons';
import DesignToolbar from './DesignToolbar';
import { AVAILABLE_FONTS } from '../constants';
import saveAs from 'file-saver';
import JSZip from 'jszip';

interface AdPreviewProps {
    ad: AdResult | null;
    onUpdateAd: (updatedAd: Partial<AdResult>) => void;
    isLoading: boolean;
    loadingMessage: string;
    onAddScene: (ad: AdResult) => void;
}

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

const AdPreview: React.FC<AdPreviewProps> = ({ ad, onUpdateAd, isLoading, loadingMessage, onAddScene }) => {
    const [activeTextId, setActiveTextId] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

    const activeStyle = ad?.textOverlays?.find(t => t.id === activeTextId);

    // Load media when ad changes
    useEffect(() => {
        if (ad?.visualType === 'video' && videoRef.current) {
            videoRef.current.src = ad.visualUrl || '';
            videoRef.current.load();
        }
        if (ad?.audioUrl && audioRef.current) {
            audioRef.current.src = ad.audioUrl || '';
            audioRef.current.load();
        }
    }, [ad]);

    // Sync external audio to video playback
    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video || !audio || !ad?.audioUrl) return;

        const syncPlay = () => audio.play().catch(e => console.error("Audio sync play failed", e));
        const syncPause = () => audio.pause();
        const syncSeek = () => {
            if (Math.abs(audio.currentTime - video.currentTime) > 0.3) {
                audio.currentTime = video.currentTime;
            }
        };

        video.addEventListener('play', syncPlay);
        video.addEventListener('pause', syncPause);
        video.addEventListener('seeking', syncSeek);

        return () => {
            video.removeEventListener('play', syncPlay);
            video.removeEventListener('pause', syncPause);
            video.removeEventListener('seeking', syncSeek);
        };
    }, [ad?.audioUrl]);

    const handleStyleChange = (newStyle: Partial<TextStyle>) => {
        if (!ad || !activeTextId) return;
        const updatedOverlays = ad.textOverlays?.map(t =>
            t.id === activeTextId ? { ...t, ...newStyle } : t
        );
        onUpdateAd({ textOverlays: updatedOverlays });
    };

    const handleAlignCenter = () => {
        if (!activeStyle) return;
        handleStyleChange({ position: { ...activeStyle.position, x: 50 } });
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        setActiveTextId(id);
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        draggingState.current = {
            id,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingState.current || !containerRef.current || !ad) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const targetRect = (e.target as HTMLElement).closest('.draggable-text')?.getBoundingClientRect();

        if (!targetRect) return;

        const x = e.clientX - containerRect.left - draggingState.current.offsetX;
        const y = e.clientY - containerRect.top - draggingState.current.offsetY;

        const xPercent = ((x + targetRect.width / 2) / containerRect.width) * 100;
        const yPercent = (y / containerRect.height) * 100;

        const updatedOverlays = ad.textOverlays?.map(t =>
            t.id === draggingState.current?.id ? { ...t, position: { x: xPercent, y: yPercent } } : t
        );
        onUpdateAd({ textOverlays: updatedOverlays });
    }, [ad, onUpdateAd]);

    const handleMouseUp = useCallback(() => {
        draggingState.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);
    
    useEffect(() => {
        return () => { // Cleanup listeners on unmount
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleDownload = async () => {
        if (!ad || !ad.visualUrl) return;

        if (ad.visualType === 'image') {
            saveAs(ad.visualUrl, `${ad.product.replace(/\s+/g, '_')}.jpg`);
        } else {
            try {
                const zip = new JSZip();
                const visualBlob = dataURLToBlob(ad.visualUrl);
                if (visualBlob) {
                    zip.file(`${ad.product.replace(/\s+/g, '_')}_video.mp4`, visualBlob);
                }

                if (ad.audioUrl) {
                    const audioBlob = dataURLToBlob(ad.audioUrl);
                    if (audioBlob) {
                        zip.file(`${ad.product.replace(/\s+/g, '_')}_audio.wav`, audioBlob);
                    }
                }
                
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, `${ad.product.replace(/\s+/g, '_')}.zip`);

            } catch (error) {
                console.error("Failed to create zip for ad", error);
                alert("Failed to prepare download.");
            }
        }
    };


    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full">
            <div className="w-full flex-grow flex items-center justify-center">
                {isLoading ? (
                    <div className="text-center">
                        <SpinnerIcon className="w-12 h-12 text-teal-500 animate-spin mx-auto" />
                        <p className="mt-4 text-slate-400">{loadingMessage || 'Generating your ad...'}</p>
                    </div>
                ) : ad ? (
                    <div ref={containerRef} onClick={() => setActiveTextId(null)} className="w-full relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: ad.aspectRatio.replace(':', ' / ') }}>
                        {ad.visualType === 'image' && <img src={ad.visualUrl} alt={ad.product} className="w-full h-full object-cover" />}
                        {ad.visualType === 'video' && (
                            <>
                                <video ref={videoRef} className="w-full h-full object-cover" controls muted={!!ad.audioUrl} />
                                {ad.audioUrl && <audio ref={audioRef} src={ad.audioUrl} />}
                            </>
                        )}

                        {ad.textOverlays?.map(style => (
                            <div
                                key={style.id}
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, style.id); }}
                                className={`draggable-text absolute transform -translate-x-1/2 cursor-grab p-2 ${activeTextId === style.id ? 'border-2 border-dashed border-teal-400' : 'border-2 border-transparent hover:border-white/20'}`}
                                style={{
                                    left: `${style.position.x}%`,
                                    top: `${style.position.y}%`,
                                    width: `${style.width}%`,
                                }}
                            >
                                <span style={{ fontFamily: style.font, fontSize: `${style.size}vh`, color: style.color, textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }} className="text-center block whitespace-pre-wrap leading-tight pointer-events-none">
                                    {style.text}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <p>Your generated ad will appear here.</p>
                        <p className="text-sm">Fill out the form to get started.</p>
                    </div>
                )}
            </div>
            <div className="mt-4 h-28 flex items-center justify-center">
                 {activeStyle ? (
                    <DesignToolbar
                        style={activeStyle}
                        onStyleChange={handleStyleChange}
                        onAlignCenter={handleAlignCenter}
                        availableFonts={AVAILABLE_FONTS}
                        onClearActive={() => setActiveTextId(null)}
                    />
                ) : ad && !isLoading ? (
                    <div className="flex items-center gap-4 animate-[fade-in-animation_0.2s_ease-out]">
                         {ad.visualType === 'video' && (
                             <button onClick={() => onAddScene(ad)} className="btn-secondary flex items-center gap-2">
                                 <FilmIcon className="w-5 h-5" />
                                 Add Next Scene
                             </button>
                         )}
                         <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
                             <DownloadIcon className="w-5 h-5" />
                             Download Ad
                         </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default AdPreview;