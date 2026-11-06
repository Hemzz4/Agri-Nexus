import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Beaker, CloudRain, Thermometer, Sprout, Leaf, ArrowRight, Loader2,
    Info, Droplets, CheckCircle, AlertTriangle, MapPin, Wind, ChevronDown, Check, Zap, Layers, Flower2
} from 'lucide-react';
import api from '../api';

// TN Districts with Approximate Lat/Lon for Weather API
const DISTRICTS = [
    { name: 'Ariyalur', lat: 11.14, lon: 79.08 },
    { name: 'Chengalpattu', lat: 12.69, lon: 79.97 },
    { name: 'Chennai', lat: 13.08, lon: 80.27 },
    { name: 'Coimbatore', lat: 11.01, lon: 76.95 },
    { name: 'Cuddalore', lat: 11.75, lon: 79.76 },
    { name: 'Dharmapuri', lat: 12.12, lon: 78.15 },
    { name: 'Dindigul', lat: 10.36, lon: 77.98 },
    { name: 'Erode', lat: 11.34, lon: 77.71 },
    { name: 'Kallakurichi', lat: 11.74, lon: 78.96 },
    { name: 'Kancheepuram', lat: 12.83, lon: 79.70 },
    { name: 'Karur', lat: 10.96, lon: 78.08 },
    { name: 'Krishnagiri', lat: 12.52, lon: 78.21 },
    { name: 'Madurai', lat: 9.92, lon: 78.11 },
    { name: 'Nagapattinam', lat: 10.76, lon: 79.84 },
    { name: 'Namakkal', lat: 11.22, lon: 78.17 },
    { name: 'Nilgiris', lat: 11.41, lon: 76.69 },
    { name: 'Perambalur', lat: 11.23, lon: 78.87 },
    { name: 'Pudukkottai', lat: 10.38, lon: 78.82 },
    { name: 'Ramanathapuram', lat: 9.36, lon: 78.83 },
    { name: 'Ranipet', lat: 12.93, lon: 79.33 },
    { name: 'Salem', lat: 11.66, lon: 78.14 },
    { name: 'Sivaganga', lat: 9.85, lon: 78.48 },
    { name: 'Tenkasi', lat: 8.96, lon: 77.31 },
    { name: 'Thanjavur', lat: 10.78, lon: 79.13 },
    { name: 'Theni', lat: 10.01, lon: 77.47 },
    { name: 'Thoothukudi', lat: 8.76, lon: 78.13 },
    { name: 'Tiruchirappalli', lat: 10.79, lon: 78.70 },
    { name: 'Tirunelveli', lat: 8.71, lon: 77.75 },
    { name: 'Tirupathur', lat: 12.50, lon: 78.57 },
    { name: 'Tiruppur', lat: 11.11, lon: 77.34 },
    { name: 'Tiruvallur', lat: 13.14, lon: 79.91 },
    { name: 'Tiruvannamalai', lat: 12.22, lon: 79.07 },
    { name: 'Tiruvarur', lat: 10.77, lon: 79.63 },
    { name: 'Vellore', lat: 12.91, lon: 79.13 },
    { name: 'Viluppuram', lat: 11.94, lon: 79.49 },
    { name: 'Virudhunagar', lat: 9.58, lon: 77.96 }
];

