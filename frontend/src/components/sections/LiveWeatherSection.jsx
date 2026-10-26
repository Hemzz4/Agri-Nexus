import React, { useState, useEffect } from 'react';
import { Sun, ChevronDown, Thermometer, Droplets, CloudRain } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchWeather } from '../../api';
import WeatherDetailedGrid from '../WeatherDetailedGrid';
import HeatTerrain3D from '../HeatTerrain3D';
import GaugeChart from '../GaugeChart';
import { districts, districtCoords } from '../../utils/districtData';

const GlassCard = ({ children, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`glass-panel p-6 ${className}`}
    >
        {children}
    </motion.div>
);

const LiveWeatherSection = () => {
    const [district, setDistrict] = useState('Coimbatore');
    const [loadingWeather, setLoadingWeather] = useState(false);
    const [weatherData, setWeatherData] = useState(null);

    useEffect(() => {
        const getWeatherData = async () => {
            setLoadingWeather(true);
            try {
                const coords = districtCoords[district] || districtCoords['Coimbatore'];
                const data = await fetchWeather(coords.lat, coords.lon);
                setWeatherData(data);
            } catch (err) {
                console.error('Weather fetch error:', err);
            } finally {
                setLoadingWeather(false);
            }
        };
        getWeatherData();
    }, [district]);

    return (
        <section className="mb-12">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400 mb-6 flex items-center gap-3">
                <Sun className="text-emerald-400" /> Live Weather Analysis
            </h2>

            {/* District Selector */}
            <GlassCard className="mb-8">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Select Region</label>
                <div className="relative">
                    <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-slate-900/80 border border-white/10 text-white p-4 pr-12 rounded-xl outline-none focus:border-emerald-500 appearance-none font-sans text-lg cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                        {districts.map(d => (
                            <option key={d} value={d} className="bg-slate-900">{d}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400">
                        <ChevronDown size={20} />
                    </div>
                </div>
            </GlassCard>

            {/* Current Conditions - Horizontal */}
            <GlassCard className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Current Conditions</h3>
                    <div className="flex items-center gap-2">
                        <Sun className="text-yellow-300" size={24} />
                        <span className="text-lg text-gray-300">{district}</span>
                    </div>
                </div>
                {loadingWeather ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
                    </div>
                ) : weatherData && weatherData.current ? (
                    <WeatherDetailedGrid current={weatherData.current} />
                ) : (
                    <div className="text-center text-slate-400 py-12">No data available</div>
                )}
            </GlassCard>

            {/* 3D Multi-Metric Terrain - Full Width Horizontal */}
            <GlassCard className="h-[700px] flex flex-col mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-cyan-400">🏔️</span>
                    3D Climate Terrain
                    <span className="text-xs text-gray-400 ml-auto">Interactive 3D Multi-Metric View</span>
                </h3>
                <div className="flex-1 rounded-xl overflow-hidden">
                    <HeatTerrain3D
                        weatherData={{}}
                        selectedDistrict={district}
                    />
                </div>
            </GlassCard>

            {/* Radial Gauge Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GaugeChart
                    key={`temp-${district}-${weatherData?.current?.temperature_2m}`}
                    value={weatherData?.current?.temperature_2m || weatherData?.current?.temp_c || 25}
                    min={15}
                    max={45}
                    title="Soil Temperature (0cm)"
                    unit="°C"
                    icon={Thermometer}
                    colorRanges={[
                        { range: [15, 25], color: '#3b82f6' },
                        { range: [25, 35], color: '#22c55e' },
                        { range: [35, 45], color: '#ef4444' }
                    ]}
                    delay={0.1}
                />
                <GaugeChart
                    key={`moisture-${district}-${weatherData?.current?.relative_humidity_2m}`}
                    value={(weatherData?.current?.relative_humidity_2m || weatherData?.current?.humidity || 50) / 100}
                    min={0}
                    max={1}
                    title="Soil Moisture"
                    unit=""
                    icon={Droplets}
                    colorRanges={[
                        { range: [0, 0.3], color: '#ef4444' },
                        { range: [0.3, 0.7], color: '#22c55e' },
                        { range: [0.7, 1.0], color: '#3b82f6' }
                    ]}
                    delay={0.2}
                />
                <GaugeChart
                    key={`humidity-${district}-${weatherData?.current?.relative_humidity_2m}`}
                    value={weatherData?.current?.relative_humidity_2m || weatherData?.current?.humidity || 60}
                    min={0}
                    max={100}
                    title="Relative Humidity"
                    unit="%"
                    icon={CloudRain}
                    colorRanges={[
                        { range: [0, 30], color: '#ef4444' },
                        { range: [30, 70], color: '#22c55e' },
                        { range: [70, 100], color: '#3b82f6' }
                    ]}
                    delay={0.3}
                />
            </div>
        </section>
    );
};

export default LiveWeatherSection;
