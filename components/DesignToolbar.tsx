import React from 'react';
import type { TextStyle } from '../types';
import { AlignCenterIcon } from './icons';

interface DesignToolbarProps {
    style: TextStyle;
    onStyleChange: (newStyle: Partial<TextStyle>) => void;
    onAlignCenter: () => void;
    availableFonts: { name: string; family: string }[];
    onClearActive: () => void;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; unit?: string }> = 
({ label, value, min, max, step, onChange, unit = '' }) => (
    <div className="flex-1 min-w-[120px]">
        <label className="text-xs text-slate-400 block mb-1">{label} ({value.toFixed(unit === '%' ? 0 : 1)}{unit})</label>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={e => onChange(parseFloat(e.target.value))} 
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

const DesignToolbar: React.FC<DesignToolbarProps> = ({ style, onStyleChange, onAlignCenter, availableFonts, onClearActive }) => {
    return (
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 backdrop-blur-sm flex flex-col gap-3 animate-[fade-in-animation_0.2s_ease-out] relative w-full max-w-2xl">
             <button onClick={onClearActive} className="absolute -top-2.5 -right-2.5 bg-slate-600 hover:bg-red-500 text-white w-6 h-6 rounded-full text-sm leading-none z-10 flex items-center justify-center font-mono">&times;</button>
            
            <div>
                <label htmlFor="text-editor" className="text-xs text-slate-400 block mb-1">Text Content</label>
                <textarea
                    id="text-editor"
                    value={style.text}
                    onChange={e => onStyleChange({ text: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition text-sm"
                    rows={2}
                />
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {/* Font and Color */}
                <div className="flex items-end gap-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Font</label>
                        <select value={style.font} onChange={e => onStyleChange({ font: e.target.value })} className="bg-slate-700 text-white text-sm rounded p-2 w-36 appearance-none h-10">
                            {availableFonts.map(font => <option key={font.family} value={font.family} style={{fontFamily: font.family}}>{font.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Color</label>
                        <input type="color" value={style.color} onChange={e => onStyleChange({ color: e.target.value })} className="bg-slate-700 rounded w-10 h-10 cursor-pointer border-2 border-slate-600" />
                    </div>
                </div>

                {/* Size and Width */}
                <div className="flex-grow flex items-end gap-4">
                     <Slider label="Size" value={style.size} min={1} max={15} step={0.1} onChange={val => onStyleChange({ size: val })} />
                     <Slider label="Width" value={style.width || 50} min={10} max={100} step={1} onChange={val => onStyleChange({ width: val })} unit="%" />
                </div>
                
                 {/* Center Button */}
                <div>
                     <label className="text-xs text-slate-400 block mb-1">Align</label>
                     <button onClick={onAlignCenter} className="bg-slate-700 hover:bg-slate-600 text-white rounded p-2 h-10 flex items-center justify-center" title="Align Center">
                        <AlignCenterIcon className="w-5 h-5" />
                     </button>
                </div>
            </div>
        </div>
    );
};

export default DesignToolbar;
