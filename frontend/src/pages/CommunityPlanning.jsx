import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Sprout, Calendar, MapPin, Plus, Trash2, Loader2, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CommunityPlanning = () => {
    // State for My Plans
    const [myPlans, setMyPlans] = useState([]);
    const [newPlan, setNewPlan] = useState({
        crop_name: '',
        sowing_date: '',
        duration_days: ''
    });

    // State for Community Stats
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const [plansRes, statsRes] = await Promise.all([
                axios.get('http://localhost:8000/planning/my', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:8000/planning/community', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setMyPlans(plansRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Fetch error", err);
            // setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlan = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post('http://localhost:8000/planning/', newPlan, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.warnings && response.data.warnings.length > 0) {
                // Show warnings. For now, we set message with warning content
                setMessage(response.data.warnings.join(' '));
                // Alternatively, use a separate warning state for styling
            } else {
                setMessage('Plan added successfully!');
            }

            setNewPlan({ crop_name: '', sowing_date: '', duration_days: '' });
            fetchData(); // Refresh data
        } catch (err) {
            setError('Failed to add plan');
        }
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`http://localhost:8000/planning/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    // Chart Data Preparation
    const pieData = stats ? Object.entries(stats.crop_counts).map(([name, value]) => ({ name, value })) : [];
    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto text-white space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400">
                    <Users size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Community Crop Planning</h1>
                    <p className="text-slate-400">Collaborate with farmers in {stats?.block || 'your area'} to optimize production</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column: My Plans */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
                >
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-emerald-300">
                        <Plus size={20} /> Add New Cultivation Plan
                    </h2>

                    <form onSubmit={handleAddPlan} className="space-y-4 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-slate-400 ml-1">Crop Name</label>
                                <input
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white"
                                    placeholder="e.g. Rice, Tomato"
                                    value={newPlan.crop_name}
                                    onChange={e => setNewPlan({ ...newPlan, crop_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 ml-1">Sowing Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white"
                                    value={newPlan.sowing_date}
                                    onChange={e => setNewPlan({ ...newPlan, sowing_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 ml-1">Duration (Days)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white"
                                placeholder="e.g. 120"
                                value={newPlan.duration_days}
                                onChange={e => setNewPlan({ ...newPlan, duration_days: e.target.value })}
                                required
                            />
                        </div>
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all">
                            Add Plan
                        </button>
                    </form>

                    <h3 className="font-bold text-lg mb-4 text-slate-300">My Active Plans</h3>
                    <div className="space-y-3">
                        {myPlans.length === 0 && <p className="text-slate-500 text-center py-4">No plans added yet.</p>}
                        {myPlans.map(plan => (
                            <div key={plan.id} className="bg-slate-900/40 p-4 rounded-xl flex items-center justify-between border border-white/5">
                                <div>
                                    <h4 className="font-bold text-emerald-400">{plan.crop_name}</h4>
                                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> Sown: {plan.sowing_date}</span>
                                        <span className="flex items-center gap-1"><Sprout size={12} /> Harvest: {plan.harvest_date}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDeletePlan(plan.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Column: Community Stats */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
                >
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-purple-300">
                        <BarChart2 size={20} /> Community Insights
                    </h2>

                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-200 text-sm">Target Region</p>
                                <p className="font-bold text-lg flex items-center gap-2">
                                    <MapPin size={16} /> {stats?.district}, {stats?.block}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-purple-200 text-sm">Active Farmers</p>
                                <p className="font-bold text-2xl">{stats?.total_farmers || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                No community data available yet.
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <h4 className="font-semibold text-slate-300 mb-3">Crop Distribution</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between bg-slate-900/30 p-2 rounded-lg px-3">
                                    <span className="flex items-center gap-2 text-sm text-slate-300">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        {entry.name}
                                    </span>
                                    <span className="font-bold text-white">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Community Plans Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
            >
                <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-blue-300">
                    <Calendar size={20} /> Community Schedule
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 border-b border-white/10">
                                <th className="p-4 font-medium">Farmer Name</th>
                                <th className="p-4 font-medium">Crop</th>
                                <th className="p-4 font-medium">Sowing Date</th>
                                <th className="p-4 font-medium">Duration</th>
                                <th className="p-4 font-medium">Harvest Date (Est.)</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-200">
                            {stats?.plans?.length > 0 ? (
                                stats.plans.map((plan, index) => {
                                    // Calculate harvest date for display
                                    const sowing = new Date(plan.sowing_date);
                                    const harvest = new Date(sowing.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
                                    return (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">{plan.farmer_name}</td>
                                            <td className="p-4 flex items-center gap-2">
                                                <Sprout size={16} className="text-emerald-400" /> {plan.crop_name}
                                            </td>
                                            <td className="p-4">{plan.sowing_date}</td>
                                            <td className="p-4">{plan.duration_days} days</td>
                                            <td className="p-4 text-slate-400">{harvest.toISOString().split('T')[0]}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No active plans in this area yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default CommunityPlanning;
