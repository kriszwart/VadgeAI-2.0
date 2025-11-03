// components/InspirationGallery.tsx
import React from 'react';
import { galleryAds } from '../gallery';
import type { AdResult } from '../types';

interface InspirationGalleryProps {
    onSelectAd: (ad: AdResult) => void;
}

const InspirationGallery: React.FC<InspirationGalleryProps> = ({ onSelectAd }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 text-white">Inspiration Gallery</h3>
            <div className="grid grid-cols-3 gap-3">
                {galleryAds.map(ad => (
                    <button 
                        key={ad.id} 
                        onClick={() => onSelectAd(ad)}
                        className="aspect-video bg-black rounded-md overflow-hidden group relative"
                        title={`Load "${ad.product}" example`}
                    >
                        <video src={ad.visualUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                            <p className="text-xs text-white font-bold truncate">{ad.product}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default InspirationGallery;
