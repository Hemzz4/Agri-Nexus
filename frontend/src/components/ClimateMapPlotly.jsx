import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import tnDistricts from '../assets/tn_districts.json';
import { fetchWeather } from '../api';

const Plot = createPlotlyComponent(Plotly);

const geoNameMap = {
    "The Nilgiris": "Nilgiris",
    "Thiruvallur": "Tiruvallur",
    "Thiruvarur": "Tiruvarur",
    "Thoothukkudi": "Thoothukudi",
    "Tiruchirappalli": "Tiruchchirappalli",
    "Tirunelveli": "Tirunelveli Kattabo",
    "Kancheepuram": "Kancheepuram",
    "Kanniyakumari": "Kanniyakumari",
    "Virudhunagar": "Virudhunagar",
    "Krishnagiri": "Krishnagiri"
};

const districtCoords = {
    "Coimbatore": { lat: 11.0168, lon: 76.9558 },
    "Ariyalur": { lat: 11.1401, lon: 79.0786 },
    "Chennai": { lat: 13.0827, lon: 80.2707 },
    "Cuddalore": { lat: 11.7480, lon: 79.7714 },
    "Dharmapuri": { lat: 12.1211, lon: 78.1582 },
    "Dindigul": { lat: 10.3673, lon: 77.9803 },
    "Erode": { lat: 11.3410, lon: 77.7172 },
    "Kancheepuram": { lat: 12.8342, lon: 79.7036 },
    "Kanniyakumari": { lat: 8.0883, lon: 77.5385 },
    "Karur": { lat: 10.9601, lon: 78.0766 },
    "Krishnagiri": { lat: 12.5186, lon: 78.2137 },
    "Madurai": { lat: 9.9252, lon: 78.1198 },
    "Nagapattinam": { lat: 10.7672, lon: 79.8431 },
    "Namakkal": { lat: 11.2189, lon: 78.1675 },
    "Perambalur": { lat: 11.2358, lon: 78.8810 },
    "Pudukkottai": { lat: 10.3797, lon: 78.8208 },
    "Ramanathapuram": { lat: 9.3639, lon: 78.8395 },
    "Salem": { lat: 11.6643, lon: 78.1460 },
    "Sivaganga": { lat: 9.9651, lon: 78.7204 },
    "Thanjavur": { lat: 10.7870, lon: 79.1378 },
    "The Nilgiris": { lat: 11.4102, lon: 76.6950 },
    "Theni": { lat: 10.0104, lon: 77.4768 },
    "Thiruvallur": { lat: 13.1432, lon: 79.9044 },
    "Thiruvarur": { lat: 10.7661, lon: 79.6344 },
    "Thoothukkudi": { lat: 8.7642, lon: 78.1348 },
    "Tiruchirappalli": { lat: 10.7905, lon: 78.7047 },
    "Tirunelveli": { lat: 8.7139, lon: 77.7567 },
    "Tiruppur": { lat: 11.1085, lon: 77.3411 },
    "Tiruvannamalai": { lat: 12.2253, lon: 79.0747 },
    "Vellore": { lat: 12.9165, lon: 79.1325 },
    "Villupuram": { lat: 11.9401, lon: 79.4861 },
    "Virudhunagar": { lat: 9.5680, lon: 77.9624 }
};

