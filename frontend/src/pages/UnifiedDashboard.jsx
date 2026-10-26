import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, CloudSun, Sprout, LayoutDashboard, Clock, LineChart, Users } from 'lucide-react';

import AIIntelligencePage from './AIIntelligencePage';
import LiveWeatherSection from '../components/sections/LiveWeatherSection';
import FertilizerRecommendation from '../components/FertilizerRecommendation';
import HistoricalAnalyticsSection from '../components/sections/HistoricalAnalyticsSection';
import PredictiveConfigurationSection from '../components/sections/PredictiveConfigurationSection';
import CommunityPlanning from './CommunityPlanning';

const UnifiedDashboard = () => {
    const [activeTab, setActiveTab] = useState('nlp');

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div 
            className="w-full space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 p-4 md:p-8 pb-0">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                        <LayoutDashboard size={32} className="text-emerald-400" />
                        Agri-Insights Hub
                    </h1>
                </div>
            </div>

            {/* Global Tabs */}
            <div className="px-4 md:px-8">
                <div className="flex p-1.5 space-x-2 bg-slate-800/80 rounded-2xl backdrop-blur-xl border border-slate-700/50 w-full overflow-x-auto whitespace-nowrap scrollbar-hide shadow-lg" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    <button
                        onClick={() => setActiveTab('nlp')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all shrink-0 ${
                            activeTab === 'nlp' 
                            ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <BrainCircuit size={20} />
                        AI Intelligence
                    </button>
                    <button
                        onClick={() => setActiveTab('weather')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all shrink-0 ${
                            activeTab === 'weather' 
                            ? 'bg-gradient-to-r from-blue-500/20 to-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <CloudSun size={20} />
                        Live Weather Monitor
                    </button>
                    <button
                        onClick={() => setActiveTab('fertilizer')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all shrink-0 ${
                            activeTab === 'fertilizer' 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <Sprout size={20} />
                        Fertilizer Expert
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all shrink-0 ${
                            activeTab === 'history' 
                            ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <Clock size={20} />
                        Historical Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('predict')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all shrink-0 ${
                            activeTab === 'predict' 
                            ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <LineChart size={20} />
                        Predictive Intelligence
                    </button>
                    <button
                        onClick={() => setActiveTab('planning')}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all shrink-0 ${
                            activeTab === 'planning' 
                            ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <Users size={20} />
                        Community Planning
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-4 md:px-8 pb-12 min-h-[60vh]">
                <AnimatePresence mode="wait">
                    {activeTab === 'nlp' && (
                        <motion.div
                            key="nlp"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AIIntelligencePage isEmbedded={true} />
                        </motion.div>
                    )}
                    {activeTab === 'weather' && (
                        <motion.div
                            key="weather"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8"
                        >
                            <LiveWeatherSection />
                        </motion.div>
                    )}
                    {activeTab === 'fertilizer' && (
                        <motion.div
                            key="fertilizer"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8"
                        >
                            <FertilizerRecommendation />
                        </motion.div>
                    )}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8"
                        >
                            <HistoricalAnalyticsSection />
                        </motion.div>
                    )}
                    {activeTab === 'predict' && (
                        <motion.div
                            key="predict"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8"
                        >
                            <PredictiveConfigurationSection />
                        </motion.div>
                    )}
                    {activeTab === 'planning' && (
                        <motion.div
                            key="planning"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8"
                        >
                            <CommunityPlanning />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default UnifiedDashboard;
