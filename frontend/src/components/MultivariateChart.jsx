import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const data = [
    { x: 100, y: 200, z: 200 },
    { x: 120, y: 100, z: 260 },
    { x: 170, y: 300, z: 400 },
    { x: 140, y: 250, z: 280 },
    { x: 150, y: 400, z: 500 },
    { x: 110, y: 280, z: 200 },
];

const MultivariateChart = () => {
    return (
        <div className="h-full w-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Multivariate Cluster Analysis</h3>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis type="number" dataKey="x" name="Rainfall" unit="mm" stroke="#64748b" />
                        <YAxis type="number" dataKey="y" name="Yield" unit="kg" stroke="#64748b" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                        <Scatter name="Zones" data={data} fill="#10b981" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default MultivariateChart
