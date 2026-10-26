import React from 'react';
import LiveWeatherSection from '../components/sections/LiveWeatherSection';
import HistoricalAnalyticsSection from '../components/sections/HistoricalAnalyticsSection';
import PredictiveConfigurationSection from '../components/sections/PredictiveConfigurationSection';

const WeatherAnalysis = () => {
    return (
        <div className="p-4 md:p-8 space-y-16">
            <header className="mb-8">
                <h1 className="text-4xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">Weather Analysis Hub</h1>
                <p className="text-slate-400 mt-2 text-lg">Comprehensive climate intelligence: Live, Historical, and Predictive.</p>
            </header>

            <LiveWeatherSection />
            <HistoricalAnalyticsSection />
            <PredictiveConfigurationSection />

            <footer className="pt-12 text-center text-slate-500 text-sm border-t border-white/5">
                <p>Agri-Insight Climate Intelligence System v2.0</p>
            </footer>
        </div>
    );
};

export default WeatherAnalysis;

