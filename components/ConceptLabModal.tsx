import React, { useState } from 'react';
import { brainstormConcepts } from '../services/geminiService';
import { SpinnerIcon } from './icons';

interface Concept {
    headline: string;
    tagline: string;
    tone: string;
    visualIdea: string;
}

interface ConceptLabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyConcept: (concept: { tone: string, visualIdea: string }) => void;
    product: string;
    notes: string;
}

const ConceptLabModal: React.FC<ConceptLabModalProps> = ({ isOpen, onClose, onApplyConcept, product, notes }) => {
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBrainstorm = async () => {
        if (!product) {
            setError("Please enter a product name first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setConcepts([]);
        try {
            const result = await brainstormConcepts(product, notes);
            setConcepts(result);
        } catch (e: any) {
            setError(e.message || "Failed to brainstorm concepts.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApply = (concept: Concept) => {
        onApplyConcept({ tone: concept.tone, visualIdea: concept.visualIdea });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-[fade-in-animation_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Concept Lab</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none font-bold">&times;</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <p className="text-slate-300 mb-2">Brainstorm creative directions for <strong className="text-white">{product || "your product"}</strong>.</p>
                        <button onClick={handleBrainstorm} disabled={isLoading || !product} className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : null}
                            {isLoading ? 'Brainstorming...' : 'Brainstorm 3 Concepts'}
                        </button>
                    </div>

                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                    
                    {concepts.length > 0 && (
                        <div className="space-y-4">
                            {concepts.map((concept, index) => (
                                <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                    <h3 className="font-bold text-lg text-teal-300">{concept.headline}</h3>
                                    <p className="text-sm text-slate-400 italic mb-2">"{concept.tagline}"</p>
                                    <p className="text-sm my-2"><strong className="text-slate-300">Tone:</strong> {concept.tone}</p>
                                    <p className="text-slate-300">{concept.visualIdea}</p>
                                    <button onClick={() => handleApply(concept)} className="mt-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">
                                        Apply this Concept
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConceptLabModal;
