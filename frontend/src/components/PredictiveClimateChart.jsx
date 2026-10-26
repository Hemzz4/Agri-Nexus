import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, MapPin, Thermometer, Droplets, Wind, Sprout,
    Download, Sparkles, Activity, X, Check, Eye, EyeOff, BarChart3, Layers, Lightbulb
} from 'lucide-react';

// Tamil Nadu districts
const TN_DISTRICTS = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi',
    'Dindigul', 'Thanjavur', 'Ranipet', 'Sivaganga', 'Karur',
    'Ramanathapuram', 'Virudhunagar', 'Cuddalore', 'Kanchipuram',
    'Nagapattinam', 'Viluppuram'
];

// Climate parameters
const CLIMATE_PARAMETERS = [
    {
        value: 'Temperature',
        label: 'Temperature',
        unit: '°C',
        icon: Thermometer,
        color: '#ef4444',
        gradient: 'from-red-500 via-orange-500 to-yellow-500',
        baseline: 28,
        variance: 3
    },
    {
        value: 'Humidity',
        label: 'Humidity',
        unit: '%',
        icon: Droplets,
        color: '#3b82f6',
        gradient: 'from-blue-500 via-cyan-500 to-teal-500',
        baseline: 65,
        variance: 10
    },
    {
        value: 'Precipitation',
        label: 'Precipitation',
        unit: 'mm',
        icon: Droplets,
        color: '#10b981',
        gradient: 'from-emerald-500 via-green-500 to-lime-500',
        baseline: 80,
        variance: 40
    },
    {
        value: 'Soil_Wetness',
        label: 'Soil Wetness',
        unit: '',
        icon: Sprout,
        color: '#8b5cf6',
        gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
        baseline: 0.6,
        variance: 0.2
    },
    {
        value: 'Wind_Speed',
        label: 'Wind Speed',
        unit: 'm/s',
        icon: Wind,
        color: '#f59e0b',
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        baseline: 3.5,
        variance: 1.5
    }
];

// Hardcoded Crop Insights
const CROP_INSIGHTS = {
    "coimbatore": {
        "Kharif": [
            "Brisk winds in early season favor sturdy crops like Maize and Sorghum; stake properly if wind speed > 15km/h.",
            "Moderate rainfall requires efficient drainage planning for Groundnut to prevent pod rot.",
            "High humidity variance suggests close monitoring for fungal onset in Pulses; apply prophylactic bio-fungicides."
        ],
        "Rabi": [
            "Cooler nights significantly boost pulse formation in Bengal Gram; ensure sowing by late October.",
            "Minimal rainfall makes this season optimal for drought-tolerant varieties; supplemented irrigation boosts yields by 20%.",
            "Ideal conditions for vegetable intercropping with main cereal crops to maximize land equivalent ratio."
        ],
        "Whole Year": [
            "Bimodal rainfall pattern supports dual-cropping cycles efficiently; look for short-duration varieties.",
            "Groundwater stability allows for consistent cash crop performance; drip irrigation recommended.",
            "Soil calcareousness requires micro-nutrient management (Zinc/Iron) for optimal yield."
        ]
    },
    "thanjavur": {
        "Kharif": [
            "Kuruvai season demands short-duration, high-yield Rice varieties (e.g., ADT 43).",
            "Crucial to manage canal water release timing for nursery preparation; synchronize with PWD release schedule.",
            "High susceptibility to pest migration (Stem Borer); install pheromone traps early."
        ],
        "Rabi": [
            "Samba season ideal for traditional and premium Rice varieties; longer grain filling duration enhances quality.",
            "Northeast monsoon intensity dictates drainage infrastructure readiness to prevent submergence.",
            "Post-monsoon soil moisture retention benefits follow-up Pulse crops (Rice Fallow Pulses)."
        ],
        "Whole Year": [
            "Deltaic alluvial soil supports intensive rice-based cropping systems; green manure incorporation recommended.",
            "Salinity intrusion risk in coastal belts requires periodic soil testing and gypsum application.",
            "Continuous cropping necessitates integrated nutrient management to prevent organic carbon depletion."
        ]
    },
    "madurai": {
        "Kharif": [
            "Higher ambient temperatures favor heat-tolerant Millet varieties (Pearl Millet, Sorghum).",
            "Supplemental irrigation is often critical during dry spells in July-August.",
            "Focus on drought-resistant Legumes to maintain soil health and fix atmospheric nitrogen."
        ],
        "Rabi": [
            "Northeast monsoon rains are the primary water source; maximize catchment with farm ponds.",
            "Cooler wet season boosts yield for Paddy and Chillies; watch for leaf curl virus.",
            "Late-season moisture stress management is key for terminal yields; spray KCL 1%."
        ]
    },
    "salem": {
        "Kharif": [
            "Red loamy soil supports excellent Groundnut and Castor establishment.",
            "Erratic rainfall distribution requires risk-mitigating intercropping strategies (e.g., Groundnut + Redgram).",
            "Monitor soil moisture for Tapioca tuber development."
        ],
        "Rabi": [
            "Temperature dip favors winter Pulses like Horsegram and Blackgram.",
            "Reduced pest load in cooler months allows for lower pesticide usage.",
            "Mango flowering induction requires surveillance for hoppers during December-January."
        ]
    },
    "generic": {
        "Kharif": [
            "South-West monsoon influence requires robust drainage systems to prevent waterlogging.",
            "High humidity may trigger fungal outbreaks; prophylactic sprays (Neem oil) advised.",
            "Focus on nitrogen efficiency during vegetative growth stages to maximize biomass."
        ],
        "Rabi": [
            "Cool, dry weather favors grain filling and pulse maturation; ensure harvest before summer heat.",
            "Residual soil moisture is critical; practice conservation tillage to retain water.",
            "Dew formation can be leveraged for foliar nutrient absorption in early mornings."
        ],
        "Whole Year": [
            "Crop rotation with Legumes is essential for nitrogen fixation and breaking pest cycles.",
            "Soil organic matter depletion requires regular compost/FYM addition (12.5 t/ha).",
            "Integrated Pest Management (IPM) is recommended for long-term sustainability and cost reduction."
        ]
    }
};

