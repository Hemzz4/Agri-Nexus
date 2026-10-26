import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import { motion } from 'framer-motion';
import { RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import tnDistricts from '../assets/tn_districts.json';

const HeatTerrain3D = ({ weatherData = {}, selectedDistrict }) => {
    const [viewState, setViewState] = useState({
        latitude: 11.0,
        longitude: 78.5,
        zoom: 6,
        pitch: 45,
        bearing: 0,
        minZoom: 5,
        maxZoom: 12,
        minPitch: 0,
        maxPitch: 85
    });

    const [extruded, setExtruded] = useState(true);
    const [highlightedDistrict, setHighlightedDistrict] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('Temperature');

    // Available metrics for visualization
    const metrics = [
        { name: 'Temperature', min: 20, max: 40, unit: '°C', colors: [[59, 130, 246], [34, 197, 94], [251, 191, 36], [239, 68, 68]] },
        { name: 'Humidity', min: 30, max: 100, unit: '%', colors: [[239, 68, 68], [251, 191, 36], [34, 197, 94], [59, 130, 246]] },
        { name: 'Soil Moisture', min: 0, max: 100, unit: '%', colors: [[239, 68, 68], [251, 191, 36], [34, 197, 94], [59, 130, 246]] },
        { name: 'Pressure', min: 980, max: 1020, unit: 'hPa', colors: [[59, 130, 246], [34, 197, 94], [251, 191, 36], [239, 68, 68]] },
        { name: 'Wind Speed', min: 0, max: 30, unit: 'km/h', colors: [[59, 130, 246], [34, 197, 94], [251, 191, 36], [239, 68, 68]] },
        { name: 'Cloud Cover', min: 0, max: 100, unit: '%', colors: [[59, 130, 246], [34, 197, 94], [251, 191, 36], [239, 68, 68]] }
    ];

    const currentMetric = metrics.find(m => m.name === selectedMetric) || metrics[0];

    // Enhanced GeoJSON with metric data
    const enhancedGeoJson = useMemo(() => {
        const features = tnDistricts.features.map(feature => {
            const districtName = feature.properties.NAME_2;
            // Get current metric value or use reasonable default
            const value = weatherData[districtName]?.current?.[selectedMetric.toLowerCase().replace(' ', '_')] ||
                currentMetric.min + Math.random() * (currentMetric.max - currentMetric.min);

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    metricValue: value,
                    name: districtName
                }
            };
        });

        return {
            type: 'FeatureCollection',
            features
        };
    }, [weatherData, selectedMetric]);

    // Lighting setup for 3D effect
    const lightingEffect = useMemo(() => {
        const ambientLight = new AmbientLight({
            color: [255, 255, 255],
            intensity: 0.3
        });

        const directionalLight = new DirectionalLight({
            color: [255, 255, 255],
            intensity: 0.7,
            direction: [-1, -1, -1]
        });

        return new LightingEffect({ ambientLight, directionalLight });
    }, []);

    // Color scale for current metric
    const getColor = (value) => {
        const { min, max, colors } = currentMetric;
        const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

        const colorCount = colors.length;
        const index = Math.floor(normalized * (colorCount - 1));
        const nextIndex = Math.min(index + 1, colorCount - 1);
        const localT = (normalized * (colorCount - 1)) - index;

        const color1 = colors[index];
        const color2 = colors[nextIndex];

        return [
            color1[0] + (color2[0] - color1[0]) * localT,
            color1[1] + (color2[1] - color1[1]) * localT,
            color1[2] + (color2[2] - color1[2]) * localT
        ];
    };

    // Layer configuration
    const layers = [
        // Base map tile layer (OpenStreetMap Dark Mode)
        new TileLayer({
            id: 'tile-layer',
            data: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            minZoom: 0,
            maxZoom: 19,
            tileSize: 256,
            renderSubLayers: props => {
                const {
                    bbox: { west, south, east, north }
                } = props.tile;

                return new BitmapLayer(props, {
                    data: null,
                    image: props.data,
                    bounds: [west, south, east, north]
                });
            }
        }),
        // 3D terrain layer
        new GeoJsonLayer({
            id: 'heat-terrain-3d',
            data: enhancedGeoJson,
            extruded: extruded,
            wireframe: false,
            filled: true,

            // Extrusion height based on current metric
            getElevation: d => {
                const value = d.properties.metricValue || currentMetric.min;
                const range = currentMetric.max - currentMetric.min;
                const normalized = (value - currentMetric.min) / range;
                const baseHeight = extruded ? normalized * 50000 : 0;
                return Math.max(0, baseHeight);
            },

            // Color based on current metric
            getFillColor: d => {
                const value = d.properties.metricValue || currentMetric.min;
                const color = getColor(value);
                const isHighlighted = highlightedDistrict === d.properties.name ||
                    selectedDistrict === d.properties.name;
                const alpha = isHighlighted ? 255 : 200;
                return [...color, alpha];
            },

            // Line color
            getLineColor: d => {
                const isHighlighted = highlightedDistrict === d.properties.name ||
                    selectedDistrict === d.properties.name;
                return isHighlighted ? [255, 255, 255, 255] : [255, 255, 255, 100];
            },

            getLineWidth: d => {
                const isHighlighted = highlightedDistrict === d.properties.name ||
                    selectedDistrict === d.properties.name;
                return isHighlighted ? 3 : 1;
            },

            // Interactivity
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 100],

            onClick: (info) => {
                if (info.object) {
                    setHighlightedDistrict(info.object.properties.name);
                }
            },

            onHover: (info) => {
                // Can add tooltip functionality here
            },

            // Performance
            updateTriggers: {
                getElevation: [extruded],
                getFillColor: [highlightedDistrict, selectedDistrict],
                getLineColor: [highlightedDistrict, selectedDistrict],
                getLineWidth: [highlightedDistrict, selectedDistrict]
            },

            // Transitions
            transitions: {
                getElevation: {
                    duration: 1000,
                    easing: t => t * (2 - t) // easeOutQuad
                }
            }
        })
    ];

    const resetView = () => {
        setViewState({
            ...viewState,
            latitude: 11.0,
            longitude: 78.5,
            zoom: 6,
            pitch: 45,
            bearing: 0
        });
        setHighlightedDistrict(null);
    };

    const toggleExtrusion = () => {
        setExtruded(!extruded);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-full bg-black/60 rounded-xl overflow-hidden border border-white/10"
        >
            {/* DeckGL Canvas with Dark Background */}
            <DeckGL
                viewState={viewState}
                onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState)}
                controller={true}
                layers={layers}
                effects={[lightingEffect]}
                getCursor={() => 'pointer'}
                style={{ position: 'relative', width: '100%', height: '100%' }}
                parameters={{
                    clearColor: [0.08, 0.08, 0.12, 1] // Dark blue-gray background
                }}
            />

            {/* Control Panel */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* Metric Selector */}
                <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="p-3 bg-black/70 hover:bg-black/90 rounded-lg border border-white/20 
                             text-white transition-all duration-200 backdrop-blur-sm cursor-pointer text-sm"
                    title="Select Metric"
                >
                    {metrics.map(metric => (
                        <option key={metric.name} value={metric.name} className="bg-gray-900">
                            {metric.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={resetView}
                    className="p-3 bg-black/70 hover:bg-black/90 rounded-lg border border-white/20 
                             text-white transition-all duration-200 backdrop-blur-sm"
                    title="Reset View"
                >
                    <RotateCcw size={20} />
                </button>

                <button
                    onClick={toggleExtrusion}
                    className="p-3 bg-black/70 hover:bg-black/90 rounded-lg border border-white/20 
                             text-white transition-all duration-200 backdrop-blur-sm"
                    title={extruded ? "Flatten View" : "3D Extrude"}
                >
                    {extruded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <h4 className="text-white font-semibold text-sm mb-3">{selectedMetric} Scale</h4>
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex flex-col gap-1">
                        {currentMetric.colors.map((color, idx) => {
                            const range = currentMetric.max - currentMetric.min;
                            const step = range / currentMetric.colors.length;
                            const min = (currentMetric.min + step * idx).toFixed(selectedMetric === 'Pressure' ? 0 : 1);
                            const max = (currentMetric.min + step * (idx + 1)).toFixed(selectedMetric === 'Pressure' ? 0 : 1);

                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}></div>
                                    <span className="text-xs text-gray-300">{min}-{max}{currentMetric.unit}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Height = {selectedMetric}</p>
            </div>

            {/* Selected District Info */}
            {highlightedDistrict && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/50"
                >
                    <h3 className="text-cyan-400 font-bold text-lg">{highlightedDistrict}</h3>
                    <p className="text-white text-sm">
                        {enhancedGeoJson.features.find(f => f.properties.name === highlightedDistrict)
                            ?.properties.metricValue.toFixed(selectedMetric === 'Pressure' ? 0 : 1)}{currentMetric.unit}
                    </p>
                </motion.div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-xs text-gray-300">
                <p><strong>🖱️ Controls:</strong></p>
                <p>• Drag: Rotate</p>
                <p>• Scroll: Zoom</p>
                <p>• Right-click: Tilt</p>
                <p>• Click district: Highlight</p>
            </div>
        </motion.div>
    );
};

export default HeatTerrain3D;