// Reusable Custom Dropdown Component
const CustomDropdown = ({ label, icon: Icon, value, options, onChange, placeholder, color = "indigo" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Color definitions with full Tailwind classes to ensure they are constrained
    const themes = {
        indigo: {
            label: "text-indigo-300",
            border: "border-indigo-500",
            shadow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
            gradient: "from-indigo-500 to-violet-500",
            activeItem: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
        },
        cyan: {
            label: "text-cyan-300",
            border: "border-cyan-500",
            shadow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
            gradient: "from-cyan-500 to-blue-500",
            activeItem: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
        },
        emerald: {
            label: "text-emerald-300",
            border: "border-emerald-500",
            shadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
            gradient: "from-emerald-500 to-teal-500",
            activeItem: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
        },
        rose: {
            label: "text-rose-300", // Fallback
            border: "border-rose-500",
            shadow: "shadow-rose-500/30",
            gradient: "from-rose-500 to-pink-500",
            activeItem: "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
        },
        amber: {
            label: "text-amber-300", // Fallback
            border: "border-amber-500",
            shadow: "shadow-amber-500/30",
            gradient: "from-amber-500 to-orange-500",
            activeItem: "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
        }
    };

    const theme = themes[color] || themes.indigo;

    return (
        <div className="space-y-2 relative" ref={dropdownRef}>
            <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme.label}`}>
                {Icon && <Icon size={14} />} {label}
            </label>

            <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full relative bg-slate-800/80 border-2 ${isOpen ? `${theme.border} ${theme.shadow}` : 'border-slate-600'} rounded-2xl px-5 py-4 text-left flex items-center justify-between transition-all duration-300 group overflow-hidden`}
            >
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />

                <span className={`text-lg font-bold ${value ? 'text-white' : 'text-slate-400'}`}>
                    {value || placeholder}
                </span>
                <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-[#0b1221] border border-slate-700 rounded-2xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar"
                    >
                        <div className="p-2 space-y-1">
                            {options.map((opt) => (
                                <motion.button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all group ${value === opt ? theme.activeItem : 'text-slate-300 hover:bg-slate-800'}`}
                                >
                                    <span className="font-medium">{opt}</span>
                                    {value === opt && <Check size={16} />}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// Custom Visuals for Fertilizers
const FERTILIZER_VISUALS = {
    "Urea": { icon: Wind, color: "text-blue-200", bg: "from-blue-500 to-cyan-400", label: "N" },
    "DAP": { icon: Sprout, color: "text-amber-200", bg: "from-amber-500 to-yellow-400", label: "P" },
    "14-35-14": { icon: Leaf, color: "text-emerald-200", bg: "from-emerald-500 to-green-400", label: "NPK" },
    "28-28": { icon: Zap, color: "text-cyan-200", bg: "from-cyan-500 to-blue-500", label: "NP" },
    "17-17-17": { icon: Layers, color: "text-purple-200", bg: "from-purple-500 to-fuchsia-400", label: "All" },
    "20-20": { icon: Droplets, color: "text-indigo-200", bg: "from-indigo-500 to-violet-400", label: "S" },
    "10-26-26": { icon: Flower2, color: "text-rose-200", bg: "from-rose-500 to-pink-400", label: "K" }
};

const FertilizerRecommendation = () => {
    const [options, setOptions] = useState({ soil_types: [], crop_types: [] });
    // ... (rest of state)
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState('Coimbatore');
    const [isWeatherSimulated, setIsWeatherSimulated] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        temperature: 26,
        humidity: 60,
        moisture: 40,
        soil_type: '',
        crop_type: '',
        nitrogen: 40,
        potassium: 20,
        phosphorus: 20
    });

    // Fetch Options on Mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const optRes = await api.get('/api/fertilizer/options');
                setOptions(optRes.data);
            } catch (err) {
                console.error("Option Load Error", err);
                setError("Failed to load options from backend.");
            }
        };
        fetchOptions();
    }, []);

    // Fetch Weather when District Changes
    useEffect(() => {
        const fetchWeather = async () => {
            const district = DISTRICTS.find(d => d.name === selectedDistrict);
            if (!district) return;

            try {
                const weatherRes = await api.get('/weather/', {
                    params: { latitude: district.lat, longitude: district.lon }
                });
                if (weatherRes.data && weatherRes.data.current) {
                    setIsWeatherSimulated(Boolean(weatherRes.data.is_simulated));
                    setFormData(prev => ({
                        ...prev,
                        temperature: weatherRes.data.current.temperature_2m,
                        humidity: weatherRes.data.current.relative_humidity_2m
                    }));
                }
            } catch (err) {
                console.error("Weather Load Error", err);
            }
        };
        fetchWeather();
    }, [selectedDistrict]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCustomChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDistrictChange = (value) => {
        setSelectedDistrict(value);
    };

    const handleSliderChange = (name, value) => {
        setFormData({ ...formData, [name]: parseInt(value) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setRecommendation(null);

        try {
            const res = await api.post('/api/fertilizer/predict', {
                ...formData,
                temperature: parseFloat(formData.temperature),
                humidity: parseFloat(formData.humidity),
                moisture: parseFloat(formData.moisture),
                nitrogen: parseFloat(formData.nitrogen),
                potassium: parseFloat(formData.potassium),
                phosphorus: parseFloat(formData.phosphorus)
            });
            setRecommendation(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to get recommendation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto bg-[#0f172a] text-slate-200">

            {/* Header Section */}
            <div className="mb-16 text-center relative pointer-events-none select-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -z-10" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block"
                >
                    <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] tracking-tight uppercase mb-2">
                        Fertilizer Expert
                    </h1>
                </motion.div>
                <p className="text-slate-400 max-w-2xl mx-auto text-xl font-light tracking-wide border-t border-slate-800 pt-6 mt-6">
                    Advanced AI Nutrient Analysis & <span className="text-emerald-400 font-semibold glow-text">Precision Agrochemical</span> Recommendation
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto mb-10 p-6 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl text-red-200 text-lg flex items-center gap-4 shadow-lg"
                >
                    <AlertTriangle size={32} className="shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-100 uppercase tracking-wide text-sm">System Error</h4>
                        <p>{error}</p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">

                {/* Input Panel (5 Columns) */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="xl:col-span-5 bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-visible z-20"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-3">
                        <span className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20"><Beaker size={20} /></span>
                        Soil Parameters
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* District Selector - Custom */}
                        <CustomDropdown
                            label="District Location"
                            icon={MapPin}
                            value={selectedDistrict}
                            options={DISTRICTS.map(d => d.name)}
                            onChange={handleDistrictChange}
                            color="cyan"
                        />

                        {/* Selectors Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomDropdown
                                label="Crop Type"
                                value={formData.crop_type}
                                options={options.crop_types}
                                onChange={(val) => handleCustomChange('crop_type', val)}
                                placeholder="Select..."
                                color="indigo"
                            />
                            <CustomDropdown
                                label="Soil Type"
                                value={formData.soil_type}
                                options={options.soil_types}
                                onChange={(val) => handleCustomChange('soil_type', val)}
                                placeholder="Select..."
                                color="emerald"
                            />
                        </div>

                        {/* Sliders for NPK - Bigger & Brighter */}
                        <div className="space-y-8 bg-black/30 p-8 rounded-3xl border border-white/5 backdrop-blur-sm shadow-inner group transition-colors hover:border-white/10">
                            <h3 className="text-lg font-bold text-emerald-300 mb-2 flex items-center gap-3 border-b border-white/5 pb-2">
                                <Leaf size={20} className="text-emerald-400" /> Nutrient Composition
                            </h3>

                            {[
                                { label: 'Nitrogen (N)', key: 'nitrogen', color: 'from-blue-600 via-blue-400 to-cyan-300', text: 'text-blue-300', max: 140 },
                                { label: 'Phosphorus (P)', key: 'phosphorus', color: 'from-fuchsia-600 via-purple-400 to-pink-300', text: 'text-fuchsia-300', max: 140 },
                                { label: 'Potassium (K)', key: 'potassium', color: 'from-orange-600 via-amber-400 to-yellow-300', text: 'text-orange-300', max: 200 }
                            ].map(nutrient => (
                                <motion.div key={nutrient.key} whileHover={{ scale: 1.02 }} className="origin-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${nutrient.text}`}>{nutrient.label}</span>
                                        <span className="text-sm font-bold text-white bg-slate-800 px-2 py-1 rounded border border-slate-600 min-w-[3ch] text-center">{formData[nutrient.key]}</span>
                                    </div>
                                    <div className="h-2 relative rounded-full bg-slate-800 shadow-inner border border-slate-700/50 mt-4 mb-2">
                                        <div
                                            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${nutrient.color} rounded-full`}
                                            style={{ width: `${(formData[nutrient.key] / nutrient.max) * 100}%` }}
                                        />
                                        <input
                                            type="range"
                                            min="0" max={nutrient.max}
                                            value={formData[nutrient.key]}
                                            onChange={(e) => handleSliderChange(nutrient.key, e.target.value)}
                                            className="absolute -top-4 left-0 w-full h-10 opacity-0 cursor-pointer z-50"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Environment Inputs - Interactive Cards */}
                        {isWeatherSimulated && (
                            <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <span>⚠️</span> Weather offline: ambient temperature & humidity populated from simulated fallback.
                                </span>
                                <span className="text-[10px] uppercase font-mono bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    Simulated
                                </span>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                {
                                    label: 'Temp',
                                    val: `${formData.temperature}°`,
                                    icon: Thermometer,
                                    sub: '',
                                    classes: {
                                        bg: "bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20",
                                        glow: "bg-red-500/5",
                                        icon: "text-red-500",
                                        text: "text-red-300",
                                        shadow: "shadow-[0_10px_30px_-10px_rgba(239,68,68,0.3)]"
                                    }
                                },
                                {
                                    label: 'Humidity',
                                    val: formData.humidity,
                                    icon: CloudRain,
                                    sub: '%',
                                    classes: {
                                        bg: "bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20",
                                        glow: "bg-cyan-500/5",
                                        icon: "text-cyan-500",
                                        text: "text-cyan-300",
                                        shadow: "shadow-[0_10px_30px_-10px_rgba(6,182,212,0.3)]"
                                    }
                                },
                                {
                                    label: 'Moisture',
                                    val: formData.moisture,
                                    icon: Droplets,
                                    sub: '%',
                                    isInput: true,
                                    classes: {
                                        bg: "bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20",
                                        glow: "bg-amber-500/5",
                                        icon: "text-amber-500",
                                        text: "text-amber-300",
                                        shadow: "shadow-[0_10px_30px_-10px_rgba(245,158,11,0.3)]"
                                    }
                                },
                            ].map((item) => (
                                <motion.div
                                    key={item.label}
                                    whileHover={{ y: -2, boxShadow: item.classes.shadow }}
                                    className={`${item.classes.bg} p-3 rounded-xl border text-center backdrop-blur-sm shadow-md group cursor-default relative overflow-hidden transition-all h-24 flex flex-col justify-between`}
                                >
                                    {/* Hover Glow */}
                                    <div className={`absolute inset-0 ${item.classes.glow} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                    <div className="relative z-10 flex items-center justify-center gap-2 opacity-80 pt-1">
                                        <item.icon size={16} className={`${item.classes.icon}`} />
                                        <div className={`text-[10px] font-bold ${item.classes.text} uppercase tracking-widest`}>{item.label}</div>
                                    </div>

                                    <div className="relative z-10 w-full flex items-center justify-center pb-1">
                                        {item.isInput ? (
                                            <div className="w-20">
                                                <input
                                                    type="number"
                                                    name="moisture"
                                                    value={formData.moisture}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/20 rounded p-1 text-center text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        ) : (
                                            <div className="font-bold text-white text-xl">{item.val}<span className="text-sm text-white/50 ml-0.5">{item.sub}</span></div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading || !formData.crop_type || !formData.soil_type}
                            className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide uppercase border-t border-white/20 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            {loading ? <Loader2 className="animate-spin" size={32} /> : <><Sprout size={32} /> Analyze Soil</>}
                        </motion.button>
                    </form>
                </motion.div>


                {/* Result Panel (7 Columns) */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="xl:col-span-12 xl:mt-0 mt-8 min-h-[600px] xl:col-start-6"
                >
                    <AnimatePresence mode="wait">
                        {recommendation ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="h-full rounded-[40px] p-[2px] bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-500 shadow-[0_0_60px_rgba(16,185,129,0.2)]"
                            >
                                <div className="bg-[#0b1221] rounded-[38px] h-full relative overflow-hidden flex flex-col p-8 md:p-12">

                                    {/* Success confetti effect */}
                                    <div className="absolute top-0 right-0 p-8 z-10">
                                        <div className="bg-emerald-500/10 text-emerald-400 text-sm font-black px-6 py-2 rounded-full border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] tracking-widest uppercase animate-pulse">
                                            {recommendation.confidence}% Match
                                        </div>
                                    </div>

                                    <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                                    {/* HEADER */}
                                    <h3 className="text-emerald-400 text-lg font-bold uppercase tracking-[0.3em] mb-12 relative z-10 flex items-center gap-3">
                                        <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" /> AI Prescription
                                    </h3>

                                    {/* MAIN RESULT */}
                                    <div className="flex flex-col items-center justify-center mb-12 relative z-10">
                                        <div className="relative group cursor-pointer perspective-1000">
                                            <div className={`absolute inset-0 bg-gradient-to-r ${FERTILIZER_VISUALS[recommendation.fertilizer]?.bg || 'from-slate-400 to-slate-500'} rounded-full blur-[60px] opacity-40 group-hover:opacity-70 transition-opacity duration-500`} />
                                            <motion.div
                                                whileHover={{ rotateY: 10, rotateX: -10, scale: 1.05 }}
                                                className="w-48 h-48 bg-slate-900/50 backdrop-blur-xl rounded-[3rem] flex items-center justify-center shadow-2xl mb-8 border-4 border-white/10 ring-4 ring-white/5 relative z-10 transform-style-3d"
                                            >
                                                {(() => {
                                                    const Visual = FERTILIZER_VISUALS[recommendation.fertilizer] || { icon: Sprout, color: "text-white", bg: "from-gray-500 to-gray-600", label: "?" };
                                                    const Icon = Visual.icon;
                                                    return (
                                                        <div className={`relative flex flex-col items-center justify-center ${Visual.color}`}>
                                                            <Icon size={80} strokeWidth={1.5} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                                                            <span className="text-2xl font-black mt-2 tracking-tighter opacity-80">{Visual.label}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </motion.div>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black text-white text-center tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                            {recommendation.fertilizer}
                                        </h2>
                                        <p className="text-slate-400 text-xl mt-6 text-center max-w-2xl leading-relaxed font-light border-b border-white/5 pb-8">
                                            {recommendation.description}
                                        </p>
                                    </div>

                                    {/* INSIGHT CARDS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="bg-gradient-to-br from-emerald-900/30 to-emerald-900/10 p-8 rounded-3xl border border-emerald-500/20 backdrop-blur-md hover:border-emerald-500/40 transition-colors"
                                        >
                                            <h5 className="text-xs font-black text-emerald-400 uppercase mb-4 flex items-center gap-2 tracking-widest border-b border-emerald-500/10 pb-2">
                                                <Wind size={18} /> Timing
                                            </h5>
                                            <p className="text-white text-2xl font-bold leading-tight">{recommendation.timing}</p>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 p-8 rounded-3xl border border-blue-500/20 backdrop-blur-md hover:border-blue-500/40 transition-colors"
                                        >
                                            <h5 className="text-xs font-black text-blue-400 uppercase mb-4 flex items-center gap-2 tracking-widest border-b border-blue-500/10 pb-2">
                                                <Info size={18} /> Key Benefit
                                            </h5>
                                            <p className="text-white text-2xl font-bold leading-tight">{recommendation.benefits?.[0]}</p>
                                        </motion.div>
                                    </div>

                                    {/* STRATEGY BOX */}
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-[#131d33] p-10 rounded-3xl border-l-8 border-violet-500 mb-8 shadow-2xl relative overflow-hidden group"
                                    >
                                        <div className="absolute right-0 top-0 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-colors duration-500" />
                                        <h4 className="text-violet-300 font-black mb-4 flex items-center gap-3 text-lg tracking-widest uppercase relative z-10">
                                            <Sprout size={24} className="text-violet-500" /> Application Strategy
                                        </h4>
                                        <p className="text-slate-200 text-xl leading-relaxed font-medium font-sans relative z-10">
                                            {recommendation.application_strategy}
                                        </p>
                                    </motion.div>

                                    {/* COMPATIBILITY BAR */}
                                    <div className="mt-auto bg-black/40 p-8 rounded-3xl border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs text-slate-500 uppercase font-black tracking-[0.2em]">Crop-Soil Match</h4>
                                            {recommendation.soil_analysis?.is_compatible ?
                                                <span className="text-emerald-400 text-sm font-bold flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10"><CheckCircle size={16} /> Perfect Match</span> :
                                                <span className="text-amber-400 text-sm font-bold flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10"><AlertTriangle size={16} /> Attention Needed</span>
                                            }
                                        </div>
                                        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                                            <div className="w-1/2 bg-slate-600 h-full border-r border-black relative group" title="Your Soil">
                                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className={`w - 1 / 2 h - full ${recommendation.soil_analysis?.is_compatible ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'} transition - all relative group`} title="Ideal Soil">
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between mt-3 text-sm font-mono text-slate-400 font-semibold">
                                            <span>{recommendation.soil_analysis?.current_soil} (Yours)</span>
                                            <span className={recommendation.soil_analysis?.is_compatible ? 'text-emerald-400' : 'text-amber-400'}>
                                                {recommendation.soil_analysis?.ideal_soil_for_crop} (Ideal)
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center p-12 border-4 border-dashed border-slate-700/30 rounded-[40px] bg-slate-900/40 text-slate-500 relative overflow-hidden group hover:border-slate-600/50 transition-colors"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors" />

                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-40 h-40 bg-slate-800 rounded-full flex items-center justify-center mb-10 shadow-2xl border-4 border-slate-700/50"
                                >
                                    <Sprout size={72} className="text-slate-600 group-hover:text-emerald-400 transition-colors duration-500" />
                                </motion.div>

                                <h3 className="text-4xl font-black text-slate-300 mb-6 tracking-tight">AI Analysis Ready</h3>
                                <p className="text-xl max-w-md mx-auto text-slate-400 font-light">
                                    Our Deep Learning model is ready to process your <strong className="text-slate-200">Soil & Climate</strong> data.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default FertilizerRecommendation;
