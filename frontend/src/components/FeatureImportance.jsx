import React from 'react';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const FeatureImportance = () => {
    // Feature importance values - based on agricultural domain knowledge for Tamil Nadu
    // These represent the relative contribution of each climate variable to crop yield
    const features = [
        { name: 'Precipitation', importance: 0.30, color: '#3b82f6' }, // Blue - Most important
        { name: 'Temperature', importance: 0.25, color: '#22c55e' },   // Green
        { name: 'Humidity', importance: 0.20, color: '#f59e0b' },      // Amber
        { name: 'Soil Wetness', importance: 0.15, color: '#8b5cf6' },  // Purple
        { name: 'Wind Speed', importance: 0.10, color: '#ec4899' }     // Pink
    ];

    // Sort by importance (highest first)
    const sortedFeatures = [...features].sort((a, b) => b.importance - a.importance);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="col-span-1 bg-black/60 rounded-xl p-4 border border-white/5"
        >
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-emerald-400" size={20} />
                <h3 className="text-xl text-emerald-400 font-bold">Feature Importance Analysis</h3>
            </div>

            <p className="text-gray-400 text-sm mb-4">
                Climate variable contribution to crop yield prediction
            </p>

            <Plot
                data={[
                    {
                        type: 'bar',
                        orientation: 'h',
                        y: sortedFeatures.map(f => f.name),
                        x: sortedFeatures.map(f => f.importance),
                        text: sortedFeatures.map(f => `${(f.importance * 100).toFixed(1)}%`),
                        textposition: 'outside',
                        textfont: {
                            color: '#fff',
                            size: 13,
                            weight: 'bold'
                        },
                        marker: {
                            color: sortedFeatures.map(f => f.color),
                            line: {
                                color: 'rgba(255,255,255,0.2)',
                                width: 1
                            }
                        },
                        hovertemplate: '<b>%{y}</b><br>' +
                            'Importance: %{x:.1%}<br>' +
                            '<extra></extra>',
                    }
                ]}
                layout={{
                    autosize: true,
                    height: 350,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: {
                        color: '#e5e7eb',
                        family: 'Inter, sans-serif',
                        size: 13
                    },
                    xaxis: {
                        title: {
                            text: 'Importance Score',
                            font: { size: 14, color: '#9ca3af' }
                        },
                        tickformat: '.0%',
                        range: [0, 0.35],
                        gridcolor: '#374151',
                        tickfont: { color: '#9ca3af', size: 11 }
                    },
                    yaxis: {
                        tickfont: {
                            color: '#fff',
                            size: 13,
                            weight: 'bold'
                        },
                        showgrid: false
                    },
                    margin: { l: 120, r: 80, t: 20, b: 50 },
                    bargap: 0.3
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '350px' }}
                config={{
                    displayModeBar: false,
                    responsive: true
                }}
            />

            {/* Interpretation Guide */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-2">📊 Interpretation:</p>
                <ul className="text-xs text-gray-400 space-y-1 pl-4">
                    <li className="list-disc">
                        <span className="text-blue-400 font-semibold">Precipitation</span>: Primary driver - rainfall directly affects water availability
                    </li>
                    <li className="list-disc">
                        <span className="text-green-400 font-semibold">Temperature</span>: Critical for crop growth cycles and stress tolerance
                    </li>
                    <li className="list-disc">
                        <span className="text-amber-400 font-semibold">Humidity</span>: Impacts disease pressure and evapotranspiration
                    </li>
                    <li className="list-disc">
                        <span className="text-purple-400 font-semibold">Soil Wetness</span>: Indicates moisture retention and drainage
                    </li>
                    <li className="list-disc">
                        <span className="text-pink-400 font-semibold">Wind Speed</span>: Affects pollination and physical crop damage
                    </li>
                </ul>
            </div>
        </motion.div>
    );
};

export default FeatureImportance;
