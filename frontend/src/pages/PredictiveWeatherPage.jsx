import React from 'react';
import PredictiveConfigurationSection from '../components/sections/PredictiveConfigurationSection';

const PredictiveWeatherPage = () => {
    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Predictive Intelligence</h1>
                <p className="text-slate-400">Future yield estimation and climate scenario planning.</p>
            </header>
            <PredictiveConfigurationSection />
        </div>
    );
};

export default PredictiveWeatherPage;
