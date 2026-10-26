import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Thermometer } from 'lucide-react';

const GradientThermometer = ({
    temperature = 25,
    minTemp = -10,
    maxTemp = 50,
    unit = '°C',
    label = 'Temperature',
    height = 300
}) => {
    const [animatedTemp, setAnimatedTemp] = useState(minTemp);
    const canvasRef = useRef(null);

    // Normalize temperature to 0-1 range
    const normalizeTemp = (temp) => {
        return Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
    };

    // Get color based on temperature
    const getTempColor = (temp) => {
        const normalized = normalizeTemp(temp);

        // Multi-point gradient: blue -> cyan -> green -> yellow -> orange -> red
        if (normalized < 0.2) {
            // Blue to Cyan
            const t = normalized / 0.2;
            return {
                r: Math.floor(0 + (0 - 0) * t),
                g: Math.floor(101 + (206 - 101) * t),
                b: Math.floor(218 + (209 - 218) * t)
            };
        } else if (normalized < 0.4) {
            // Cyan to Green
            const t = (normalized - 0.2) / 0.2;
            return {
                r: Math.floor(0 + (16 - 0) * t),
                g: Math.floor(206 + (185 - 206) * t),
                b: Math.floor(209 + (129 - 209) * t)
            };
        } else if (normalized < 0.6) {
            // Green to Yellow
            const t = (normalized - 0.4) / 0.2;
            return {
                r: Math.floor(16 + (253 - 16) * t),
                g: Math.floor(185 + (224 - 185) * t),
                b: Math.floor(129 + (71 - 129) * t)
            };
        } else if (normalized < 0.8) {
            // Yellow to Orange
            const t = (normalized - 0.6) / 0.2;
            return {
                r: Math.floor(253 + (251 - 253) * t),
                g: Math.floor(224 + (146 - 224) * t),
                b: Math.floor(71 + (60 - 71) * t)
            };
        } else {
            // Orange to Red
            const t = (normalized - 0.8) / 0.2;
            return {
                r: Math.floor(251 + (220 - 251) * t),
                g: Math.floor(146 + (38 - 146) * t),
                b: Math.floor(60 + (38 - 60) * t)
            };
        }
    };

    // Animate temperature
    useEffect(() => {
        const duration = 1500;
        const startTime = Date.now();
        const startTemp = animatedTemp;
        const targetTemp = temperature;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            const currentTemp = startTemp + (targetTemp - startTemp) * easeProgress;
            setAnimatedTemp(currentTemp);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [temperature]);

    // Draw temperature map on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const canvasHeight = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, canvasHeight);

        // Draw gradient background
        for (let y = 0; y < canvasHeight; y++) {
            const tempAtY = maxTemp - (y / canvasHeight) * (maxTemp - minTemp);
            const color = getTempColor(tempAtY);
            ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            ctx.fillRect(0, y, width, 1);
        }

        // Draw current temperature indicator
        const normalizedCurrent = normalizeTemp(animatedTemp);
        const indicatorY = canvasHeight * (1 - normalizedCurrent);

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';

        // White indicator line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, indicatorY);
        ctx.lineTo(width, indicatorY);
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
    }, [animatedTemp, minTemp, maxTemp, height]);

    const currentColor = getTempColor(animatedTemp);
    const colorStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4 p-6 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Thermometer
                    size={24}
                    style={{ color: colorStyle }}
                    className="drop-shadow-lg"
                />
                <h4 className="text-lg font-semibold text-white">{label}</h4>
            </div>

            <div className="flex gap-6 items-center w-full">
                {/* Temperature Scale Labels */}
                <div className="flex flex-col justify-between text-xs text-slate-400 font-mono" style={{ height: `${height}px` }}>
                    <span>{maxTemp}{unit}</span>
                    <span>{Math.round((maxTemp + minTemp) / 2)}{unit}</span>
                    <span>{minTemp}{unit}</span>
                </div>

                {/* Thermometer Canvas */}
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={60}
                        height={height}
                        className="rounded-full shadow-2xl border-2 border-white/20"
                    />

                    {/* Bulb at bottom */}
                    <div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full shadow-2xl border-2 border-white/20"
                        style={{
                            background: `radial-gradient(circle, ${colorStyle}, rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.6))`
                        }}
                    >
                        <div
                            className="absolute inset-2 rounded-full animate-pulse"
                            style={{
                                background: `radial-gradient(circle, rgba(255,255,255,0.4), transparent)`
                            }}
                        />
                    </div>
                </div>

                {/* Current Temperature Display */}
                <div className="flex flex-col items-start gap-2">
                    <motion.div
                        key={animatedTemp}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className="text-5xl font-bold tracking-tight"
                        style={{ color: colorStyle, textShadow: `0 0 20px ${colorStyle}` }}
                    >
                        {Math.round(animatedTemp)}{unit}
                    </motion.div>

                    {/* Temperature Status */}
                    <div className="text-sm font-medium text-slate-300 capitalize">
                        {animatedTemp < 10 ? 'Very Cold' :
                            animatedTemp < 20 ? 'Cold' :
                                animatedTemp < 25 ? 'Moderate' :
                                    animatedTemp < 30 ? 'Warm' :
                                        animatedTemp < 35 ? 'Hot' : 'Very Hot'}
                    </div>
                </div>
            </div>

            {/* Temperature Range Indicator */}
            <div className="w-full mt-2">
                <div className="h-2 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full flex">
                        {Array.from({ length: 100 }).map((_, i) => {
                            const temp = minTemp + (i / 100) * (maxTemp - minTemp);
                            const color = getTempColor(temp);
                            return (
                                <div
                                    key={i}
                                    className="flex-1"
                                    style={{
                                        backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                    <span>Cold</span>
                    <span>Moderate</span>
                    <span>Hot</span>
                </div>
            </div>
        </motion.div>
    );
};

export default GradientThermometer;
