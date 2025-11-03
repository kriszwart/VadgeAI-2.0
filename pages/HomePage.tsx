import React from 'react';
import { ArrowRightIcon, BriefcaseIcon, PaintBrushIcon } from '../components/icons';

interface HomePageProps {
    onNavigate: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
        <div className="flex items-center gap-4 mb-3">
            <div className="bg-slate-800 p-2 rounded-full">{icon}</div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400">{children}</p>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <main className="container mx-auto p-4 flex-grow flex flex-col items-center justify-center text-center animate-[fade-in-animation_0.5s_ease-out]">
            <div className="max-w-4xl py-16">
                <span className="text-teal-400 font-semibold tracking-wide">AI-POWERED VIDEO AD CREATION</span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white my-4 tracking-tighter">
                    Craft <span className="text-teal-400">Nostalgic</span> Video Ads in Seconds
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                    Artie is your AI co-director. Just enter a product idea, and watch as it generates entire video ad concepts, complete with scripts, voiceovers, and visuals from any era.
                </p>
                <button
                    onClick={onNavigate}
                    className="group btn-primary text-lg h-14 px-8 flex items-center justify-center mx-auto"
                >
                    Start Creating Now
                    <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </button>
            </div>

            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 py-12">
                <FeatureCard icon={<BriefcaseIcon className="w-6 h-6 text-teal-400" />} title="Concept to Campaign">
                    Go from a simple product name to a full-fledged ad concept. Artie brainstorms ideas, writes scripts, and directs the final cut.
                </FeatureCard>
                <FeatureCard icon={<PaintBrushIcon className="w-6 h-6 text-teal-400" />} title="Customize Your Creative">
                    Take control of the final output. Adjust text overlays, fonts, colors, and layouts to match your brand's vision perfectly.
                </FeatureCard>
            </div>
        </main>
    );
};

export default HomePage;