const generateInitialData = () => {
    const initial = {};
    Object.keys(districtCoords).forEach(district => {
        const isHill = ['The Nilgiris', 'Dindigul', 'Theni'].includes(district);
        const isCoast = ['Chennai', 'Cuddalore', 'Nagapattinam', 'Ramanathapuram', 'Thoothukkudi', 'Kanniyakumari'].includes(district);

        let temp = 30 + Math.random() * 5;
        if (isHill) temp -= 10;
        if (isCoast) temp -= 2;

        let humid = 60 + Math.random() * 20;
        if (isCoast) humid += 15;
        if (isHill) humid += 10;

        let soil = 0.3 + Math.random() * 0.4;
        let wind = 5 + Math.random() * 15;
        let precip = Math.random() > 0.7 ? Math.random() * 5 : 0;

        // New Metrics Initialization
        let app_temp = temp + (humid > 70 ? 2 : -1);
        let pressure = 1010 + Math.random() * 10;
        if (isHill) pressure -= 50; // Lower pressure in hills

        let cloud = Math.random() * 100;
        let uv = 5 + Math.random() * 6;
        let vis = 10 + Math.random() * 15; // km
        let dew = temp - (100 - humid) / 5;
        let gusts = wind * (1.2 + Math.random());

        initial[district] = {
            name: district,
            temp,
            humid,
            soil,
            wind,
            precip,
            app_temp,
            pressure,
            cloud,
            uv,
            vis,
            dew,
            gusts
        };
    });
    return initial;
};

const metricLabels = {
    'Temperature': 'Avg Temperature',
    'Apparent Temp': 'Feels Like',
    'Humidity': 'Humidity',
    'Pressure': 'Pressure',
    'Cloud Cover': 'Cloud Cover',
    'UV Index': 'UV Index',
    'Visibility': 'Visibility',
    'Dew Point': 'Dew Point',
    'Wind Gusts': 'Wind Gusts',
    'Soil Moisture': 'Soil Wetness',
    'Yield Potential': 'Yield Potential'
};

