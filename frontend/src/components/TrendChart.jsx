import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'

const data = [
    { day: 'Mon', temp: 28, rain: 10 },
    { day: 'Tue', temp: 30, rain: 5 },
    { day: 'Wed', temp: 32, rain: 0 },
    { day: 'Thu', temp: 29, rain: 15 },
    { day: 'Fri', temp: 27, rain: 30 },
    { day: 'Sat', temp: 28, rain: 20 },
    { day: 'Sun', temp: 31, rain: 5 },
];

const TrendChart = () => {
    return (
        <div className="h-full w-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">7-Day Forecasting Trend</h3>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fba919" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#fba919" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="temp" stroke="#fba919" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                        <Area type="monotone" dataKey="rain" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorRain)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default TrendChart
