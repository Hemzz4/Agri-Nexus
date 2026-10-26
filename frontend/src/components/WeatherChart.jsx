import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const WeatherChart = ({ data }) => {
    if (!data) return <div className="text-secondary text-sm">No data to display</div>;

    // Transform object to array for Recharts
    // { Temperature: 25, Humidity: 60 ... } -> [{ subject: 'Temperature', A: 25, fullMark: 100 }, ...]

    // Normalize values roughly to 0-100 scale for Radar visual appeal
    // Temp: 0-50, Hum: 0-100, Precip: 0-300?, Wind: 0-20
    // Real values are better for tooltip, but Radar needs normalized for shape?
    // Let's just plot raw first or use a Bar chart if Radar is confusing.
    // Radar is requested for "Professional" look usually.

    const chartData = [
        { subject: 'Temp (°C)', A: data.Temperature, fullMark: 40 },
        { subject: 'Humidity (%)', A: data.Humidity, fullMark: 100 },
        { subject: 'Wind (km/h)', A: data.Wind_Speed * 10, fullMark: 50 }, // Scale up wind for visibility
        { subject: 'Soil Wetness', A: data.Soil_Wetness * 100, fullMark: 100 },
        { subject: 'Precip (mm)', A: Math.min(data.Precipitation, 100), fullMark: 100 }, // Cap visual
    ];

    return (
        <div className="weather-radar-chart">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Weather Profile"
                        dataKey="A"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="#10b981"
                        fillOpacity={0.3}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WeatherChart;
