import React from 'react';
import HistoricalAnalyticsSection from '../components/sections/HistoricalAnalyticsSection';

const HistoricalWeatherPage = () => {
    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Historical Analytics</h1>
                <p className="text-slate-400">Deep dive into past climate trends and correlations.</p>
            </header>
            <HistoricalAnalyticsSection />
        </div>
    );
};

export default HistoricalWeatherPage;
