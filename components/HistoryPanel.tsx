// components/HistoryPanel.tsx
import React from 'react';
import type { AdResult } from '../types';
import { PhotoIcon, VideoCameraIcon } from './icons';

interface HistoryPanelProps {
    ads: AdResult[];
    onSelectAd: (ad: AdResult) => void;
    onDeleteAd: (adId: string) => void;
    currentAdId?: string;
    onViewStory: (ad: AdResult) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ ads, onSelectAd, onDeleteAd, currentAdId, onViewStory }) => {
    const parentAds = ads.filter(ad => !ad.parentId);
    const adStories: { [key: string]: AdResult[] } = {};

    parentAds.forEach(parent => {
        adStories[parent.id] = [parent, ...ads.filter(ad => ad.parentId === parent.id).sort((a, b) => (a.sceneNumber || 0) - (b.sceneNumber || 0))];
    });

    const reversedParentAds = [...parentAds].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold mb-3 text-white">Project History</h3>
            {reversedParentAds.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-center text-sm text-slate-500">
                    <p>Your generated ads will appear here.</p>
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                    {reversedParentAds.map(ad => {
                        const story = adStories[ad.id];
                        const isSelected = story.some(scene => scene.id === currentAdId);
                        return (
                            <div key={ad.id} className={`bg-slate-800/50 rounded-lg p-3 border-2 transition-colors ${isSelected ? 'border-teal-500' : 'border-transparent'}`}>
                                <div className="flex items-start gap-3">
                                    <button onClick={() => onSelectAd(ad)} className="w-20 h-12 bg-black rounded flex-shrink-0 overflow-hidden">
                                        {ad.visualType === 'image' ? (
                                            <img src={ad.visualUrl} alt={ad.product} className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={ad.visualUrl} className="w-full h-full object-cover" />
                                        )}
                                    </button>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-bold text-sm text-white truncate">{ad.product}</p>
                                        <p className="text-xs text-slate-400 truncate">{ad.era} - {ad.tone}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                            {ad.visualType === 'image' ? <PhotoIcon className="w-3 h-3" /> : <VideoCameraIcon className="w-3 h-3" />}
                                            <span>{ad.visualType === 'video' && story.length > 1 ? `${story.length} scenes` : ad.visualType}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onDeleteAd(ad.id)} className="text-slate-500 hover:text-red-500 text-lg leading-none flex-shrink-0">&times;</button>
                                </div>
                                {story.length > 1 && (
                                    <button onClick={() => onViewStory(ad)} className="text-xs text-teal-400 hover:underline mt-2 font-semibold">View Full Story</button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;