const ClimateMapPlotly = ({ onDistrictSelect, defaultMetric = 'Temperature', hideControls = false, allowedMetrics = Object.keys(metricLabels) }) => {
    const [metric, setMetric] = useState(defaultMetric);
    // Ensure current metric is valid
    useEffect(() => {
        if (!allowedMetrics.includes(metric)) {
            setMetric(allowedMetrics[0]);
        }
    }, [allowedMetrics, metric]);

    const [weatherData, setWeatherData] = useState(generateInitialData());
    const [loading, setLoading] = useState(true);

    // Fetch real weather data
    useEffect(() => {
        let isMounted = true;

        const safetyTimeout = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 8000);

        const fetchAllDistricts = async () => {
            if (isMounted) setLoading(true);
            const allDistricts = Object.entries(districtCoords);
            const chunkSize = 5;

            for (let i = 0; i < allDistricts.length; i += chunkSize) {
                if (!isMounted) break;

                const chunk = allDistricts.slice(i, i + chunkSize);

                const chunkResults = await Promise.all(chunk.map(async ([name, coords]) => {
                    try {
                        const data = await fetchWeather(coords.lat, coords.lon);
                        return {
                            name,
                            temp: data?.current?.temperature_2m || 30,
                            app_temp: data?.current?.apparent_temperature || 30,
                            humid: data?.current?.relative_humidity_2m || 60,
                            pressure: data?.current?.pressure_msl || 1013,
                            cloud: data?.current?.cloud_cover || 20,
                            uv: data?.current?.uv_index || 5,
                            vis: (data?.current?.visibility || 10000) / 1000,
                            dew: data?.current?.dew_point_2m || 20,
                            gusts: data?.current?.wind_gusts_10m || 15,
                            soil: data?.current?.soil_moisture_0_to_1cm || 0.3,
                            wind: data?.current?.wind_speed_10m || 5,
                            precip: data?.current?.precipitation || 0
                        };
                    } catch (e) {
                        return null;
                    }
                }));

                if (isMounted) {
                    setWeatherData(prev => {
                        const next = { ...prev };
                        chunkResults.forEach(res => {
                            if (res) next[res.name] = res;
                        });
                        return next;
                    });
                }

                await new Promise(r => setTimeout(r, 500));
            }
            if (isMounted) setLoading(false);
        };

        fetchAllDistricts();

        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
        };
    }, []);

    const data = useMemo(() => {
        return Object.keys(districtCoords).map(district => {
            const w = weatherData[district];
            const geoName = geoNameMap[district] || district;

            // Calculate heuristic Yield Score (0-100)
            const tempScore = Math.max(0, 100 - Math.abs(w.temp - 25) * 5);
            const humidScore = Math.max(0, 100 - Math.abs(w.humid - 70));
            const soilScore = w.soil * 100;

            const yieldScore = (tempScore * 0.3) + (humidScore * 0.2) + (soilScore * 0.5);

            let val;
            switch (metric) {
                case 'Temperature': val = w.temp; break;
                case 'Apparent Temp': val = w.app_temp; break;
                case 'Humidity': val = w.humid; break;
                case 'Pressure': val = w.pressure; break;
                case 'Cloud Cover': val = w.cloud; break;
                case 'UV Index': val = w.uv; break;
                case 'Visibility': val = w.vis; break;
                case 'Dew Point': val = w.dew; break;
                case 'Wind Gusts': val = w.gusts; break;
                case 'Soil Moisture': val = w.soil; break;
                case 'Yield Potential': val = yieldScore; break;
                default: val = w.temp;
            }

            return {
                district,
                geoName,
                val,
                ...w,
                yield: yieldScore
            };
        });
    }, [metric, weatherData]);

    const locations = data.map(d => d.geoName);
    const vals = data.map(d => d.val);
    const texts = data.map(d => {
        if (metric === 'Yield Potential') {
            return `
                <b style="font-size: 1.1em; color: #fbbf24;">${d.district}</b><br>
                <span style="color: #9ca3af;">Yield Index:</span> <b style="color: #ffffff;">${d.yield.toFixed(1)}</b><br>
                <span style="color: #9ca3af;">Wind:</span> <b style="color: #38bdf8;">${d.wind} km/h</b><br>
                <span style="color: #9ca3af;">Rain:</span> <b style="color: #60a5fa;">${d.precip} mm</b>
            `;
        } else {
            let unit = '';
            let color = '#ffffff';

            if (metric === 'Temperature' || metric === 'Apparent Temp' || metric === 'Dew Point') { unit = '°C'; color = '#f87171'; }
            else if (metric === 'Humidity' || metric === 'Cloud Cover') { unit = '%'; color = '#34d399'; }
            else if (metric === 'Pressure') { unit = ' hPa'; color = '#60a5fa'; }
            else if (metric === 'UV Index') { unit = ''; color = '#a78bfa'; }
            else if (metric === 'Visibility') { unit = ' km'; color = '#fbbf24'; }
            else if (metric === 'Wind Gusts') { unit = ' km/h'; color = '#22d3ee'; }
            else if (metric === 'Soil Moisture') { unit = ' m³/m³'; color = '#d97706'; }

            return `
                <b style="font-size: 1.1em; color: #fbbf24;">${d.district}</b><br>
                <span style="color: #9ca3af;">${metric}:</span> <b style="color: ${color}; font-size: 1.2em;">${d.val ? d.val.toFixed(1) : '--'}${unit}</b>
            `;
        }
    });

    // Prepare Traces
    const traces = [];

    // 1. Base Choropleth
    traces.push({
        type: 'choroplethmapbox',
        geojson: tnDistricts,
        locations: locations,
        z: vals,
        featureidkey: "properties.NAME_2",
        colorscale:
            metric === 'Temperature' || metric === 'Apparent Temp' ? 'Magma' :
                metric === 'Humidity' ? 'Viridis' :
                    metric === 'Soil Moisture' ? 'Earth' :
                        metric === 'Pressure' ? 'Blues' :
                            metric === 'Cloud Cover' ? 'Greys' :
                                metric === 'UV Index' ? 'Rainbow' :
                                    metric === 'Visibility' ? 'Cividis' :
                                        metric === 'Dew Point' ? 'GnBu' :
                                            metric === 'Wind Gusts' ? 'YlGnBu' :
                                                'Reds', // Yield
        reversescale: metric === 'Temperature' || metric === 'Apparent Temp' ? false : true,
        marker: { line: { width: 0.5, color: 'rgba(255,255,255,0.3)' }, opacity: 0.7 }, // Reduced border intensity
        colorbar: {
            title: { text: metric === 'Yield Potential' ? 'Index' : (metric === 'Temperature' ? '°C' : (metric === 'Humidity' ? '%' : '')), side: 'right' },
            thickness: 15,
            tickfont: { color: 'white' },
            bgcolor: 'rgba(0,0,0,0.5)',
            len: 0.8
        },
        text: texts,
        hoverinfo: 'text', // Show only the custom text
        hoverlabel: {
            bgcolor: '#1f2937', // Dark slate background
            bordercolor: '#fbbf24', // Amber border
            font: { family: 'Outfit, sans-serif', size: 13, color: 'white' },
            align: 'left'
        }
    });

    // 2. City Labels Layer (Famous Cities)
    const majorCities = [
        { name: "CHENNAI", lat: 13.0827, lon: 80.2707 },
        { name: "COIMBATORE", lat: 11.0168, lon: 76.9558 },
        { name: "MADURAI", lat: 9.9252, lon: 78.1198 },
        { name: "TRICHY", lat: 10.7905, lon: 78.7047 },
        { name: "SALEM", lat: 11.6643, lon: 78.1460 },
        { name: "TIRUNELVELI", lat: 8.7139, lon: 77.7567 },
        { name: "BENGALURU", lat: 12.9716, lon: 77.5946 },
        { name: "MYSURU", lat: 12.2958, lon: 76.6394 },
        { name: "KOCHI", lat: 9.9312, lon: 76.2673 },
        { name: "THIRUVANANTHAPURAM", lat: 8.5241, lon: 76.9366 },
        { name: "TIRUPATI", lat: 13.6288, lon: 79.4192 }
    ];

    traces.push({
        type: 'scattermapbox',
        lat: majorCities.map(c => c.lat),
        lon: majorCities.map(c => c.lon),
        mode: 'text',
        text: majorCities.map(c => c.name),
        textfont: {
            family: 'Inter, sans-serif',
            size: 10,
            color: 'rgba(255,255,255,0.9)',
            weight: 'bold'
        },
        hoverinfo: 'none'
    });


    const layout = useMemo(() => ({
        autosize: true,
        height: 500, // Explicit layout height
        margin: { t: 0, b: 0, l: 0, r: 0 },
        paper_bgcolor: '#242f3e',
        plot_bgcolor: '#242f3e',
        mapbox: {
            style: "carto-darkmatter",
            center: { lat: 10.8, lon: 78.5 },
            zoom: 6.2,
        },
        showlegend: false,
        font: {
            family: 'Outfit, sans-serif',
            color: 'white'
        },
        // Remove uirevision to force clean updates if getting stuck
        // uirevision: 'true' 
    }), []);

    return (
        <div style={{
            height: '500px',
            width: '100%',
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#242f3e',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                zIndex: 10,
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}>
                {!hideControls && (
                    <div className="relative group">
                        <select
                            value={metric}
                            onChange={(e) => setMetric(e.target.value)}
                            className="bg-slate-900/90 backdrop-blur-md border border-white/20 text-white text-sm py-2 pl-3 pr-8 rounded-lg outline-none cursor-pointer appearance-none hover:bg-slate-800 transition-colors shadow-lg font-sans"
                        >
                            {allowedMetrics.map(m => (
                                <option key={m} value={m}>{metricLabels[m] || m}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white transition-colors">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: '#fbbf24',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid #fbbf24', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                        Updating Live Data...
                    </div>
                )}
            </div>

            <Plot
                data={traces}
                layout={layout}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                onClick={(event) => {
                    if (event.points && event.points[0]) {
                        const pointIndex = event.points[0].pointIndex;
                        // Use outer 'data' array, not the event object
                        const originalDistrict = data[pointIndex]?.district || event.points[0].text.split('<br>')[0];
                        if (onDistrictSelect) onDistrictSelect(originalDistrict);
                    }
                }}
                config={{
                    displayModeBar: false,
                    responsive: true,
                }}
            />
        </div>
    );
};

export default ClimateMapPlotly;
