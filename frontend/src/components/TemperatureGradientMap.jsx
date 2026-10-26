import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';
import { Thermometer, MapPin } from 'lucide-react';
import { districts, districtCoords } from '../utils/districtData';

const GoogleMapsTemperatureView = ({
    temperature = 25,
    district = 'Coimbatore',
    minTemp = -10,
    maxTemp = 50,
    unit = '°C'
}) => {
    const [mapData, setMapData] = useState([]);
    const [animationPhase, setAnimationPhase] = useState(0);
    const animationRef = React.useRef(null);

    // Temperature color mapping
    const getTempColor = (temp) => {
        const normalized = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));

        const colorStops = [
            { pos: 0.0, r: 0, g: 101, b: 218 },     // Blue
            { pos: 0.2, r: 0, g: 206, b: 209 },     // Cyan
            { pos: 0.4, r: 16, g: 185, b: 129 },    // Green
            { pos: 0.6, r: 253, g: 224, b: 71 },    // Yellow
            { pos: 0.8, r: 251, g: 146, b: 60 },    // Orange
            { pos: 1.0, r: 220, g: 38, b: 38 }      // Red
        ];

        let lowerStop = colorStops[0];
        let upperStop = colorStops[colorStops.length - 1];

        for (let i = 0; i < colorStops.length - 1; i++) {
            if (normalized >= colorStops[i].pos && normalized <= colorStops[i + 1].pos) {
                lowerStop = colorStops[i];
                upperStop = colorStops[i + 1];
                break;
            }
        }

        const range = upperStop.pos - lowerStop.pos;
        const t = range === 0 ? 0 : (normalized - lowerStop.pos) / range;

        return `rgb(${Math.floor(lowerStop.r + (upperStop.r - lowerStop.r) * t)}, ${Math.floor(lowerStop.g + (upperStop.g - lowerStop.g) * t)}, ${Math.floor(lowerStop.b + (upperStop.b - lowerStop.b) * t)})`;
    };

    // Animated gradient movement effect
    useEffect(() => {
        const animate = () => {
            setAnimationPhase(prev => (prev + 0.01) % (Math.PI * 2));
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Generate temperature data for all districts with animated waves
    useEffect(() => {
        // Base temperature variations for all districts (consistent, not random)
        const districtTemperatures = districts.map((dist, idx) => {
            let baseTemp = temperature;

            if (dist !== district) {
                // Use district index for consistent variation (not random)
                const consistentVariation = Math.sin(idx * 0.7) * 3;

                // Coastal districts tend to be warmer
                const coastalDistricts = ['Chennai', 'Cuddalore', 'Nagapattinam', 'Kanniyakumari',
                    'Ramanathapuram', 'Thoothukkudi', 'Thanjavur', 'Thiruvarur'];
                const coastalBonus = coastalDistricts.includes(dist) ? 2 : 0;

                // Hill stations are cooler
                const hillDistricts = ['The Nilgiris'];
                const hillPenalty = hillDistricts.includes(dist) ? -5 : 0;

                baseTemp = temperature + consistentVariation + coastalBonus + hillPenalty;
            }

            // Add animated wave effect - creates flowing movement with multiple waves
            const coords = districtCoords[dist];
            const wave1 = Math.sin(animationPhase + coords.lat * 0.4) * 5;
            const wave2 = Math.cos(animationPhase * 1.5 + coords.lon * 0.3) * 4;
            const wave3 = Math.sin(animationPhase * 0.8 + (coords.lat + coords.lon) * 0.15) * 3;
            const totalWave = wave1 + wave2 + wave3;

            return Math.min(maxTemp, Math.max(minTemp, baseTemp + totalWave));
        });

        // Prepare data for Plotly
        const lats = districts.map(d => districtCoords[d].lat);
        const lons = districts.map(d => districtCoords[d].lon);
        const temps = districtTemperatures;

        // Create additional interpolation points for smoother gradient coverage
        const gridPoints = [];
        const latMin = Math.min(...lats) - 0.5;
        const latMax = Math.max(...lats) + 0.5;
        const lonMin = Math.min(...lons) - 0.5;
        const lonMax = Math.max(...lons) + 0.5;

        // Create a dense grid of points across Tamil Nadu
        const gridResolution = 20; // Increase for denser coverage
        for (let i = 0; i <= gridResolution; i++) {
            for (let j = 0; j <= gridResolution; j++) {
                const lat = latMin + (latMax - latMin) * (i / gridResolution);
                const lon = lonMin + (lonMax - lonMin) * (j / gridResolution);

                // Calculate temperature for this grid point with waves
                const wave1 = Math.sin(animationPhase + lat * 0.4) * 5;
                const wave2 = Math.cos(animationPhase * 1.5 + lon * 0.3) * 4;
                const wave3 = Math.sin(animationPhase * 0.8 + (lat + lon) * 0.15) * 3;
                const totalWave = wave1 + wave2 + wave3;

                const gridTemp = temperature + totalWave;

                gridPoints.push({
                    lat,
                    lon,
                    temp: Math.min(maxTemp, Math.max(minTemp, gridTemp))
                });
            }
        }

        // Combine district points with grid points for comprehensive coverage
        const allLats = [...lats, ...gridPoints.map(p => p.lat)];
        const allLons = [...lons, ...gridPoints.map(p => p.lon)];
        const allTemps = [...temps, ...gridPoints.map(p => p.temp)];

        // Create district markers (small, subtle)
        const scatterTrace = {
            type: 'scattermapbox',
            lat: lats,
            lon: lons,
            mode: 'text',
            text: districts.map((d, i) => `${d}<br>${Math.round(temps[i])}°C`),
            textposition: 'top center',
            textfont: {
                family: 'Arial, sans-serif',
                size: 9,
                color: 'white',
                weight: 'bold'
            },
            hovertemplate: '<b>%{text}</b><extra></extra>',
            showlegend: false
        };

        // Create comprehensive heat layer using all points
        const heatTrace = {
            type: 'densitymapbox',
            lat: allLats,
            lon: allLons,
            z: allTemps,
            radius: 35, // Increased radius for better coverage
            colorscale: [
                [0, 'rgba(0, 101, 218, 0.85)'],      // Blue
                [0.2, 'rgba(0, 206, 209, 0.85)'],    // Cyan
                [0.4, 'rgba(16, 185, 129, 0.85)'],   // Green
                [0.6, 'rgba(253, 224, 71, 0.85)'],   // Yellow
                [0.8, 'rgba(251, 146, 60, 0.85)'],   // Orange
                [1, 'rgba(220, 38, 38, 0.85)']       // Red
            ],
            zmin: minTemp,
            zmax: maxTemp,
            showscale: false,
            hoverinfo: 'skip'
        };

        setMapData([heatTrace, scatterTrace]);
    }, [temperature, district, minTemp, maxTemp, animationPhase]);

    const currentColor = getTempColor(temperature);

    // Calculate center of Tamil Nadu
    const centerLat = 10.8;
    const centerLon = 78.5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Thermometer
                        size={28}
                        style={{ color: currentColor }}
                        className="drop-shadow-lg"
                    />
                    <h3 className="text-2xl font-bold text-white">Tamil Nadu Temperature Map</h3>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 rounded-xl border border-white/10">
                    <MapPin size={18} className="text-emerald-400" />
                    <span className="text-white font-medium">{district}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Map Section */}
                <div className="lg:col-span-3">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-900/40 backdrop-blur-lg shadow-2xl">
                        <Plot
                            data={mapData}
                            layout={{
                                mapbox: {
                                    style: 'open-street-map',
                                    center: { lat: centerLat, lon: centerLon },
                                    zoom: 6.2,
                                },
                                height: 600,
                                margin: { t: 0, b: 0, l: 0, r: 0 },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                showlegend: false,
                                hovermode: 'closest',
                                dragmode: 'pan'
                            }}
                            config={{
                                displayModeBar: true,
                                displaylogo: false,
                                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                                responsive: true
                            }}
                            style={{ width: '100%', height: '100%' }}
                            className="rounded-2xl"
                        />
                    </div>
                </div>

                {/* Info Panel */}
                <div className="space-y-4">
                    {/* Current Temperature */}
                    <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        <div className="text-xs text-slate-400 font-semibold uppercase mb-2">Current Temperature</div>
                        <div
                            className="text-5xl font-bold mb-2"
                            style={{ color: currentColor, textShadow: `0 0 20px ${currentColor}` }}
                        >
                            {Math.round(temperature)}{unit}
                        </div>
                        <div className="text-sm text-slate-300">
                            {temperature < 10 ? 'Very Cold' :
                                temperature < 20 ? 'Cold' :
                                    temperature < 25 ? 'Moderate' :
                                        temperature < 30 ? 'Warm' :
                                            temperature < 35 ? 'Hot' : 'Very Hot'}
                        </div>
                    </div>

                    {/* Temperature Scale */}
                    <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Temperature Scale</h4>

                        <div className="flex gap-4">
                            {/* Gradient bar */}
                            <div className="w-12 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg" style={{ height: '240px' }}>
                                <div className="h-full flex flex-col">
                                    {Array.from({ length: 100 }).map((_, i) => {
                                        const temp = maxTemp - (i / 100) * (maxTemp - minTemp);
                                        const color = getTempColor(temp);
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1"
                                                style={{ backgroundColor: color }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Labels */}
                            <div className="flex flex-col justify-between text-sm font-mono text-slate-300">
                                <div>{maxTemp}{unit}</div>
                                <div>{Math.round(maxTemp * 0.75 + minTemp * 0.25)}{unit}</div>
                                <div>{Math.round((maxTemp + minTemp) / 2)}{unit}</div>
                                <div>{Math.round(maxTemp * 0.25 + minTemp * 0.75)}{unit}</div>
                                <div>{minTemp}{unit}</div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Coverage</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Districts</span>
                                <span className="text-white font-semibold">{districts.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Selected</span>
                                <span className="text-emerald-400 font-semibold">{district}</span>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">About</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Interactive temperature map showing all {districts.length} districts of Tamil Nadu.
                            Heat zones indicate temperature distribution across the region.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Color Scale */}
            <div className="mt-6">
                <div className="h-3 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <div className="h-full flex">
                        {Array.from({ length: 200 }).map((_, i) => {
                            const temp = minTemp + (i / 200) * (maxTemp - minTemp);
                            const color = getTempColor(temp);
                            return (
                                <div
                                    key={i}
                                    className="flex-1"
                                    style={{ backgroundColor: color }}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium px-2">
                    <span>Coldest ({minTemp}{unit})</span>
                    <span>Moderate</span>
                    <span>Hottest ({maxTemp}{unit})</span>
                </div>
            </div>
        </motion.div>
    );
};

export default GoogleMapsTemperatureView;
