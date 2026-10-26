import React, { useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import { motion } from 'framer-motion';
import { Play, Pause, Calendar, Leaf, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import tnDistricts from '../assets/tn_districts.json';

// Generate yield data
const generateYieldData = () => {
    const districts = tnDistricts.features.map(f => f.properties.NAME_2);
    const years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    const seasons = ['Kharif', 'Rabi', 'Summer'];
    const crops = ['Rice', 'Sugarcane', 'Cotton', 'Groundnut', 'Millets'];

    const data = [];

    districts.forEach(district => {
        years.forEach((year, yearIdx) => {
            seasons.forEach(season => {
                const baseYield = 2.5 + Math.random() * 2.5;
                const seasonFactor = season === 'Kharif' ? 1.2 : season === 'Rabi' ? 1.1 : 0.9;
                const yearFactor = 1 + (yearIdx * 0.05);
                const districtFactor = 0.85 + Math.random() * 0.3;

                const yieldValue = baseYield * seasonFactor * yearFactor * districtFactor;
                const area = 5000 + Math.random() * 15000;
                const production = yieldValue * area;

                const prevYearData = data.find(d =>
                    d.district === district &&
                    d.year === year - 1 &&
                    d.season === season
                );
                const yoyChange = prevYearData
                    ? ((yieldValue - prevYearData.yield) / prevYearData.yield * 100)
                    : 0;

                data.push({
                    district,
                    year,
                    season,
                    crop: crops[Math.floor(Math.random() * crops.length)],
                    area: Math.round(area),
                    production: Math.round(production),
                    yield: parseFloat(yieldValue.toFixed(2)),
                    yoyChange: parseFloat(yoyChange.toFixed(1))
                });
            });
        });
    });

    return data;
};

const YieldHeatmap = () => {
    const [selectedYear, setSelectedYear] = useState(2023);
    const [selectedSeason, setSelectedSeason] = useState('Kharif');
    const [isPlaying, setIsPlaying] = useState(false);
    const [extruded, setExtruded] = useState(true);
    const [highlightedDistrict, setHighlightedDistrict] = useState(null);

    const [viewState, setViewState] = useState({
        latitude: 10.8,
        longitude: 78.7,
        zoom: 6.5,
        pitch: 50,
        bearing: 0,
        minZoom: 5.5,
        maxZoom: 12,
        minPitch: 0,
        maxPitch: 85
    });

    const yieldData = useMemo(() => generateYieldData(), []);
    const years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    const seasons = ['Kharif', 'Rabi', 'Summer'];

    const filteredData = useMemo(() => {
        return yieldData.filter(d => d.year === selectedYear && d.season === selectedSeason);
    }, [yieldData, selectedYear, selectedSeason]);

    // Enhanced GeoJSON with yield data
    const enhancedGeoJson = useMemo(() => {
        const yieldByDistrict = {};
        filteredData.forEach(d => {
            yieldByDistrict[d.district] = d;
        });

        const features = tnDistricts.features.map(feature => {
            const districtName = feature.properties.NAME_2;
            const data = yieldByDistrict[districtName] || {};

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    ...data,
                    name: districtName
                }
            };
        });

        return {
            type: 'FeatureCollection',
            features
        };
    }, [filteredData]);

    // Lighting
    const lightingEffect = useMemo(() => {
        return new LightingEffect({
            ambientLight: new AmbientLight({
                color: [255, 255, 255],
                intensity: 0.5
            }),
            directionalLight: new DirectionalLight({
                color: [255, 255, 255],
                intensity: 0.9,
                direction: [-1, -2, -1]
            })
        });
    }, []);

    // Simple color gradient
    const getColor = (yieldValue) => {
        if (!yieldValue) return [80, 80, 100, 180];

        const normalized = Math.max(0, Math.min(1, (yieldValue - 2.5) / 2.5));

        // Blue to Red gradient
        if (normalized < 0.5) {
            const t = normalized / 0.5;
            return [
                0 + (255 - 0) * t,
                100 + (200 - 100) * t,
                255 + (0 - 255) * t
            ];
        } else {
            const t = (normalized - 0.5) / 0.5;
            return [
                255,
                200 + (100 - 200) * t,
                0
            ];
        }
    };

    const layers = [
        // Satellite base
        new TileLayer({
            id: 'satellite-base',
            data: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            minZoom: 0,
            maxZoom: 19,
            tileSize: 256,
            renderSubLayers: props => {
                const { bbox: { west, south, east, north } } = props.tile;
                return new BitmapLayer(props, {
                    data: null,
                    image: props.data,
                    bounds: [west, south, east, north]
                });
            }
        }),

        // 3D Districts
        new GeoJsonLayer({
            id: 'districts-3d',
            data: enhancedGeoJson,
            extruded: extruded,
            wireframe: false,
            filled: true,

            getElevation: d => {
                const yieldVal = d.properties.yield || 0;
                return extruded ? yieldVal * 20000 : 0;
            },

            getFillColor: d => {
                const yieldVal = d.properties.yield;
                const color = getColor(yieldVal);
                const isHighlighted = highlightedDistrict === d.properties.name;
                return [...color, isHighlighted ? 255 : 180];
            },

            getLineColor: [255, 255, 255, 150],
            getLineWidth: 2,

            pickable: true,
            autoHighlight: true,

            onClick: (info) => {
                if (info.object) {
                    setHighlightedDistrict(info.object.properties.name);
                }
            },

            updateTriggers: {
                getElevation: [extruded],
                getFillColor: [highlightedDistrict, selectedYear, selectedSeason]
            },

            transitions: {
                getElevation: {
                    duration: 1000,
                    easing: t => t * (2 - t)
                }
            }
        })
    ];

    // Auto-play
    React.useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setSelectedYear(prev => {
                    const currentIndex = years.indexOf(prev);
                    if (currentIndex === years.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return years[currentIndex + 1];
                });
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, years]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Leaf className="text-emerald-400" />
                    3D Yield Terrain Map
                    <span className="text-sm text-gray-400 ml-auto">Satellite • 3D Elevation</span>
                </h3>
            </div>

            {/* Controls */}
            <div className="glass-panel p-6 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Time Slider */}
                    <div>
                        <label className="text-white font-semibold flex items-center gap-2 mb-3">
                            <Calendar size={18} className="text-cyan-400" />
                            Year: <span className="text-cyan-400 text-xl">{selectedYear}</span>
                        </label>
                        <input
                            type="range"
                            min={years[0]}
                            max={years[years.length - 1]}
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>{years[0]}</span>
                            <span>{years[Math.floor(years.length / 2)]}</span>
                            <span>{years[years.length - 1]}</span>
                        </div>
                    </div>

                    {/* Season Selector */}
                    <div>
                        <label className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Leaf size={18} className="text-emerald-400" />
                            Season
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {seasons.map(season => (
                                <button
                                    key={season}
                                    onClick={() => setSelectedSeason(season)}
                                    className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300
                                        ${selectedSeason === season
                                            ? 'bg-linear-to-r from-emerald-500 to-cyan-500 text-white shadow-lg scale-105'
                                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                        }`}
                                >
                                    {season}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                            {(filteredData.reduce((sum, d) => sum + d.yield, 0) / filteredData.length).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Avg Yield (t/ha)</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {(filteredData.reduce((sum, d) => sum + d.yoyChange, 0) / filteredData.length).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Avg YoY Growth</div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="relative glass-panel p-2 h-[900px] rounded-xl overflow-hidden">
                <DeckGL
                    viewState={viewState}
                    onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState)}
                    controller={true}
                    layers={layers}
                    effects={[lightingEffect]}
                    getCursor={() => 'pointer'}
                />

                {/* Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    <button
                        onClick={() => setViewState({
                            latitude: 10.8,
                            longitude: 78.7,
                            zoom: 6.5,
                            pitch: 50,
                            bearing: 0
                        })}
                        className="p-3 bg-black/70 hover:bg-black/90 rounded-lg border border-white/20 
                                 text-white transition-all backdrop-blur-sm"
                        title="Reset View"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button
                        onClick={() => setExtruded(!extruded)}
                        className="p-3 bg-black/70 hover:bg-black/90 rounded-lg border border-white/20 
                                 text-white transition-all backdrop-blur-sm"
                        title={extruded ? "Flatten" : "3D"}
                    >
                        {extruded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>

                {/* District Info */}
                {highlightedDistrict && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 left-4 bg-linear-to-br from-cyan-900/95 to-blue-900/95 backdrop-blur-md rounded-2xl p-6 border-2 border-cyan-400/60 shadow-2xl shadow-cyan-500/50 z-10 min-w-[350px]"
                    >
                        {(() => {
                            const districtData = filteredData.find(d => d.district === highlightedDistrict);
                            return districtData ? (
                                <>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-cyan-400/40">
                                        <h3 className="text-cyan-300 font-bold text-2xl">{districtData.district}</h3>
                                        <span className="text-xs text-cyan-400 bg-cyan-400/20 px-3 py-1 rounded-full">{selectedYear}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-white/10 rounded-xl p-4">
                                            <div className="text-xs text-gray-300 mb-1">Agricultural Yield</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-cyan-300">{districtData.yield}</span>
                                                <span className="text-lg text-gray-400">t/ha</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-emerald-500/20 rounded-lg p-3 border border-emerald-400/30">
                                                <div className="text-xs text-emerald-300 mb-1">🌾 Crop Type</div>
                                                <div className="text-sm font-semibold text-white">{districtData.crop}</div>
                                            </div>
                                            <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                                                <div className="text-xs text-blue-300 mb-1">🌱 Season</div>
                                                <div className="text-sm font-semibold text-white">{districtData.season}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
                                                <div className="text-xs text-purple-300 mb-1">📊 Cultivated Area</div>
                                                <div className="text-lg font-bold text-white">{districtData.area.toLocaleString()}</div>
                                                <div className="text-xs text-gray-400">hectares</div>
                                            </div>
                                            <div className="bg-orange-500/20 rounded-lg p-3 border border-orange-400/30">
                                                <div className="text-xs text-orange-300 mb-1">⚖️ Total Production</div>
                                                <div className="text-lg font-bold text-white">{districtData.production.toLocaleString()}</div>
                                                <div className="text-xs text-gray-400">tons</div>
                                            </div>
                                        </div>
                                        <div className={`rounded-lg p-3 border-2 ${districtData.yoyChange >= 0
                                            ? 'bg-green-500/20 border-green-400/40'
                                            : 'bg-red-500/20 border-red-400/40'
                                            }`}>
                                            <div className="text-xs text-gray-300 mb-1">📈 Year-over-Year Change</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-3xl font-bold ${districtData.yoyChange >= 0 ? 'text-green-300' : 'text-red-300'
                                                    }`}>
                                                    {districtData.yoyChange > 0 ? '+' : ''}{districtData.yoyChange}%
                                                </span>
                                                <span className="text-sm text-gray-400">vs {selectedYear - 1}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>

                            ) : null;
                        })()}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default YieldHeatmap;
