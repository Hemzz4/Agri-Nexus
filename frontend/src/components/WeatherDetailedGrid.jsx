import React from 'react';
import {
    Thermometer, Droplets, Wind, Eye, Gauge,
    CloudRain, Sun, Layers, Navigation, Sunset,
    CloudDrizzle, Container, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

// Comprehensive weather attribute categories with colors
const attributeCategories = {
    temperature: {
        icon: Thermometer,
        color: 'from-orange-500 to-red-500',
        hoverColor: 'hover:from-orange-400 hover:to-red-400',
        borderColor: 'border-orange-500/30',
        iconColor: 'text-orange-400'
    },
    moisture: {
        icon: Droplets,
        color: 'from-blue-500 to-cyan-500',
        hoverColor: 'hover:from-blue-400 hover:to-cyan-400',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400'
    },
    wind: {
        icon: Wind,
        color: 'from-teal-500 to-emerald-500',
        hoverColor: 'hover:from-teal-400 hover:to-emerald-400',
        borderColor: 'border-teal-500/30',
        iconColor: 'text-teal-400'
    },
    pressure: {
        icon: Gauge,
        color: 'from-purple-500 to-pink-500',
        hoverColor: 'hover:from-purple-400 hover:to-pink-400',
        borderColor: 'border-purple-500/30',
        iconColor: 'text-purple-400'
    },
    visibility: {
        icon: Eye,
        color: 'from-indigo-500 to-violet-500',
        hoverColor: 'hover:from-indigo-400 hover:to-violet-400',
        borderColor: 'border-indigo-500/30',
        iconColor: 'text-indigo-400'
    },
    cloud: {
        icon: CloudRain,
        color: 'from-gray-500 to-slate-500',
        hoverColor: 'hover:from-gray-400 hover:to-slate-400',
        borderColor: 'border-gray-500/30',
        iconColor: 'text-gray-400'
    },
    uv: {
        icon: Sun,
        color: 'from-yellow-500 to-amber-500',
        hoverColor: 'hover:from-yellow-400 hover:to-amber-400',
        borderColor: 'border-yellow-500/30',
        iconColor: 'text-yellow-400'
    },
    soil: {
        icon: Container,
        color: 'from-amber-700 to-orange-700',
        hoverColor: 'hover:from-amber-600 hover:to-orange-600',
        borderColor: 'border-amber-700/30',
        iconColor: 'text-amber-600'
    }
};

const WeatherCard = ({ icon: Icon, label, value, unit, category, delay = 0 }) => {
    const cat = attributeCategories[category] || attributeCategories.temperature;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`
                relative group cursor-pointer
                bg-linear-to-br ${cat.color}
                ${cat.hoverColor}
                rounded-xl border ${cat.borderColor}
                p-4 shadow-lg
                transition-all duration-300 ease-out
                hover:shadow-2xl hover:shadow-${category}-500/50
                overflow-hidden
            `}
        >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <Icon className={`${cat.iconColor} group-hover:scale-110 transition-transform duration-300`} size={24} />
                    <Sparkles className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={16} />
                </div>

                <div className="mt-2">
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                        {label}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-white text-2xl font-bold group-hover:text-3xl transition-all duration-300">
                            {typeof value === 'number' ? value.toFixed(1) : value}
                        </span>
                        <span className="text-white/70 text-sm font-medium">
                            {unit}
                        </span>
                    </div>
                </div>
            </div>

            {/* Hover shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 -left-full h-full w-1/2 bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-1000"></div>
            </div>
        </motion.div>
    );
};

const WeatherDetailedGrid = ({ current }) => {
    if (!current) return null;

    // Comprehensive weather attributes
    const weatherAttributes = [
        // Temperature attributes
        { icon: Thermometer, label: 'Temperature', value: current.temperature_2m || current.temp_c || 0, unit: '°C', category: 'temperature', delay: 0 },
        { icon: Thermometer, label: 'Feels Like', value: current.apparent_temperature || current.feelslike_c || 0, unit: '°C', category: 'temperature', delay: 0.05 },
        { icon: Thermometer, label: 'Dew Point', value: current.dew_point_2m || current.dewpoint_c || 0, unit: '°C', category: 'temperature', delay: 0.1 },

        // Moisture attributes
        { icon: Droplets, label: 'Humidity', value: current.relative_humidity_2m || current.humidity || 0, unit: '%', category: 'moisture', delay: 0.15 },
        { icon: CloudDrizzle, label: 'Precipitation', value: current.precipitation || current.precip_mm || 0, unit: 'mm', category: 'moisture', delay: 0.2 },
        { icon: CloudRain, label: 'Rain', value: current.rain || 0, unit: 'mm', category: 'moisture', delay: 0.25 },

        // Wind attributes
        { icon: Wind, label: 'Wind Speed', value: current.wind_speed_10m || current.wind_kph || 0, unit: 'km/h', category: 'wind', delay: 0.3 },
        { icon: Wind, label: 'Wind Gusts', value: current.wind_gusts_10m || current.gust_kph || 0, unit: 'km/h', category: 'wind', delay: 0.35 },
        { icon: Navigation, label: 'Wind Direction', value: current.wind_direction_10m || current.wind_degree || 0, unit: '°', category: 'wind', delay: 0.4 },

        // Pressure attributes
        { icon: Gauge, label: 'Pressure', value: current.surface_pressure || current.pressure_mb || 0, unit: 'hPa', category: 'pressure', delay: 0.45 },

        // Visibility & Cloud
        { icon: Eye, label: 'Visibility', value: (current.visibility || current.vis_km || 0), unit: 'km', category: 'visibility', delay: 0.5 },
        { icon: CloudRain, label: 'Cloud Cover', value: current.cloud_cover || current.cloud || 0, unit: '%', category: 'cloud', delay: 0.55 },

        // UV & Solar
        { icon: Sun, label: 'UV Index', value: current.uv_index || current.uv || 0, unit: '', category: 'uv', delay: 0.6 },

        // Soil attributes
        { icon: Container, label: 'Soil Temp (0cm)', value: current.soil_temperature_0_to_7cm || 0, unit: '°C', category: 'soil', delay: 0.65 },
        { icon: Container, label: 'Soil Moisture (0-7cm)', value: current.soil_moisture_0_to_7cm || 0, unit: 'm³/m³', category: 'soil', delay: 0.7 },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {weatherAttributes.map((attr, index) => (
                <WeatherCard
                    key={`${attr.label}-${index}`}
                    icon={attr.icon}
                    label={attr.label}
                    value={attr.value}
                    unit={attr.unit}
                    category={attr.category}
                    delay={attr.delay}
                />
            ))}
        </div>
    );
};

export default WeatherDetailedGrid;
