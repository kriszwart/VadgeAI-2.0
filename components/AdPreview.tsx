// components/AdPreview.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AdResult, TextStyle, LogoOverlay } from '../types';
import { SpinnerIcon, FilmIcon, DownloadIcon, PlusCircleIcon } from './icons';
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

const LogoToolbar: React.FC<{
    logo: LogoOverlay;
    onSizeChange: (size: number) => void;
    onDelete: () => void;
}> = ({ logo, onSizeChange, onDelete }) => {
    return (
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 backdrop-blur-sm flex items-center gap-4 animate-[fade-in-animation_0.2s_ease-out] relative w-full max-w-sm">
            <div className="flex-grow">
                <label className="text-xs text-slate-400 block mb-1">Logo Size ({logo.size.toFixed(0)}%)</label>
                <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={logo.size}
                    onChange={e => onSizeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <button onClick={onDelete} className="bg-red-500/20 hover:bg-red-500/50 text-red-400 font-bold px-3 py-2 rounded-lg transition-colors h-10 text-sm">
                 Delete
            </button>
        </div>
    );
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

const AdPreview: React.FC<AdPreviewProps> = ({ ad, onUpdateAd, isLoading, loadingMessage, onAddScene }) => {
    const [activeTextId, setActiveTextId] = useState<string | null>(null);
    const [activeLogoId, setActiveLogoId] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const draggingState = useRef<{ id: string; type: 'text' | 'logo'; offsetX: number; offsetY: number } | null>(null);

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

    const handleUpdateLogo = (updatedLogo: Partial<LogoOverlay>) => {
        if (!ad?.logo) return;
        onUpdateAd({ logo: { ...ad.logo, ...updatedLogo }});
    };

    const handleDeleteLogo = () => {
        onUpdateAd({ logo: undefined });
        setActiveLogoId(null);
    }

    const handleAlignCenter = () => {
        if (!activeStyle) return;
        handleStyleChange({ position: { ...activeStyle.position, x: 50 } });
    }

    const handleTextMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        setActiveTextId(id);
        setActiveLogoId(null);
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        draggingState.current = {
            id,
            type: 'text',
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleLogoMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        setActiveLogoId(id);
        setActiveTextId(null);
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        draggingState.current = {
            id,
            type: 'logo',
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingState.current || !containerRef.current || !ad) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        
        if (draggingState.current.type === 'text') {
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
        } else if (draggingState.current.type === 'logo') {
            const targetRect = (e.target as HTMLElement).closest('.draggable-logo')?.getBoundingClientRect();
            if (!targetRect) return;
            
            const x = e.clientX - containerRect.left - draggingState.current.offsetX;
            const y = e.clientY - containerRect.top - draggingState.current.offsetY;
            
            const xPercent = ((x + targetRect.width / 2) / containerRect.width) * 100;
            const yPercent = ((y + targetRect.height / 2) / containerRect.height) * 100;

            if (ad.logo) {
                onUpdateAd({ logo: { ...ad.logo, position: { x: xPercent, y: yPercent } } });
            }
        }
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
    
    const handleAddLogoClick = () => {
        logoInputRef.current?.click();
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && ad) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const newLogo: LogoOverlay = {
                    id: `logo_${Date.now()}`,
                    url: event.target?.result as string,
                    position: { x: 50, y: 15 },
                    size: 20, // percentage of container width
                };
                onUpdateAd({ logo: newLogo });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const renderAdToCanvas = async (ad: AdResult): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx || !ad.visualUrl) {
                resolve(null);
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = ad.visualUrl;

            img.onload = async () => {
                const maxWidth = 1920;
                const [widthRatio, heightRatio] = ad.aspectRatio.split(':').map(Number);
                canvas.width = maxWidth;
                canvas.height = (maxWidth * heightRatio) / widthRatio;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                if (ad.textOverlays) {
                    const fonts = [...new Set(ad.textOverlays.map(t => t.font))];
                    try {
                        await Promise.all(fonts.map(font => document.fonts.load(`12px ${font}`)));
                    } catch(e) {
                        console.warn('Some fonts could not be loaded for canvas rendering.', e);
                    }

                    for (const textStyle of ad.textOverlays) {
                        const fontSize = (textStyle.size / 100) * canvas.height;
                        ctx.font = `${fontSize}px ${textStyle.font}`;
                        ctx.fillStyle = textStyle.color;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.shadowColor = "rgba(0,0,0,0.5)";
                        ctx.shadowBlur = 3;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;

                        const textDivX = (textStyle.position.x / 100) * canvas.width;
                        const textDivY = (textStyle.position.y / 100) * canvas.height;
                        const textWidth = (textStyle.width / 100) * canvas.width;
                        
                        const lines = textStyle.text.split('\n');
                        let currentY = textDivY;

                        for (const lineText of lines) {
                            let words = lineText.split(' ');
                            let line = '';
                            for (let n = 0; n < words.length; n++) {
                                let testLine = line + words[n] + ' ';
                                if (ctx.measureText(testLine).width > textWidth && n > 0) {
                                    ctx.fillText(line, textDivX, currentY);
                                    line = words[n] + ' ';
                                    currentY += fontSize * 1.2;
                                } else {
                                    line = testLine;
                                }
                            }
                            ctx.fillText(line, textDivX, currentY);
                            currentY += fontSize * 1.2;
                        }
                    }
                }

                // Reset shadow for logo
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                if (ad.logo) {
                    const logoImg = new Image();
                    logoImg.crossOrigin = 'anonymous';
                    logoImg.src = ad.logo.url;
                    logoImg.onload = () => {
                        const logoWidth = (ad.logo.size / 100) * canvas.width;
                        const logoHeight = logoWidth / (logoImg.width / logoImg.height);
                        const x = (ad.logo.position.x / 100) * canvas.width - logoWidth / 2;
                        const y = (ad.logo.position.y / 100) * canvas.height - logoHeight / 2;
                        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
                        canvas.toBlob(resolve, 'image/jpeg', 0.95);
                    };
                    logoImg.onerror = () => canvas.toBlob(resolve, 'image/jpeg', 0.95);
                } else {
                    canvas.toBlob(resolve, 'image/jpeg', 0.95);
                }
            };
            img.onerror = () => resolve(null);
        });
    };

    const handleDownload = async () => {
        if (!ad || !ad.visualUrl) return;

        if (ad.visualType === 'image') {
            const blob = await renderAdToCanvas(ad);
            if (blob) {
                saveAs(blob, `${ad.product.replace(/\s+/g, '_')}.jpg`);
            } else {
                alert('Failed to generate downloadable image.');
            }
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
                    <div ref={containerRef} onClick={() => { setActiveTextId(null); setActiveLogoId(null); }} className="w-full relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: ad.aspectRatio.replace(':', ' / ') }}>
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
                                onMouseDown={(e) => { e.stopPropagation(); handleTextMouseDown(e, style.id); }}
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
                        
                        {ad.logo && (
                            <div
                                key={ad.logo.id}
                                onMouseDown={(e) => { e.stopPropagation(); handleLogoMouseDown(e, ad.logo.id); }}
                                className={`draggable-logo absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab p-1 ${activeLogoId === ad.logo.id ? 'border-2 border-dashed border-teal-400' : 'border-2 border-transparent hover:border-white/20'}`}
                                style={{
                                    left: `${ad.logo.position.x}%`,
                                    top: `${ad.logo.position.y}%`,
                                    width: `${ad.logo.size}%`,
                                }}
                            >
                                <img src={ad.logo.url} alt="Uploaded logo" className="w-full h-full object-contain pointer-events-none" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <p>Your generated ad will appear here.</p>
                        <p className="text-sm">Fill out the form to get started.</p>
                    </div>
                )}
            </div>
            <div className="mt-4 h-28 flex items-center justify-center">
                 {activeLogoId && ad?.logo ? (
                    <LogoToolbar 
                        logo={ad.logo}
                        onSizeChange={(size) => handleUpdateLogo({ size })}
                        onDelete={handleDeleteLogo}
                    />
                ) : activeStyle ? (
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
                         <button onClick={handleAddLogoClick} className="btn-secondary flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" />
                            Add Logo
                         </button>
                         <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml" className="hidden" />
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
