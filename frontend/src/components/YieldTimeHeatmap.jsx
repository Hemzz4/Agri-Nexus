import React, { useMemo, useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';

const YieldTimeHeatmap = ({ district }) => {
    // LOGIC: Solid Voxel Grid

    const [hoverPoint, setHoverPoint] = useState(null); // { tIdx, rIdx }
    const [activeLift, setActiveLift] = useState(0);
    const requestRef = useRef();

    const TARGET_LIFT = 15;

    const animate = () => {
        // Smooth Spring Physics for "Piston" Lift
        setActiveLift(prev => {
            let target = hoverPoint ? TARGET_LIFT : 0;
            let diff = target - prev;
            if (Math.abs(diff) < 0.1) return target;
            return prev + diff * 0.2;
        });
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [hoverPoint]);

    const data = useMemo(() => {
        // 1. CALCULATE LOGICAL DATA
        const logicalTemps = [];
        for (let t = 20; t <= 40; t += 1) logicalTemps.push(t); // 21 items

        const logicalRains = [];
        for (let r = 0; r <= 300; r += 15) logicalRains.push(r); // 21 items

        const logicalZ = logicalRains.map((r, rIdx) => {
            return logicalTemps.map((t, tIdx) => {
                const tScore = Math.max(0, 100 - Math.abs(t - 28) * 4);
                const rScore = Math.max(0, 100 - Math.abs(r - 150) * 0.5);
                let interaction = 0;
                if (t > 32 && r < 50) interaction = -20;
                if (t < 25 && r > 200) interaction = -10;
                const seed = district.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                const staticNoise = Math.sin(seed + t * 0.5 + r * 0.1) * 2;
                return Math.min(100, Math.max(0, (tScore * 0.5 + rScore * 0.5) + interaction + staticNoise));
            });
        });

        // 2. CONSTRUCT SOLID VOXEL MESH
        const renderX = [];
        const renderY = [];
        const renderZ = [];

        const R_STEPS = logicalRains.length;
        const T_STEPS = logicalTemps.length;

        for (let r = 0; r < R_STEPS; r++) {
            const yCenter = logicalRains[r];

            // 3x3 Subgrid for block flatness
            for (let subY = 0; subY < 3; subY++) {
                const subRowX = [];
                const subRowY = [];
                const subRowZ = [];

                for (let t = 0; t < T_STEPS; t++) {
                    const xCenter = logicalTemps[t];
                    const zVal = logicalZ[r][t];

                    // Interaction
                    let active = (hoverPoint && hoverPoint.tIdx === t && hoverPoint.rIdx === r);
                    let displayZ = zVal + (active ? activeLift : 0);

                    for (let subX = 0; subX < 3; subX++) {
                        // Tight packing
                        subRowX.push(xCenter + (subX * 0.4));
                        subRowY.push(yCenter + (subY * 6));
                        subRowZ.push(displayZ);
                    }
                }
                renderX.push(subRowX);
                renderY.push(subRowY);
                renderZ.push(subRowZ);
            }
        }

        return { x: renderX, y: renderY, z: renderZ };

    }, [district, activeLift, hoverPoint]);

    return (
        <div style={{ width: '100%', height: '600px', marginTop: '1rem', background: 'transparent' }}>
            <Plot
                data={[{
                    type: 'surface',
                    x: data.x,
                    y: data.y,
                    z: data.z,

                    colorscale: 'Jet',

                    // SEMANTIC COLORBAR (Meaningful Labels)
                    colorbar: {
                        title: 'Yield Status',
                        titleside: 'right',
                        tickvals: [15, 50, 85],
                        ticktext: ['Low / Poor', 'Average', 'Optimal / High'],
                        tickfont: { color: '#ffffff', family: 'Outfit, sans-serif' },
                        titlefont: { color: '#ffd700', family: 'Outfit, sans-serif' },
                        len: 0.8,
                        thickness: 20
                    },

                    flatshading: true,
                    connectgaps: false,
                    opacity: 1.0, // Solid (No ghosting)

                    contours: {
                        x: { show: true, color: '#000000', width: 2 },
                        y: { show: true, color: '#000000', width: 2 },
                        z: { show: false } // Removed white shimmer
                    },

                    // MATTE / SOFT LIGHTING (No Glare)
                    lighting: {
                        ambient: 0.5,
                        diffuse: 0.9,
                        specular: 0.2, // Low shine
                        roughness: 0.5, // Matte surface
                        fresnel: 0.1
                    },
                    hovertemplate: '<b>Yield: %{z:.1f}</b><br>Temp: %{x:.0f}°C<br>Rain: %{y:.0f}mm<extra></extra>'
                }]}
                layout={{
                    autosize: true,
                    title: {
                        text: `Interactive 3D Yield: ${district}`,
                        font: { family: 'Outfit, sans-serif', color: '#ffd700', size: 24 },
                        y: 0.95
                    },
                    margin: { t: 50, b: 20, l: 0, r: 0 },
                    paper_bgcolor: 'rgba(0,0,0,0)',

                    uirevision: 'true',

                    scene: {
                        // AXES WITH SUBTLE SPIKES
                        xaxis: {
                            title: 'Temperature (°C)',
                            titlefont: { color: 'cyan' },
                            gridcolor: 'rgba(255,255,255,0.1)',
                            showspikes: true, spikesides: true, spikecolor: 'rgba(255,255,255,0.2)', spikethickness: 2
                        },
                        yaxis: {
                            title: 'Rainfall (mm)',
                            titlefont: { color: '#fbbf24' },
                            gridcolor: 'rgba(255,255,255,0.1)',
                            showspikes: true, spikesides: true, spikecolor: 'rgba(255,255,255,0.2)', spikethickness: 2
                        },
                        zaxis: {
                            title: 'Yield Score',
                            titlefont: { color: '#4ade80' },
                            range: [0, 120],
                            gridcolor: 'rgba(255,255,255,0.1)',
                            showspikes: true, spikesides: true, spikecolor: 'rgba(255,255,255,0.2)', spikethickness: 2
                        },

                        camera: {
                            eye: { x: 1.6, y: 1.6, z: 1.2 }
                        },
                        aspectratio: { x: 1, y: 1, z: 0.6 }
                    }
                }}

                onHover={(e) => {
                    if (e.points && e.points[0]) {
                        const pt = e.points[0];
                        const tIdx = Math.round(pt.x) - 20;
                        const rIdx = Math.round(pt.y / 15);
                        if (tIdx >= 0 && tIdx < 21 && rIdx >= 0 && rIdx < 21) {
                            setHoverPoint({ tIdx, rIdx });
                        }
                    }
                }}
                onUnhover={() => setHoverPoint(null)}

                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false }}
            />
        </div>
    );
};

export default YieldTimeHeatmap;
