import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Plot from 'react-plotly.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wind, TrendingUp, Sparkles, BarChart3, Layers, Bot, X } from 'lucide-react';
import WindRose from './WindRose';
import FeatureImportance from './FeatureImportance';


const AdvancedAnalytics = () => {
    const [yieldData, setYieldData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // AI Insight State
    const [aiInsight, setAiInsight] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showInsightPanel, setShowInsightPanel] = useState(false);

    // Fetch Data (Static CSV)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch direct static file from public folder
                const response = await fetch('/Final_Model_Ready_Dataset.csv');
                if (!response.ok) throw new Error('Failed to load dataset file');
                const text = await response.text();

                // Parse CSV
                const lines = text.split('\n').filter(l => l.trim());

                // HARDCODED HEADERS (The CSV file headers are misaligned/missing for State/District/Year)
                // Based on row structure: Tamil Nadu,coimbatore,1999,Rabi,Gram,5030,3723...
                const headers = [
                    'State', 'District', 'Crop_Year', 'Season', 'Crop',
                    'Area', 'Production', 'Yield',
                    'Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed'
                ];

                const parsedData = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const obj = {};
                    headers.forEach((h, i) => {
                        let val = values[i]?.trim().replace(/['"\r]/g, '');
                        // Numeric Columns
                        if (['Crop_Year', 'Area', 'Production', 'Yield', 'Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed'].includes(h)) {
                            val = parseFloat(val);
                            if (isNaN(val)) val = 0;
                        }
                        obj[h] = val;
                    });
                    return obj;
                });

                // Stratified sampling to ensure all districts are represented
                let finalData = parsedData;

                if (parsedData.length > 5000) {
                    // Group by district
                    const byDistrict = {};
                    parsedData.forEach(row => {
                        const dist = row.District;
                        if (!byDistrict[dist]) byDistrict[dist] = [];
                        byDistrict[dist].push(row);
                    });

                    const districts = Object.keys(byDistrict);
                    const minPerDistrict = Math.max(10, Math.floor(5000 / districts.length));

                    // Sample from each district
                    finalData = [];
                    districts.forEach(dist => {
                        const records = byDistrict[dist];
                        const sampleSize = Math.min(records.length, minPerDistrict);

                        // Evenly sample across the district's records
                        const step = Math.floor(records.length / sampleSize);
                        for (let i = 0; i < sampleSize; i++) {
                            finalData.push(records[i * step]);
                        }
                    });
                }

                setYieldData(finalData);
                setLoading(false);
            } catch (err) {
                console.error("Analytics Error:", err);
                setError(err.message);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // State for filtering
    const [selectedDistrict, setSelectedDistrict] = useState('All');
    const [brushConstraints, setBrushConstraints] = useState(null); // Store brush constraints from ParCoords

    // Bubble chart axis selection
    const [bubbleXAxis, setBubbleXAxis] = useState('Temperature');
    const [bubbleYAxis, setBubbleYAxis] = useState('Precipitation');

    const axisOptions = [
        { value: 'Temperature', label: 'Temperature (°C)' },
        { value: 'Precipitation', label: 'Precipitation (mm)' },
        { value: 'Humidity', label: 'Humidity (%)' },
        { value: 'Soil_Wetness', label: 'Soil Wetness' },
        { value: 'Wind_Speed', label: 'Wind Speed (km/h)' },
        { value: 'Yield', label: 'Yield' }
    ];

    // Unique Districts
    const districts = useMemo(() => {
        if (!yieldData.length) return [];
        const d = [...new Set(yieldData.map(x => x.District))].sort();
        return ['All', ...d];
    }, [yieldData]);

    // Filter Data by District
    const districtData = useMemo(() => {
        if (selectedDistrict === 'All') return yieldData;
        return yieldData.filter(d => d.District === selectedDistrict);
    }, [yieldData, selectedDistrict]);




    // Handle ParCoords "Brush" (Restyle Event)
    const handleRestyle = (eventData) => {
        try {
            if (!eventData || !eventData[0]) {
                setBrushConstraints(null);
                return;
            }

            const updates = eventData[0];
            const constraints = {};

            Object.keys(updates).forEach(key => {
                const match = key.match(/dimensions\[(\d+)\]\.constraintrange/);
                if (match) {
                    const dimIndex = parseInt(match[1]);
                    const range = updates[key];
                    const dimMap = ['Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Yield'];
                    const dimKey = dimMap[dimIndex];

                    if (dimKey && range) {
                        constraints[dimKey] = range;
                    }
                }
            });

            setBrushConstraints(Object.keys(constraints).length > 0 ? constraints : null);
        } catch (err) {
            console.error('Error parsing restyle event:', err);
        }
    };

    // Reset brush on district change
    useEffect(() => {
        setBrushConstraints(null);
    }, [selectedDistrict]);

    // Apply brush constraints to filter data
    const tableData = useMemo(() => {
        if (!brushConstraints) return districtData;

        return districtData.filter(row => {
            return Object.entries(brushConstraints).every(([key, range]) => {
                const value = row[key];
                if (value === undefined || value === null) return false;

                if (Array.isArray(range[0])) {
                    return range.some(([min, max]) => value >= min && value <= max);
                } else {
                    const [min, max] = range;
                    return value >= min && value <= max;
                }
            });
        });
    }, [districtData, brushConstraints]);

    // 1. Parallel Coordinates Data
    const parCoordsData = useMemo(() => {
        if (!districtData.length) return [];
        const safeGet = (row, key) => row[key] || 0;
        return [{
            type: 'parcoords',
            line: {
                showscale: true,
                reversescale: true,
                colorscale: 'Jet',
                cmin: 0,
                cmax: 10,
                color: districtData.map(d => safeGet(d, 'Yield')),
                colorbar: { title: 'Yield', titleside: 'right' }
            },
            dimensions: [
                { label: 'Temp', values: districtData.map(d => safeGet(d, 'Temperature')) },
                { label: 'Rain', values: districtData.map(d => safeGet(d, 'Precipitation')) },
                { label: 'Humid', values: districtData.map(d => safeGet(d, 'Humidity')) },
                { label: 'Soil', values: districtData.map(d => safeGet(d, 'Soil_Wetness')) },
                { label: 'Yield', values: districtData.map(d => safeGet(d, 'Yield')) }
            ]
        }];
    }, [districtData]);

    // 2. Bubble Scatter Data
    const bubbleData = useMemo(() => {
        if (!districtData.length) return [];
        return [{
            type: 'scatter',
            mode: 'markers',
            x: districtData.map(d => d[bubbleXAxis] || 0),
            y: districtData.map(d => d[bubbleYAxis] || 0),
            text: districtData.map(d => `${d.District} (${d.Year || d.Crop_Year})<br>X: ${d[bubbleXAxis]}<br>Y: ${d[bubbleYAxis]}<br>Yield: ${d.Yield}`),
            marker: {
                size: districtData.map(d => Math.min(30, Math.max(5, (d.Yield || 1) * 2))),
                color: districtData.map(d => d.Soil_Wetness),
                colorscale: 'Viridis',
                colorbar: { title: 'Soil', x: -0.2 }
            }
        }];
    }, [districtData, bubbleXAxis, bubbleYAxis]);

    // 3. Correlation Heatmap
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

    // -- AI INSIGHT HANDLER (STREAMING) --
    const handleChartClick = async (dataOrEvent) => {
        if (isAiLoading) return;

        let event, points;

        // Distinguish between Plotly click (has .points) and standard React click
        if (dataOrEvent.points) {
            event = dataOrEvent.event || window.event || {};
            points = dataOrEvent.points;
            if (event.stopPropagation) event.stopPropagation();
        } else {
            event = dataOrEvent || window.event || {};
            points = [{ x: "General Area", y: 0, text: `General Analysis for ${selectedDistrict}` }];
        }

        // 1. Capture Position
        // Robust fallback for event coordinates
        const x = event.clientX || window.innerWidth / 2;
        const y = event.clientY || window.innerHeight / 2;

        // Adjust if too close to right edge
        const safeX = x > window.innerWidth - 400 ? x - 420 : x + 20;
        const safeY = y > window.innerHeight - 400 ? y - 300 : y;

        setPopupPos({ x: safeX, y: safeY });

        console.log("Chart Clicked:", dataOrEvent);
        setShowInsightPanel(true);
        setAiInsight(""); // Clear previous
        setIsAiLoading(true);

        const point = points[0];
        let context = point.text || "";
        let yearMatch = context.match(/(\d{4})/);
        let year = yearMatch ? yearMatch[0] : null;

        const payload = {
            district: selectedDistrict === "All" ? "Selected District" : selectedDistrict,
            parameter: typeof point.x === 'string' ? "Category" : (bubbleXAxis || "Value"),
            value: point.y,
            context: `Clicked on chart. X=${point.x}, Y=${point.y}. Raw: ${context}`,
            year: year
        };

        // Immediate Local Context Display (Simulated "Instant" feel)
        setAiInsight(`**Analysing ${payload.district} (${year || 'Data'})...**\n\n`);

        try {
            const response = await fetch('http://localhost:8000/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.body) throw new Error("No stream");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                setAiInsight(prev => prev + chunk);
            }
        } catch (error) {
            console.error("Stream Error", error);
            setAiInsight(prev => prev + "\n\n⚠️ Connection Error.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const correlationData = useMemo(() => {
        if (!districtData.length) return [];
        const keys = ['Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed', 'Yield'];
        const matrix = [];

        const getMean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const getCovariance = (arr1, arr2, mean1, mean2) => {
            let sum = 0;
            for (let i = 0; i < arr1.length; i++) sum += (arr1[i] - mean1) * (arr2[i] - mean2);
            return sum / arr1.length;
        };
        const getStdDev = (arr, mean) => Math.sqrt(getCovariance(arr, arr, mean, mean));

        const colData = {};
        keys.forEach(k => { colData[k] = districtData.map(d => d[k] || 0); });

        for (let i = 0; i < keys.length; i++) {
            const row = [];
            for (let j = 0; j < keys.length; j++) {
                const arr1 = colData[keys[i]];
                const arr2 = colData[keys[j]];
                const m1 = getMean(arr1);
                const m2 = getMean(arr2);
                const sd1 = getStdDev(arr1, m1);
                const sd2 = getStdDev(arr2, m2);
                if (sd1 === 0 || sd2 === 0) row.push(0);
                else row.push(getCovariance(arr1, arr2, m1, m2) / (sd1 * sd2));
            }
            matrix.push(row);
        }

        return [{
            type: 'heatmap',
            z: matrix,
            x: keys,
            y: keys,
            colorscale: 'RdBu',
            zmin: -1, zmax: 1
        }];
    }, [districtData]);


    if (loading) return <div className="text-cyan-400 p-8">Loading Analytics Dataset...</div>;
    if (error) return <div className="text-red-400 p-8">Error: {error}</div>;

    return (
        <div className="w-full mt-12 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 relative">

            {/* AI Insight Panel - Portal to detach from parent stacking context */}
            {showInsightPanel && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        drag
                        dragMomentum={false}
                        style={{
                            position: 'fixed',
                            left: popupPos.x,
                            top: popupPos.y,
                            zIndex: 99999,
                            pointerEvents: 'auto'
                        }}
                        className="w-80 md:w-96 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        {/* Header */}
                        <div className="p-3 bg-linear-to-r from-cyan-900/80 to-purple-900/80 flex justify-between items-center border-b border-white/10 cursor-move">
                            <h3 className="text-cyan-300 font-bold flex items-center gap-2 text-sm">
                                <Bot size={16} />
                                AI Field Scout
                            </h3>
                            <button onClick={() => setShowInsightPanel(false)} className="hover:bg-white/10 p-1 rounded-full text-white/70 hover:text-white">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar text-gray-300">
                            <div className="prose prose-invert prose-xs">
                                {aiInsight ? aiInsight.split('\n').map((line, i) => (
                                    <p key={i} className={`mb-1 ${line.startsWith('**') ? 'text-cyan-400 font-bold mt-2' : ''}`}>
                                        {line.replace(/\*\*/g, '')}
                                    </p>
                                )) : <div className="text-gray-500 italic">Waiting for signal...</div>}
                                {isAiLoading && <span className="inline-block w-2 h-4 bg-cyan-500 animate-pulse ml-1" />}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            {/* DEBUG: Manual Trigger Button */}
            <button
                onClick={(e) => {
                    setPopupPos({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 150 });
                    handleChartClick({
                        points: [{ x: 2024, y: 5000, text: "Manual Test (2024)" }],
                        event: { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
                    });
                }}
                className="fixed top-24 right-4 z-[1000] bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs px-3 py-1 rounded-full backdrop-blur shadow-lg border border-cyan-400/30"
            >
                🤖 Test AI
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-400">
                    Advanced Historical Analytics
                </h2>

                {/* District Filter */}
                <select
                    value={selectedDistrict}
                    onChange={e => setSelectedDistrict(e.target.value)}
                    className="bg-slate-900 border border-white/20 text-white px-4 py-2 rounded-lg outline-none focus:border-cyan-400"
                >
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <SectionDivider title="Multi-Factor Analysis" icon={Layers} color="cyan" />

                {/* 1. Parallel Coordinates */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-1 lg:col-span-2 bg-black/60 rounded-xl p-4 border border-white/5"
                >
                    <h3 className="text-xl text-yellow-400 mb-2">📌 Multi-Factor Yield Driver Analysis</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Drag on any axis to filter data. Showing records for: <span className="text-white font-bold">{selectedDistrict}</span>
                        {brushConstraints && (
                            <span className="ml-2 text-cyan-400">
                                ({Object.keys(brushConstraints).length} filter{Object.keys(brushConstraints).length > 1 ? 's' : ''} active)
                            </span>
                        )}
                    </p>
                    <Plot
                        data={parCoordsData}
                        layout={{
                            autosize: true,
                            height: 500,
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            font: { color: '#ccc' },
                            margin: { l: 40, r: 20, t: 40, b: 20 }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '500px' }}
                        config={{ displayModeBar: false }}
                        onRestyle={handleRestyle}
                    />

                    {/* Filtered Data Table */}
                    <div className="mt-8 border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg text-white">
                                Filtered Data Records
                                <span className="ml-2 text-cyan-400 text-sm">
                                    ({tableData.length} record{tableData.length !== 1 ? 's' : ''})
                                </span>
                            </h4>
                            {brushConstraints && (
                                <button
                                    onClick={() => setBrushConstraints(null)}
                                    className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                >
                                    Clear Brush Filters
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-white sticky top-0">
                                    <tr>
                                        <th className="p-2 text-yellow-400">Year</th>
                                        <th className="p-2">District</th>
                                        <th className="p-2">Yield</th>
                                        <th className="p-2">Temp (°C)</th>
                                        <th className="p-2">Rain (mm)</th>
                                        <th className="p-2">Soil</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.slice(0, 100).map((row, idx) => (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-2">{row.Year || row.Crop_Year}</td>
                                            <td className="p-2">{row.District}</td>
                                            <td className="p-2 text-yellow-300 font-mono">{row.Yield}</td>
                                            <td className="p-2">{row.Temperature}</td>
                                            <td className="p-2">{row.Precipitation}</td>
                                            <td className="p-2">{row.Soil_Wetness}</td>
                                        </tr>
                                    ))}
                                    {tableData.length > 100 && (
                                        <tr>
                                            <td colSpan="6" className="p-2 text-center text-gray-500 italic">
                                                ...and {tableData.length - 100} more records
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                <SectionDivider title="Cluster Analysis" icon={Sparkles} color="purple" />

                {/* 2. Bubble Scatter */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black/60 rounded-xl p-4 border border-white/5 relative group cursor-pointer"
                    onClick={(e) => handleChartClick(e)}
                >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-900/80 px-2 py-1 rounded text-xs text-cyan-300 pointer-events-none z-10">
                        Click anywhere for AI Insights
                    </div>
                    <h3 className="text-xl text-cyan-400 mb-2">🫧 Climate-Yield Clusters</h3>

                    {/* Axis Selection Controls */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="text-gray-400 text-xs mb-1 block">X-Axis</label>
                            <select
                                value={bubbleXAxis}
                                onChange={e => setBubbleXAxis(e.target.value)}
                                className="w-full bg-slate-900 border border-white/20 text-white text-sm px-3 py-1.5 rounded outline-none focus:border-cyan-400"
                            >
                                {axisOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-gray-400 text-xs mb-1 block">Y-Axis</label>
                            <select
                                value={bubbleYAxis}
                                onChange={e => setBubbleYAxis(e.target.value)}
                                className="w-full bg-slate-900 border border-white/20 text-white text-sm px-3 py-1.5 rounded outline-none focus:border-cyan-400"
                            >
                                {axisOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs mb-4 italic">Size: Yield, Color: Soil Wetness</p>
                    <Plot
                        data={bubbleData}
                        layout={{
                            autosize: true,
                            height: 400,
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            font: { color: '#ccc' },
                            xaxis: { title: axisOptions.find(o => o.value === bubbleXAxis)?.label || bubbleXAxis, gridcolor: '#333' },
                            yaxis: { title: axisOptions.find(o => o.value === bubbleYAxis)?.label || bubbleYAxis, gridcolor: '#333' },
                            margin: { l: 50, r: 20, t: 20, b: 50 },
                            hovermode: 'closest',
                            clickmode: 'event'
                        }}
                        onClick={handleChartClick}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '400px', cursor: 'pointer' }}
                        config={{ displayModeBar: false }}
                    />
                </motion.div>

                {/* 3. Correlation Heatmap */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/60 rounded-xl p-4 border border-white/5"
                >
                    <h3 className="text-xl text-purple-400 mb-2">🔥 Feature Correlation</h3>
                    <p className="text-gray-400 text-sm mb-4">Variable relationships.</p>
                    <Plot
                        data={correlationData}
                        layout={{
                            autosize: true,
                            height: 400,
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            font: { color: '#ccc' },
                            xaxis: { title: 'Features', showgrid: false },
                            yaxis: { title: 'Features', showgrid: false },
                            margin: { l: 80, r: 20, t: 20, b: 80 }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '400px' }}
                        config={{ displayModeBar: false }}
                    />
                </motion.div>

                <SectionDivider title="Environmental & Key Drivers" icon={Wind} color="teal" />

                {/* 4. Wind Rose Diagram */}
                <WindRose data={districtData} />

                {/* 5. Feature Importance */}
                <FeatureImportance />

                <SectionDivider title="Long Term Trends" icon={TrendingUp} color="emerald" />

                {/* 6. Multi-Line Trend Chart */}
                <TrendChart data={districtData} onClick={handleChartClick} />


            </div>
        </div >
    );
};

// -- Reusable Divider --
const SectionDivider = ({ title, icon: Icon, color = "blue" }) => {
    // Map color names to tailwind classes (simplified for demo)
    const colorClasses = {
        cyan: "bg-cyan-500",
        purple: "bg-purple-500",
        teal: "bg-teal-500",
        orange: "bg-orange-500",
        emerald: "bg-emerald-500",
        blue: "bg-blue-500",
    };

    // Fallback or dynamic class logic
    const bgClass = colorClasses[color] || "bg-blue-500";
    const textClass = `text-${color}-400`;
    const borderClass = `border-${color}-500/30`;
    const bgGradient = `from-transparent via-${color}-500/50 to-transparent`;

    return (
        <div className="col-span-1 lg:col-span-2 flex items-center justify-center my-8">
            <div className={`h-px flex-1 bg-linear-to-r ${bgGradient}`} />
            <div className={`mx-4 p-2 rounded-full border ${borderClass} bg-opacity-20 ${bgClass.replace('bg-', 'bg-opacity-20 bg-')}`}>
                <Icon className={textClass} size={20} />
            </div>
            <div className={`h-px flex-1 bg-linear-to-r ${bgGradient}`} />
        </div>
    );
};

// -- Sub-Components --

const TrendChart = ({ data, onClick }) => {
    const chartData = useMemo(() => {
        if (!data.length) return [];

        // Group by Year
        const grouped = {};
        data.forEach(d => {
            // Fix: Data has "Year" or "Crop_Year" depending on parsing. Using safe fallback.
            const yr = d.Year || d.Crop_Year;
            if (!yr) return;
            if (!grouped[yr]) grouped[yr] = { count: 0, temp: 0, rain: 0, yield: 0 };
            grouped[yr].count++;
            grouped[yr].temp += d.Temperature;
            grouped[yr].rain += d.Precipitation;
            grouped[yr].yield += d.Yield;
        });

        const years = Object.keys(grouped).sort();
        const dates = years.map(y => y.toString());

        return [
            {
                x: dates, y: years.map(y => grouped[y].yield / grouped[y].count),
                type: 'scatter', mode: 'lines+markers', name: 'Avg Yield', line: { color: '#facc15', width: 3 }
            },
            {
                x: dates, y: years.map(y => grouped[y].temp / grouped[y].count),
                type: 'scatter', mode: 'lines', name: 'Temperature', line: { color: '#f87171' }, visible: 'legendonly'
            },
            {
                x: dates, y: years.map(y => grouped[y].rain / grouped[y].count),
                type: 'scatter', mode: 'lines', name: 'Rainfall', yaxis: 'y2', line: { color: '#38bdf8' }
            }
        ];
    }, [data]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-1 lg:col-span-2 bg-black/60 rounded-xl p-4 border border-white/5 relative group cursor-pointer"
            onClick={(e) => onClick(e)}
        >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-900/80 px-2 py-1 rounded text-xs text-cyan-300 pointer-events-none z-10">
                Click anywhere for AI Analysis
            </div>
            <h3 className="text-xl text-green-400 mb-2">📈 Long-Term Climate & Yield Trends</h3>
            <p className="text-gray-400 text-sm mb-4">Comparative analysis over time (Grouped by Year)</p>
            <Plot
                data={chartData}
                layout={{
                    autosize: true,
                    height: 450,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#ccc' },
                    xaxis: { title: { text: 'Year', font: { size: 14 } }, gridcolor: '#333' },
                    yaxis: {
                        title: { text: 'Avg Yield / Temperature (°C)', font: { size: 14 } },
                        gridcolor: '#333'
                    },
                    yaxis2: {
                        title: { text: 'Rainfall (mm)', font: { size: 14 } },
                        overlaying: 'y',
                        side: 'right',
                        showgrid: false
                    },
                    legend: { orientation: 'h', y: 1.15, x: 0.5, xanchor: 'center' },
                    margin: { l: 60, r: 60, t: 50, b: 60 },
                    hovermode: 'x unified'
                }}
                onClick={onClick}
                useResizeHandler={true}
                style={{ width: '100%', height: '450px', cursor: 'pointer' }}
                config={{ displayModeBar: true }}
            />
        </motion.div>
    );
};

// Helper Component for Insight Sections
const InsightSection = ({ title, items, color }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-2">
            <h4 className={`font-bold text-sm ${color} mb-1 uppercase tracking-wider`}>{title}</h4>
            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                {items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

export default AdvancedAnalytics;
