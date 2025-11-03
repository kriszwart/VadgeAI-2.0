import { useState, useCallback, useEffect } from 'react';

// To resolve a TypeScript error about conflicting global declarations for `window.aistudio`,
// the `declare global` block has been removed. A local interface and type assertion are used
// to access `window.aistudio` in a type-safe manner without modifying the global scope,
// which avoids the type collision error.
interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

export const useVeoApiKey = () => {
    const [isKeySelected, setIsKeySelected] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const checkKey = useCallback(async () => {
        setIsChecking(true);
        const aistudio = (window as { aistudio?: AIStudio }).aistudio;
        if (aistudio) {
            const hasKey = await aistudio.hasSelectedApiKey();
            setIsKeySelected(hasKey);
        } else {
            console.warn("window.aistudio not found. Assuming API key is set via environment variable.");
            setIsKeySelected(true); // Fallback for environments without the aistudio object
        }
        setIsChecking(false);
    }, []);

    useEffect(() => {
        checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectKey = useCallback(async () => {
        const aistudio = (window as { aistudio?: AIStudio }).aistudio;
        if (aistudio) {
            await aistudio.openSelectKey();
            // Assume success after dialog closes to avoid race conditions.
            setIsKeySelected(true);
        } else {
            alert("API key selection is not available in this environment.");
        }
    }, []);
    
    const resetKeyState = useCallback(() => {
        setIsKeySelected(false);
    }, []);

    return { isKeySelected, isChecking, selectKey, resetKeyState };
};
