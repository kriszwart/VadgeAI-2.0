// components/AdGeneratorForm.tsx
import React from 'react';
import type { AdRequest, AdResult } from '../types';
import { ERAS, TONES, VOICES, ASPECT_RATIOS } from '../constants';
import { SparklesIcon, DiceIcon, LightbulbIcon, PhotoIcon, VideoCameraIcon, SpinnerIcon } from './icons';

interface AdGeneratorFormProps {
    formData: AdRequest;
    onFormChange: (data: AdRequest) => void;
    onSubmit: () => void;
    onAskArtie: () => void;
    onGenerateRandom: () => void;
    isLoading: boolean;
    isSparking: boolean;
    isConceptLabOpen: boolean;
    onConceptLabToggle: () => void;
    needsApiKey: boolean;
    onSelectApiKey: () => void;
    storyContext: AdResult | null;
    onCancelAddScene: () => void;
}

const AdGeneratorForm: React.FC<AdGeneratorFormProps> = ({
    formData,
    onFormChange,
    onSubmit,
    onAskArtie,
    onGenerateRandom,
    isLoading,
    isSparking,
    isConceptLabOpen,
    onConceptLabToggle,
    needsApiKey,
    onSelectApiKey,
    storyContext,
    onCancelAddScene,
}) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        onFormChange({ ...formData, [e.target.name]: e.target.value });
    };

    const setVisualType = (type: 'image' | 'video') => {
        onFormChange({ ...formData, visualType: type });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    const labelClass = "text-sm font-medium text-slate-400 mb-1 block";
    const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition";
    const btnPrimaryClass = "w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center";
    const btnSecondaryClass = "w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center";

    return (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 flex flex-col">
             {storyContext && (
                <div className="bg-teal-900/50 border border-teal-800 p-3 rounded-lg text-center text-sm -mt-2 mb-2">
                    <p className="font-semibold text-teal-300">Adding Scene {storyContext.sceneNumber} to "{storyContext.product}"</p>
                    <button type="button" onClick={onCancelAddScene} className="text-xs text-slate-400 hover:text-white hover:underline mt-1">Cancel</button>
                </div>
            )}
            <h3 className="text-xl font-bold text-white">Creative Brief</h3>
            
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label htmlFor="product" className="text-sm font-medium text-slate-400">Product Name</label>
                    <button type="button" onClick={onAskArtie} disabled={isSparking || !!storyContext} className="btn-sparkle">
                        {isSparking ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                <span>Thinking...</span>
                            </>
                        ) : (
                             <>
                                <SparklesIcon className="w-4 h-4 text-amber-400" />
                                <span>Ask <span className="text-amber-400">Artie</span></span>
                            </>
                        )}
                    </button>
                </div>
                <input
                    type="text"
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    placeholder="e.g., Starlight Soda"
                    className={inputClass}
                    required
                    disabled={!!storyContext}
                />
            </div>

            <div>
                <label htmlFor="visualIdea" className={labelClass}>{storyContext ? 'Scene Visual Idea' : 'Visual Idea'}</label>
                <textarea
                    id="visualIdea"
                    name="visualIdea"
                    value={formData.visualIdea}
                    onChange={handleInputChange}
                    placeholder={storyContext ? 'e.g., The robot lands on a Martian surface' : 'e.g., A retro-futuristic robot surfing on a wave of cola'}
                    className={`${inputClass} h-20`}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="era" className={labelClass}>Era</label>
                    <select id="era" name="era" value={formData.era} onChange={handleInputChange} className={inputClass} disabled={!!storyContext}>
                        {ERAS.map(era => <option key={era} value={era}>{era}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="tone" className={labelClass}>Tone</label>
                    <select id="tone" name="tone" value={formData.tone} onChange={handleInputChange} className={inputClass} disabled={!!storyContext}>
                        {TONES.map(tone => <option key={tone} value={tone}>{tone}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className={labelClass}>Visual Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <button type="button" disabled={!!storyContext} onClick={() => setVisualType('image')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-slate-300 transition-colors ${formData.visualType === 'image' ? 'bg-teal-500/20 border-teal-500 text-white' : 'border-slate-700 hover:bg-slate-800'}`}>
                        <PhotoIcon className="w-5 h-5" /> Image
                    </button>
                    <button type="button" disabled={!!storyContext} onClick={() => setVisualType('video')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-slate-300 transition-colors ${formData.visualType === 'video' ? 'bg-teal-500/20 border-teal-500 text-white' : 'border-slate-700 hover:bg-slate-800'}`}>
                        <VideoCameraIcon className="w-5 h-5" /> Video
                    </button>
                </div>
            </div>

            <div className={`grid ${formData.visualType === 'video' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div>
                    <label htmlFor="aspectRatio" className={labelClass}>Aspect Ratio</label>
                    <select id="aspectRatio" name="aspectRatio" value={formData.aspectRatio} onChange={handleInputChange} className={inputClass} disabled={!!storyContext}>
                        {ASPECT_RATIOS.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                    </select>
                </div>

                {formData.visualType === 'video' && (
                    <div>
                        <label htmlFor="voice" className={labelClass}>Voiceover</label>
                        <select id="voice" name="voice" value={formData.voice} onChange={handleInputChange} className={inputClass} disabled={!!storyContext}>
                            {VOICES.map(voice => <option key={voice.value} value={voice.value}>{voice.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="notes" className={labelClass}>{storyContext ? 'Scene Notes (Optional)' : 'Additional Notes (Optional)'}</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Focus on the bubbles. Avoid showing faces."
                    className={`${inputClass} h-16`}
                />
            </div>
            
            <hr className="border-slate-700 my-2" />
            
            <div className="space-y-2">
                {needsApiKey ? (
                    <button type="button" onClick={onSelectApiKey} className={btnPrimaryClass}>Select API Key to Generate</button>
                ) : (
                    <button type="submit" disabled={isLoading} className={btnPrimaryClass}>
                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : null}
                        {isLoading ? 'Generating...' : (storyContext ? `Generate Scene ${storyContext.sceneNumber}` : 'Generate Ad')}
                    </button>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={onGenerateRandom} disabled={isLoading || !!storyContext} className={btnSecondaryClass}>
                        <DiceIcon className="w-4 h-4 mr-2" />
                        I'm Feeling Lucky
                    </button>
                    <button type="button" onClick={onConceptLabToggle} disabled={isLoading || isConceptLabOpen || !!storyContext} className={btnSecondaryClass}>
                        <LightbulbIcon className="w-4 h-4 mr-2" />
                        Concept Lab
                    </button>
                </div>
            </div>
        </form>
    );
};

export default AdGeneratorForm;