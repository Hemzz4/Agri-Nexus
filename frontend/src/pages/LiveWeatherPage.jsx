import React from 'react';
import LiveWeatherSection from '../components/sections/LiveWeatherSection';

const LiveWeatherPage = () => {
    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Live Weather Monitor</h1>
                <p className="text-slate-400">Real-time district-level weather intelligence.</p>
            </header>
            <LiveWeatherSection />
        </div>
    );
};

export default LiveWeatherPage;