// Generate historical data
const generateHistoricalData = (district, parameter, startYear = 2010) => {
    const param = CLIMATE_PARAMETERS.find(p => p.value === parameter);
    const data = [];
    const currentDate = new Date();
    const startDate = new Date(startYear, 0, 1);

    const districtSeed = district.length * 123.456;
    const districtAdjustment = (Math.sin(districtSeed) * 0.1 + 1);
    const totalMonths = (currentDate.getFullYear() - startYear) * 12 + currentDate.getMonth();

    for (let month = 0; month < totalMonths; month++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + month);
        const monthOfYear = date.getMonth();
        const seasonal = Math.sin((monthOfYear / 12) * 2 * Math.PI) * param.variance * 0.5;
        const trend = (month / totalMonths) * param.variance * 0.3;
        const noise = (Math.random() - 0.5) * param.variance * 0.4;
        const value = (param.baseline * districtAdjustment) + seasonal + trend + noise;

        data.push({
            date: date.toISOString().slice(0, 7),
            value: Math.max(0, parseFloat(value.toFixed(2)))
        });
    }
    return data;
};

// Predict future
const predictFuture = (historicalData, monthsAhead = 60) => {
    const recentData = historicalData.slice(-24);
    const n = recentData.length;
    const xValues = recentData.map((_, i) => i);
    const yValues = recentData.map(d => d.value);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions = xValues.map(x => slope * x + intercept);
    const residuals = yValues.map((y, i) => y - predictions[i]);
    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / n;
    const stdDev = Math.sqrt(variance);

    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    const futureData = [];

    for (let month = 1; month <= monthsAhead; month++) {
        const futureDate = new Date(lastDate);
        futureDate.setMonth(futureDate.getMonth() + month);
        const monthOfYear = futureDate.getMonth();
        const seasonal = Math.sin((monthOfYear / 12) * 2 * Math.PI) * stdDev * 0.5;
        const predicted = slope * (n + month) + intercept + seasonal;

        futureData.push({
            date: futureDate.toISOString().slice(0, 7),
            predicted: parseFloat(predicted.toFixed(2)),
            lower_bound: parseFloat((predicted - 1.96 * stdDev).toFixed(2)),
            upper_bound: parseFloat((predicted + 1.96 * stdDev).toFixed(2))
        });
    }
    return futureData;
};

