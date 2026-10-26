import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';

const WindRose = ({ data }) => {
    // Process wind data into directional bins
    const windRoseData = useMemo(() => {
        if (!data || !data.length) return null;

        // 8 compass directions
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const directionAngles = [0, 45, 90, 135, 180, 225, 270, 315];

        // Wind speed categories (km/h)
        const speedCategories = [
            { name: 'Calm', min: 0, max: 1, color: '#94a3b8' },
            { name: 'Light', min: 1, max: 3, color: '#60a5fa' },
            { name: 'Moderate', min: 3, max: 5, color: '#34d399' },
            { name: 'Fresh', min: 5, max: 8, color: '#fbbf24' },
            { name: 'Strong', min: 8, max: 100, color: '#f87171' }
        ];

        // Simulate realistic wind directions based on Tamil Nadu monsoon patterns
        // SW monsoon (June-Sept): predominant SW winds
        // NE monsoon (Oct-Dec): predominant NE winds
        // Hot weather (Mar-May): variable W-SW
        const simulateDirection = (windSpeed, index) => {
            // Use pseudo-random but consistent distribution based on data index
            const seed = (index * 2654435761) % (2 ** 31);
            const random = (seed / (2 ** 31));

            // Weight towards SW (60%) and NE (20%), others (20%)
            if (random < 0.6) {
                // SW monsoon dominance - SW, WSW, SSW
                return directions[5 + Math.floor((seed % 3) - 1)] || 'SW'; // SW, W, S
            } else if (random < 0.8) {
                // NE monsoon - NE, NNE, ENE
                return directions[1 + Math.floor((seed % 3) - 1)] || 'NE'; // NE, N, E
            } else {
                // Variable - any direction
                return directions[seed % 8];
            }
        };

        // Count occurrences by direction and speed category
        const counts = {};
        directions.forEach(dir => {
            counts[dir] = {};
            speedCategories.forEach(cat => {
                counts[dir][cat.name] = 0;
            });
        });

        // Process each data point
        data.forEach((row, idx) => {
            const speed = row.Wind_Speed || 0;
            const direction = simulateDirection(speed, idx);

            // Find speed category
            const category = speedCategories.find(cat =>
                speed >= cat.min && speed < cat.max
            ) || speedCategories[0];

            if (counts[direction]) {
                counts[direction][category.name]++;
            }
        });

        // Convert counts to percentages
        const total = data.length;
        const percentages = {};
        directions.forEach(dir => {
            percentages[dir] = {};
            speedCategories.forEach(cat => {
                percentages[dir][cat.name] = (counts[dir][cat.name] / total) * 100;
            });
        });

        // Create Plotly traces for each speed category (stacked bars)
        const traces = speedCategories.map(category => {
            return {
                type: 'barpolar',
                name: category.name,
                r: directions.map(dir => percentages[dir][category.name]),
                theta: directions,
                marker: {
                    color: category.color,
                    line: {
                        color: 'rgba(0,0,0,0.3)',
                        width: 1
                    }
                },
                hovertemplate: `<b>%{theta}</b><br>` +
                    `${category.name}: %{r:.2f}%<br>` +
                    `<extra></extra>`,
            };
        });

        return { traces, speedCategories, total };
    }, [data]);

    if (!windRoseData) {
        return (
            <div className="bg-black/60 rounded-xl p-4 border border-white/5 h-[400px] flex items-center justify-center">
                <p className="text-gray-400">No wind data available</p>
            </div>
        );
    }

    const { traces, speedCategories, total } = windRoseData;

    // Calculate average wind speed
    const avgWindSpeed = useMemo(() => {
        if (!data || !data.length) return 0;
        const sum = data.reduce((acc, row) => acc + (row.Wind_Speed || 0), 0);
        return (sum / data.length).toFixed(2);
    }, [data]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-black/60 rounded-xl p-4 border border-white/5"
        >
            <div className="flex items-center gap-2 mb-2">
                <Wind className="text-sky-400" size={20} />
                <h3 className="text-xl text-sky-400 font-bold">Wind Rose Diagram</h3>
            </div>

            <p className="text-gray-400 text-sm mb-4">
                Wind direction distribution • Avg Speed: <span className="text-white font-mono">{avgWindSpeed} km/h</span> •
                <span className="text-cyan-400 ml-1">{total} records</span>
            </p>

            <Plot
                data={traces}
                layout={{
                    autosize: true,
                    height: 450,
                    polar: {
                        radialaxis: {
                            visible: true,
                            range: [0, Math.max(...traces[0].r.map((_, i) =>
                                traces.reduce((sum, trace) => sum + trace.r[i], 0)
                            )) * 1.1],
                            ticksuffix: '%',
                            tickfont: { color: '#9ca3af', size: 10 },
                            gridcolor: '#374151',
                        },
                        angularaxis: {
                            direction: 'clockwise',
                            rotation: 90,
                            tickfont: { color: '#fff', size: 12, weight: 'bold' },
                            gridcolor: '#374151',
                        },
                        bgcolor: 'rgba(0,0,0,0)',
                    },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#ccc', family: 'Inter, sans-serif' },
                    showlegend: true,
                    legend: {
                        orientation: 'h',
                        y: -0.15,
                        x: 0.5,
                        xanchor: 'center',
                        font: { color: '#e5e7eb', size: 11 },
                        bgcolor: 'rgba(0,0,0,0.5)',
                        bordercolor: 'rgba(255,255,255,0.1)',
                        borderwidth: 1,
                    },
                    margin: { l: 60, r: 60, t: 20, b: 80 },
                    barmode: 'stack',
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '450px' }}
                config={{
                    displayModeBar: false,
                    responsive: true
                }}
            />

            {/* Wind Speed Legend */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-2">Wind Speed Categories (km/h):</p>
                <div className="flex flex-wrap gap-3">
                    {speedCategories.map(cat => (
                        <div key={cat.name} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs text-gray-400">
                                {cat.name} ({cat.min}-{cat.max > 50 ? cat.max + '+' : cat.max})
                            </span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                    * Direction patterns simulated based on Tamil Nadu monsoon climatology
                </p>
            </div>
        </motion.div>
    );
};

export default WindRose;
