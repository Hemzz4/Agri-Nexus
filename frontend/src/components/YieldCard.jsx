import { useState } from 'react'
import { Search, Thermometer, Droplets, Wind, Sprout } from 'lucide-react'
import { motion } from 'framer-motion'
import { predictWeather } from '../api'

const districts = [
    "Coimbatore", "Ariyalur", "Chennai", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
    "Kancheepuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam",
    "Namakkal", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga",
    "Thanjavur", "The Nilgiris", "Theni", "Thiruvallur", "Thiruvarur", "Thoothukkudi",
    "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Tiruvannamalai", "Vellore", "Villupuram", "Virudhunagar"
]

const YieldCard = () => {
    const [formData, setFormData] = useState({
        district: 'Coimbatore',
        year: 2024,
        month: 5
    })
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handlePredict = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await predictWeather(formData.district, formData.year, formData.month)
            setResult(data)
        } catch (err) {
            setError("Failed to fetch prediction.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sprout className="text-emerald-400" /> Yield Prediction
                </h2>
                {result && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">High Confidence</span>}
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="text-xs text-slate-400 uppercase font-semibold mb-1 block">District</label>
                    <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full bg-slate-800/50 border border-white/10 text-white p-2 rounded-lg text-sm"
                    >
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold mb-1 block">Year: {formData.year}</label>
                        <input type="range" min="2000" max="2030" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold mb-1 block">Month: {formData.month}</label>
                        <input type="range" min="1" max="12" value={formData.month} onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })} className="w-full accent-emerald-500" />
                    </div>
                </div>

                <button
                    onClick={handlePredict}
                    disabled={loading}
                    className="w-full py-3 bg-linear-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"
                >
                    {loading ? "Calculating..." : <><Search size={16} /> Predict Yield</>}
                </button>
            </div>

            {/* Result Area - Compact */}
            <div className="flex-1 bg-slate-900/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                {result ? (
                    <div className="grid grid-cols-2 gap-3 h-full content-center">
                        <Metric icon={<Thermometer size={14} />} label="Temp" value={result.Temperature} unit="°C" color="text-orange-400" />
                        <Metric icon={<Droplets size={14} />} label="Humid" value={result.Humidity} unit="%" color="text-blue-400" />
                        <Metric icon={<Wind size={14} />} label="Wind" value={result.Wind_Speed} unit="km/h" color="text-slate-400" />
                        <Metric icon={<Sprout size={14} />} label="Soil" value={result.Soil_Wetness} unit="" color="text-emerald-400" />
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">
                        Ready to predict
                    </div>
                )}
            </div>
        </div>
    )
}

const Metric = ({ icon, label, value, unit, color }) => (
    <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
            <div className="text-lg font-bold text-white leading-none">{typeof value === 'number' ? value.toFixed(1) : value}<small className="text-xs text-slate-500 ml-1">{unit}</small></div>
            <div className="text-[10px] text-slate-400 uppercase">{label}</div>
        </div>
    </div>
)

export default YieldCard