const PredictiveClimateChart = () => {
    const [comparisonMode, setComparisonMode] = useState('districts');
    const [selectedParameter, setSelectedParameter] = useState('Temperature');
    const [selectedDistricts, setSelectedDistricts] = useState(['Chennai', 'Coimbatore']);
    const [selectedParameters, setSelectedParameters] = useState(['Temperature', 'Humidity']);
    const [selectedDistrict, setSelectedDistrict] = useState('Chennai');
    const [visibleTraces, setVisibleTraces] = useState({});
    const [clickedPoint, setClickedPoint] = useState(null);

    const DISTRICT_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    const predictions = useMemo(() => {
        if (comparisonMode === 'districts') {
            return selectedDistricts.map(district => {
                const historical = generateHistoricalData(district, selectedParameter);
                const future = predictFuture(historical, 60);
                const filtered = future.filter(f => {
                    const year = parseInt(f.date.split('-')[0]);
                    return year >= 2026 && year <= 2030;
                });

                return { district, parameter: selectedParameter, historical, predictions: filtered };
            });
        } else {
            return selectedParameters.map(parameter => {
                const historical = generateHistoricalData(selectedDistrict, parameter);
                const future = predictFuture(historical, 60);
                const filtered = future.filter(f => {
                    const year = parseInt(f.date.split('-')[0]);
                    return year >= 2026 && year <= 2030;
                });

                return { district: selectedDistrict, parameter, historical, predictions: filtered };
            });
        }
    }, [comparisonMode, selectedParameter, selectedDistricts, selectedParameters, selectedDistrict]);

    const plotData = predictions.flatMap((pred, idx) => {
        const param = CLIMATE_PARAMETERS.find(p => p.value === pred.parameter);
        const color = comparisonMode === 'districts' ? DISTRICT_COLORS[idx % DISTRICT_COLORS.length] : param.color;
        const traceId = comparisonMode === 'districts' ? pred.district : pred.parameter;
        const isVisible = visibleTraces[traceId] !== false;

        return [
            {
                x: pred.historical.map(d => d.date),
                y: pred.historical.map(d => d.value),
                type: 'scatter',
                mode: 'lines',
                name: `${comparisonMode === 'districts' ? pred.district : param.label} (Historical)`,
                line: { color: color, width: 2, dash: 'dot' },
                visible: isVisible,
                legendgroup: traceId,
                customdata: pred.historical.map(d => ({
                    district: pred.district,
                    parameter: pred.parameter,
                    type: 'historical',
                    value: d.value,
                    date: d.date
                })),
                hovertemplate: '<b>%{x}</b><br>Value: %{y:.2f}<br><extra></extra>'
            },
            {
                x: pred.predictions.map(d => d.date),
                y: pred.predictions.map(d => d.predicted),
                type: 'scatter',
                mode: 'lines+markers',
                name: `${comparisonMode === 'districts' ? pred.district : param.label} (Predicted)`,
                line: { color: color, width: 3 },
                marker: { size: 5 },
                visible: isVisible,
                legendgroup: traceId,
                customdata: pred.predictions.map(d => ({
                    district: pred.district,
                    parameter: pred.parameter,
                    type: 'predicted',
                    value: d.predicted,
                    date: d.date,
                    lower: d.lower_bound,
                    upper: d.upper_bound
                })),
                hovertemplate: '<b>%{x}</b><br>Predicted: %{y:.2f}<br><extra></extra>'
            },
            {
                x: [...pred.predictions.map(d => d.date), ...pred.predictions.map(d => d.date).reverse()],
                y: [...pred.predictions.map(d => d.upper_bound), ...pred.predictions.map(d => d.lower_bound).reverse()],
                fill: 'toself',
                fillcolor: `${color}33`,
                line: { color: 'transparent' },
                type: 'scatter',
                showlegend: false,
                visible: isVisible,
                legendgroup: traceId,
                hoverinfo: 'skip'
            }
        ];
    });

    const currentParam = CLIMATE_PARAMETERS.find(p => p.value === selectedParameter);

    const layout = {
        title: {
            text: comparisonMode === 'districts'
                ? `${currentParam.label} Predictions Across Districts (2010-2030)`
                : `Multi-Parameter Predictions for ${selectedDistrict} (2010-2030)`,
            font: { color: '#fff', size: 18, family: 'Inter, system-ui, sans-serif', weight: 600 }
        },
        xaxis: {
            title: 'Date',
            gridcolor: '#374151',
            color: '#9ca3af',
            showgrid: true,
            range: ['2023-01', '2030-12']
        },
        yaxis: {
            title: comparisonMode === 'districts' ? `${currentParam.label} (${currentParam.unit})` : 'Value',
            gridcolor: '#374151',
            color: '#9ca3af',
            showgrid: true
        },
        plot_bgcolor: 'rgba(15, 23, 42, 0.95)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#ffffff', family: 'Inter, system-ui, sans-serif' },
        hovermode: 'x unified',
        showlegend: true,
        legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
            bgcolor: 'rgba(30, 41, 59, 0.9)',
            bordercolor: '#475569',
            borderwidth: 1,
            font: { color: '#fff', size: 10 }
        },
        margin: { t: 60, b: 50, l: 70, r: 140 },
        dragmode: 'zoom'
    };

    const toggleDistrict = (district) => {
        if (selectedDistricts.includes(district)) {
            if (selectedDistricts.length > 1) {
                setSelectedDistricts(selectedDistricts.filter(d => d !== district));
            }
        } else {
            if (selectedDistricts.length < 5) {
                setSelectedDistricts([...selectedDistricts, district]);
            }
        }
    };

    const toggleParameter = (parameter) => {
        if (selectedParameters.includes(parameter)) {
            if (selectedParameters.length > 1) {
                setSelectedParameters(selectedParameters.filter(p => p !== parameter));
            }
        } else {
            if (selectedParameters.length < 5) {
                setSelectedParameters([...selectedParameters, parameter]);
            }
        }
    };

    const toggleTraceVisibility = (traceId) => {
        setVisibleTraces(prev => ({
            ...prev,
            [traceId]: prev[traceId] === false
        }));
    };

    return (
        <div className="w-full space-y-4 font-['Inter',system-ui,sans-serif]">
            {/* Modern Mode Selector */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-white/10 p-5 shadow-2xl"
            >
                <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers className="text-cyan-400" size={20} />
                        <h3 className="text-lg font-bold text-white tracking-tight">Comparison Mode</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setComparisonMode('districts')}
                            className={`relative overflow-hidden p-5 rounded-xl border-2 transition-all duration-300 ${comparisonMode === 'districts'
                                ? 'bg-linear-to-br from-cyan-600 to-blue-700 border-cyan-400/50 shadow-lg shadow-cyan-500/30'
                                : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-700/50'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <MapPin className={comparisonMode === 'districts' ? 'text-white' : 'text-cyan-400'} size={32} strokeWidth={2.5} />
                                <p className={`font-bold text-sm ${comparisonMode === 'districts' ? 'text-white' : 'text-slate-300'}`}>
                                    Multi-District
                                </p>
                                <p className={`text-xs ${comparisonMode === 'districts' ? 'text-cyan-100' : 'text-slate-500'}`}>
                                    Compare across regions
                                </p>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setComparisonMode('parameters')}
                            className={`relative overflow-hidden p-5 rounded-xl border-2 transition-all duration-300 ${comparisonMode === 'parameters'
                                ? 'bg-linear-to-br from-purple-600 to-pink-700 border-purple-400/50 shadow-lg shadow-purple-500/30'
                                : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30 hover:bg-slate-700/50'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <BarChart3 className={comparisonMode === 'parameters' ? 'text-white' : 'text-purple-400'} size={32} strokeWidth={2.5} />
                                <p className={`font-bold text-sm ${comparisonMode === 'parameters' ? 'text-white' : 'text-slate-300'}`}>
                                    Multi-Parameter
                                </p>
                                <p className={`text-xs ${comparisonMode === 'parameters' ? 'text-purple-100' : 'text-slate-500'}`}>
                                    Compare climate factors
                                </p>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Selection Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {comparisonMode === 'districts' ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-2xl bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 p-5 shadow-xl"
                        >
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="text-emerald-400" size={18} />
                                Climate Parameter
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                {CLIMATE_PARAMETERS.map((param, idx) => {
                                    const Icon = param.icon;
                                    const isSelected = selectedParameter === param.value;
                                    return (
                                        <motion.button
                                            key={param.value}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedParameter(param.value)}
                                            className={`relative overflow-hidden p-3.5 rounded-xl border-2 transition-all duration-300 ${isSelected
                                                ? `bg-linear-to-br ${param.gradient} border-white/30 shadow-lg`
                                                : 'bg-slate-800/50 border-slate-700/40 hover:border-slate-600'
                                                }`}
                                        >

                                            <Icon className={`relative z-10 ${isSelected ? 'text-white drop-shadow-lg' : 'text-slate-400 group-hover:text-slate-300'}`} size={24} strokeWidth={2} />
                                            <p className={`relative z-10 text-xs font-bold mt-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                {param.label}
                                            </p>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-linear-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg"
                                                >
                                                    <Check size={12} className="text-white" strokeWidth={3} />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-2xl bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 p-5 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <MapPin className="text-blue-400" size={18} />
                                    Districts
                                </h3>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                                    {selectedDistricts.length}/5
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                {TN_DISTRICTS.map((district, idx) => {
                                    const isSelected = selectedDistricts.includes(district);
                                    const isDisabled = !isSelected && selectedDistricts.length >= 5;
                                    const color = DISTRICT_COLORS[selectedDistricts.indexOf(district)];

                                    return (
                                        <motion.button
                                            key={district}
                                            whileHover={!isDisabled && { scale: 1.05 }}
                                            whileTap={!isDisabled && { scale: 0.95 }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.01 }}
                                            onClick={() => !isDisabled && toggleDistrict(district)}
                                            disabled={isDisabled}
                                            className={`relative overflow-hidden px-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${isSelected
                                                ? 'text-white shadow-md'
                                                : isDisabled
                                                    ? 'bg-slate-800/30 text-slate-700 cursor-not-allowed'
                                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
                                                }`}
                                            style={isSelected ? { backgroundColor: color + 'E6', borderColor: color } : {}}
                                        >
                                            {district}
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center"
                                                >
                                                    <Check size={8} className="text-green-600" strokeWidth={4} />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-2xl bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 p-5 shadow-xl"
                        >
                            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                <MapPin className="text-blue-400" size={18} />
                                Select District
                            </h3>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                className="w-full bg-slate-800/80 border-2 border-slate-700 text-white font-semibold p-3 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                {TN_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-2xl bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 p-5 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="text-emerald-400" size={18} />
                                    Parameters
                                </h3>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                                    {selectedParameters.length}/5
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {CLIMATE_PARAMETERS.map((param, idx) => {
                                    const Icon = param.icon;
                                    const isSelected = selectedParameters.includes(param.value);
                                    const isDisabled = !isSelected && selectedParameters.length >= 5;

                                    return (
                                        <motion.button
                                            key={param.value}
                                            whileHover={!isDisabled && { scale: 1.05, y: -2 }}
                                            whileTap={!isDisabled && { scale: 0.95 }}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => !isDisabled && toggleParameter(param.value)}
                                            disabled={isDisabled}
                                            className={`relative overflow-hidden p-3.5 rounded-xl border-2 transition-all duration-300 ${isSelected
                                                ? `bg-linear-to-br ${param.gradient} border-white/30 shadow-lg`
                                                : isDisabled
                                                    ? 'bg-slate-800/30 border-slate-700/20 cursor-not-allowed opacity-50'
                                                    : 'bg-slate-800/50 border-slate-700/40 hover:border-slate-600'
                                                }`}
                                        >

                                            <Icon className={isSelected ? 'text-white drop-shadow-lg' : 'text-slate-400'} size={24} strokeWidth={2} />
                                            <p className={`text-xs font-bold mt-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                {param.label}
                                            </p>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-linear-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg"
                                                >
                                                    <Check size={12} className="text-white" strokeWidth={3} />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </div>

            {/* Visibility Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 p-5 shadow-xl"
            >
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Eye className="text-indigo-400" size={18} />
                    Toggle Visibility
                </h3>
                <div className="flex flex-wrap gap-2">
                    {(comparisonMode === 'districts' ? selectedDistricts : selectedParameters).map((item, idx) => {
                        const isVisible = visibleTraces[item] !== false;
                        const color = comparisonMode === 'districts'
                            ? DISTRICT_COLORS[idx % DISTRICT_COLORS.length]
                            : CLIMATE_PARAMETERS.find(p => p.value === item)?.color;

                        return (
                            <motion.button
                                key={item}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleTraceVisibility(item)}
                                className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 font-semibold text-xs ${isVisible
                                    ? 'border-white/40 shadow-md'
                                    : 'bg-slate-800/50 border-slate-700/50 opacity-50'
                                    }`}
                                style={{ backgroundColor: isVisible ? color : undefined }}
                            >
                                {isVisible ? <Eye size={14} className="text-white" /> : <EyeOff size={14} className="text-slate-400" />}
                                <span className={isVisible ? 'text-white' : 'text-slate-400'}>
                                    {comparisonMode === 'parameters' ? CLIMATE_PARAMETERS.find(p => p.value === item)?.label : item}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Chart Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
            >
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Activity className="text-cyan-400" size={20} strokeWidth={2.5} />
                            Climate Forecast Timeline
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Sparkles size={14} className="text-yellow-400" />
                            <span className="font-medium">Interactive • Drag to zoom</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-0">
                    <AnimatePresence>
                        {clickedPoint && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="xl:col-span-1 border-r border-white/10"
                            >
                                <div className="p-5 h-full bg-slate-900/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                                            <Sparkles size={16} />
                                            Data Point
                                        </h4>
                                        <button
                                            onClick={() => setClickedPoint(null)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <X size={14} className="text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="mb-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                        <p className="text-xs text-cyan-400 font-semibold mb-1">Date</p>
                                        <p className="text-lg font-bold text-white">{clickedPoint.date}</p>
                                    </div>

                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {(comparisonMode === 'districts' ? predictions : predictions).map((pred, idx) => {
                                            const color = comparisonMode === 'districts'
                                                ? DISTRICT_COLORS[idx % DISTRICT_COLORS.length]
                                                : CLIMATE_PARAMETERS.find(p => p.value === pred.parameter)?.color;

                                            const dataPoint = clickedPoint.type === 'historical'
                                                ? pred.historical.find(d => d.date === clickedPoint.date)
                                                : pred.predictions.find(d => d.date === clickedPoint.date);

                                            if (!dataPoint) return null;

                                            return (
                                                <motion.div
                                                    key={comparisonMode === 'districts' ? pred.district : pred.parameter}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="p-3 rounded-xl bg-slate-800/50 border-2 hover:bg-slate-700/50 transition-all"
                                                    style={{ borderColor: color + '40' }}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                                        <h5 className="font-bold text-white text-xs">
                                                            {comparisonMode === 'districts' ? pred.district : CLIMATE_PARAMETERS.find(p => p.value === pred.parameter)?.label}
                                                        </h5>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-xs text-slate-400 mb-1">
                                                                {clickedPoint.type === 'historical' ? '📊 Value' : '🔮 Forecast'}
                                                            </p>
                                                            <p className="text-xl font-bold" style={{ color }}>
                                                                {clickedPoint.type === 'historical' ? dataPoint.value.toFixed(2) : dataPoint.predicted.toFixed(2)}
                                                                <span className="text-xs text-slate-400 ml-1">
                                                                    {comparisonMode === 'districts' ? currentParam.unit : CLIMATE_PARAMETERS.find(p => p.value === pred.parameter)?.unit}
                                                                </span>
                                                            </p>
                                                        </div>

                                                        {clickedPoint.type === 'predicted' && dataPoint.lower_bound !== undefined && (
                                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                                                                <div className="text-center p-2 bg-green-500/10 rounded-lg">
                                                                    <p className="text-xs text-green-400 font-semibold">Lower</p>
                                                                    <p className="text-sm font-bold text-green-300">{dataPoint.lower_bound.toFixed(2)}</p>
                                                                </div>
                                                                <div className="text-center p-2 bg-red-500/10 rounded-lg">
                                                                    <p className="text-xs text-red-400 font-semibold">Upper</p>
                                                                    <p className="text-sm font-bold text-red-300">{dataPoint.upper_bound.toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {clickedPoint.type === 'predicted' && (
                                        <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                            <p className="text-xs text-blue-300 font-medium">95% Confidence Interval</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`${clickedPoint ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
                        <div className="h-[650px]">
                            <Plot
                                data={plotData}
                                layout={layout}
                                config={{
                                    displayModeBar: true,
                                    displaylogo: false,
                                    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                                    responsive: true,
                                    scrollZoom: true
                                }}
                                style={{ width: '100%', height: '100%' }}
                                useResizeHandler={true}
                                onClick={(data) => {
                                    if (data.points && data.points.length > 0) {
                                        const point = data.points[0];
                                        if (point.customdata) {
                                            setClickedPoint({
                                                date: point.customdata.date,
                                                type: point.customdata.type
                                            });
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>


            {/* CROP RECOMMENDATION SECTION - Distinctive Advanced Design */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 relative"
            >
                {/* Section Divider with Icon */}
                <div className="flex items-center justify-center mb-8">
                    <div className="h-px flex-1 bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
                    <div className="mx-4 p-3 bg-linear-to-br from-amber-500/20 to-orange-500/20 rounded-full border-2 border-amber-500/30">
                        <Sprout className="text-amber-400" size={24} />
                    </div>
                    <div className="h-px flex-1 bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
                </div>

                <CropRecommendationSection />
            </motion.div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(51, 65, 85, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.5);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.7);
                }
            `}</style>
        </div>
    );
};

// CROP RECOMMENDATION COMPONENT - Advanced Design
const CropRecommendationSection = () => {
    const [selectedDistrict, setSelectedDistrict] = useState('coimbatore');
    const [selectedSeason, setSelectedSeason] = useState('Kharif');
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const districts = TN_DISTRICTS;
    const seasons = ['Kharif', 'Rabi', 'Whole Year'];

    /* // Fetch available seasons when district changes
    useEffect(() => {
        const fetchAvailableSeasons = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/recommendations/district/${selectedDistrict}/seasons`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.seasons && data.seasons.length > 0) {
                        setAvailableSeasons(data.seasons);
                        // If current season is not available, select the first available one
                        if (!data.seasons.includes(selectedSeason)) {
                            setSelectedSeason(data.seasons[0]);
                        }
                    } else {
                        setAvailableSeasons([]);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch seasons:', err);
                setAvailableSeasons(['Kharif', 'Rabi', 'Summer']); // Fallback to all seasons
            }
        };

        fetchAvailableSeasons();
    }, [selectedDistrict]); */

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/recommendations/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    district: selectedDistrict,
                    season: selectedSeason,
                    top_n: 6
                })
            });

            if (!response.ok) throw new Error('Failed to fetch recommendations');
            const data = await response.json();
            setRecommendations(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold bg-linear-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent mb-2"
                >
                    🌾 Smart Crop Recommendation
                </motion.h2>
                <p className="text-slate-400 text-sm">AI-powered crop suggestions based on historical yield performance & climate suitability</p>
            </div>

            {/* Selection Panel - Gold Theme */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-900/30 via-orange-900/20 to-yellow-900/30 backdrop-blur-xl border-2 border-amber-500/30 p-6 shadow-2xl shadow-amber-500/10"
            >
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-linear-to-r from-amber-500/5 via-orange-500/10 to-amber-500/5 animate-pulse" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* District Selector */}
                    <div>
                        <label className="text-amber-300 text-sm font-bold mb-2 flex items-center gap-2">
                            <MapPin size={16} />
                            District
                        </label>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full bg-slate-900/80 border-2 border-amber-600/40 text-white font-semibold p-3 rounded-xl focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                        >
                            {districts.map(d => (
                                <option key={d} value={d.toLowerCase()}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Season Selector */}
                    <div>
                        <label className="text-amber-300 text-sm font-bold mb-2 flex items-center gap-2">
                            <Activity size={16} />
                            Season
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {seasons.map(season => (
                                <button
                                    key={season}
                                    onClick={() => setSelectedSeason(season)}
                                    className={`p-2.5 rounded-lg text-xs font-bold transition-all ${selectedSeason === season
                                        ? 'bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-amber-900/30'
                                        }`}
                                >
                                    {season}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-end">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={fetchRecommendations}
                            disabled={loading}
                            className="w-full bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles size={18} />
                                    </motion.div>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sprout size={18} />
                                    Get Recommendations
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Error Display */}
            {
                error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm"
                    >
                        ⚠️ {error}
                    </motion.div>
                )
            }

            {/* Recommendations Display */}
            {
                recommendations && !recommendations.no_data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="bg-linear-to-br from-amber-900/40 to-orange-900/40 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/20">
                                <p className="text-amber-400 text-xs font-semibold mb-1">District</p>
                                <p className="text-white text-lg font-bold capitalize">{recommendations.district}</p>
                            </div>
                            <div className="bg-linear-to-br from-orange-900/40 to-amber-900/40 backdrop-blur-sm rounded-2xl p-4 border border-orange-500/20">
                                <p className="text-orange-400 text-xs font-semibold mb-1">Season</p>
                                <p className="text-white text-lg font-bold">{recommendations.season}</p>
                            </div>
                            <div className="bg-linear-to-br from-yellow-900/40 to-amber-900/40 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/20">
                                <p className="text-yellow-400 text-xs font-semibold mb-1">Crops Analyzed</p>
                                <p className="text-white text-lg font-bold">{recommendations.total_crops_analyzed}</p>
                            </div>
                            <div className="bg-linear-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-sm rounded-2xl p-4 border border-emerald-500/20">
                                <p className="text-emerald-400 text-xs font-semibold mb-1">Top Picks</p>
                                <p className="text-white text-lg font-bold">{recommendations.recommendations.length}</p>
                            </div>
                        </div>

                        {/* Crop Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendations.recommendations.map((crop, idx) => (
                                <CropCard key={crop.crop} crop={crop} rank={idx + 1} />
                            ))}
                        </div>

                        {/* ================= NEW: UNIFIED COMPACT RECOMMENDATION & INSIGHTS ================= */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="mt-8 bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            {/* TOP HEADER: COMPACT CROP SPOTLIGHT */}
                            <div className="bg-linear-to-r from-amber-600/20 via-orange-600/10 to-transparent p-4 border-b border-white/5 flex flex-col md:flex-row items-center gap-6">

                                {/* 1. Icon & Badge Group */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-14 h-14 bg-linear-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <Sprout size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold text-white leading-none">
                                                {recommendations.recommendations[0]?.crop}
                                            </h2>
                                            <span className="bg-amber-500 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                ★ Top Pick
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-medium">
                                            <p className="flex items-center gap-1">
                                                <MapPin size={12} className="text-red-400" />
                                                <span className="capitalize">{recommendations.district}</span>
                                            </p>
                                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                            <p className="text-amber-400">{recommendations.season}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Key Stats (Vertical Separator) */}
                                <div className="hidden md:block w-px h-10 bg-white/10 mx-2" />

                                <div className="flex items-center gap-8 shrink-0">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Yield Potential</p>
                                        <p className="text-lg font-bold text-emerald-400 leading-none">
                                            {recommendations.recommendations[0]?.avg_yield} <span className="text-xs font-normal text-slate-500">kg/ha</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Reliability</p>
                                        <p className="text-lg font-bold text-blue-400 leading-none">
                                            {recommendations.recommendations[0]?.reliability_score}<span className="text-sm text-slate-500">/100</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM CONTENT: INSIGHTS LIST */}
                            <div className="p-6 bg-slate-950/30 relative">
                                {/* Decorative background element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

                                <h3 className="text-sm font-bold text-slate-300 mb-10 flex items-center gap-2 relative z-10">
                                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                    Strategic Insights
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 relative z-10">
                                    {(CROP_INSIGHTS[selectedDistrict]?.[selectedSeason] || CROP_INSIGHTS["generic"][selectedSeason] || []).map((insight, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group">
                                            {/* Number */}
                                            <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 text-slate-400 text-xs font-bold font-mono group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors shadow-sm">
                                                0{idx + 1}
                                            </div>

                                            {/* Text Content */}
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                {insight.split(' ').map((word, i) => {
                                                    const cleanWord = word.replace(/[^a-zA-Z0-9-]/g, '');
                                                    // Highlight Logic
                                                    if (['Maize', 'Sorghum', 'Groundnut', 'Rice', 'Millet', 'Pulses', 'Legumes', 'Cotton', 'Sugarcane', 'Coconut'].includes(cleanWord)) {
                                                        return (
                                                            <span key={i} className="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-px rounded-[4px] mx-0.5 font-semibold">
                                                                {word}
                                                            </span>
                                                        );
                                                    }
                                                    if (['Kharif', 'Rabi', 'Summer', 'Whole', 'Year'].includes(cleanWord)) {
                                                        return (
                                                            <span key={i} className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-px rounded-[4px] mx-0.5 font-semibold">
                                                                {word}
                                                            </span>
                                                        );
                                                    }
                                                    return <span key={i}>{word} </span>;
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )
            }
        </div >
    );
};

// Individual Crop Card Component
const CropCard = ({ crop, rank }) => {
    const [expanded, setExpanded] = useState(false);

    const getRankColor = (rank) => {
        if (rank === 1) return 'from-yellow-500 to-amber-600';
        if (rank === 2) return 'from-slate-400 to-slate-600';
        if (rank === 3) return 'from-orange-600 to-amber-700';
        return 'from-slate-700 to-slate-800';
    };

    const getReliabilityColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            whileHover={{ y: -5 }}
            className="relative group"
        >
            {/* Rank Badge */}
            <div className={`absolute -top-3 -right-3 z-10 w-12 h-12 bg-linear-to-br ${getRankColor(rank)} rounded-full flex items-center justify-center shadow-lg border-2 border-white/20`}>
                <span className="text-white font-bold text-lg">#{rank}</span>
            </div>

            <div className="h-full bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl border-2 border-amber-500/20 hover:border-amber-500/40 p-5 transition-all duration-300 overflow-hidden">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-linear-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/10 transition-all duration-500 rounded-2xl" />

                <div className="relative z-10">
                    {/* Crop Name */}
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                        <Sprout className="text-amber-400" size={20} />
                        {crop.crop}
                    </h3>

                    {/* Main Stats */}
                    <div className="space-y-3 mb-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Average Yield</p>
                            <p className="text-2xl font-bold text-amber-400">{crop.avg_yield} <span className="text-sm text-slate-400">kg/ha</span></p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                                <p className="text-xs text-emerald-400 font-semibold">Success Rate</p>
                                <p className="text-lg font-bold text-emerald-300">{crop.success_rate}%</p>
                            </div>
                            <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                                <p className="text-xs text-blue-400 font-semibold">Reliability</p>
                                <p className={`text-lg font-bold ${getReliabilityColor(crop.reliability_score)}`}>
                                    {crop.reliability_score}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Climate Conditions */}
                    {crop.climate && (
                        <div className="mt-4 pt-4 border-t border-amber-500/20">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="w-full flex items-center justify-between text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Thermometer size={14} />
                                    Climate Conditions
                                </span>
                                <motion.div
                                    animate={{ rotate: expanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    ▼
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {expanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-3 space-y-2 overflow-hidden"
                                    >
                                        {crop.climate.temperature && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Thermometer size={12} /> Temperature
                                                </span>
                                                <span className="text-white font-semibold">{crop.climate.temperature}°C</span>
                                            </div>
                                        )}
                                        {crop.climate.humidity && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Droplets size={12} /> Humidity
                                                </span>
                                                <span className="text-white font-semibold">{crop.climate.humidity}%</span>
                                            </div>
                                        )}
                                        {crop.climate.precipitation && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Droplets size={12} /> Precipitation
                                                </span>
                                                <span className="text-white font-semibold">{crop.climate.precipitation} mm</span>
                                            </div>
                                        )}
                                        {crop.climate.wind_speed && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Wind size={12} /> Wind Speed
                                                </span>
                                                <span className="text-white font-semibold">{crop.climate.wind_speed} m/s</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Trend Indicator */}
                    {crop.trend !== 0 && (
                        <div className={`mt-3 text-xs flex items-center gap-1 ${crop.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            <TrendingUp size={12} className={crop.trend < 0 ? 'rotate-180' : ''} />
                            {crop.trend > 0 ? '↑' : '↓'} {Math.abs(crop.trend).toFixed(1)}% yield trend
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PredictiveClimateChart;
