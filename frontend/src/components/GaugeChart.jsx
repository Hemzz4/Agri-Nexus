import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';

const GaugeChart = ({
    value,
    min,
    max,
    title,
    unit,
    icon: Icon,
    colorRanges = [],
    delay = 0
}) => {
    // Default color ranges if not provided
    const defaultRanges = [
        { range: [min, min + (max - min) * 0.33], color: '#3b82f6' }, // Blue
        { range: [min + (max - min) * 0.33, min + (max - min) * 0.67], color: '#22c55e' }, // Green
        { range: [min + (max - min) * 0.67, max], color: '#ef4444' }, // Red
    ];

    const ranges = colorRanges.length > 0 ? colorRanges : defaultRanges;

    // Create steps for gauge background
    const steps = ranges.map(r => ({
        range: r.range,
        color: r.color,
        thickness: 0.8
    }));

    // Memoize gauge data to ensure it updates when value changes
    const gaugeData = useMemo(() => [{
        type: 'indicator',
        mode: 'gauge+number',
        value: value,
        number: {
            suffix: ` ${unit}`,
            font: {
                size: 32,
                color: '#fff',
                family: 'Inter, sans-serif',
                weight: 'bold'
            }
        },
        gauge: {
            axis: {
                range: [min, max],
                tickwidth: 2,
                tickcolor: '#475569',
                tickfont: { color: '#94a3b8', size: 11 },
                showticklabels: true
            },
            bar: {
                color: '#06b6d4', // Cyan pointer
                thickness: 0.7
            },
            bgcolor: 'rgba(0,0,0,0)',
            borderwidth: 0,
            steps: steps,
            threshold: {
                line: { color: 'white', width: 3 },
                thickness: 0.8,
                value: value
            }
        }
    }], [value, min, max, unit, steps]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            className="bg-black/60 rounded-xl p-4 border border-white/5 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="text-cyan-400" size={18} />}
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    {title}
                </h3>
            </div>

            {/* Gauge Plot */}
            <div className="flex-1 flex items-center justify-center">
                <Plot
                    data={gaugeData}
                    layout={{
                        autosize: true,
                        height: 250,
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: {
                            color: '#e5e7eb',
                            family: 'Inter, sans-serif'
                        },
                        margin: { l: 30, r: 30, t: 10, b: 10 },
                        showlegend: false,
                    }}
                    revision={value}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '250px' }}
                    config={{
                        displayModeBar: false,
                        responsive: true
                    }}
                />
            </div>

            {/* Range Labels */}
            <div className="mt-2 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Min: {min}{unit}</span>
                    <span className="text-gray-500">Max: {max}{unit}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default GaugeChart;
