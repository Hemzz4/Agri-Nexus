import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Sprout, Save, Loader2, Lock, Shield, Map } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        district: '',
        block_name: '',
        pincode: '',
        address: '',
        area: '',
        soil_type: '',
        uses_fertilizers: false
    });
    const [locations, setLocations] = useState({});
    const [districtOptions, setDistrictOptions] = useState([]);
    const [blockOptions, setBlockOptions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('token');

                // Fetch Profile and Locations in parallel
                const [profileRes, locationsRes] = await Promise.all([
                    axios.get('http://localhost:8000/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:8000/locations')
                ]);

                // Setup Locations
                setLocations(locationsRes.data);
                setDistrictOptions(Object.keys(locationsRes.data).sort());

                // Setup Profile Data
                const { password, ...rest } = profileRes.data;
                setFormData(prev => ({ ...prev, ...rest }));

                // Set initial block options if district is already selected
                if (rest.district && locationsRes.data[rest.district]) {
                    setBlockOptions(locationsRes.data[rest.district].sort());
                }

            } catch (err) {
                console.error("Failed to fetch data", err);
                setError('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const updates = { [name]: finalValue };

            // Handle cascading dropdown
            if (name === 'district') {
                updates.block_name = ''; // Reset block when district changes
                setBlockOptions(locations[value] ? locations[value].sort() : []);
            }

            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const token = sessionStorage.getItem('token');
            const payload = { ...formData };
            if (!payload.password) delete payload.password;
            if (!payload.email) delete payload.email;

            await axios.put('http://localhost:8000/auth/me', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Profile updated successfully!');
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (err) {
            console.error("Update failed", err);
            setError('Failed to update profile. ' + (err.response?.data?.detail || ''));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Profile Settings</h1>
                        <p className="text-slate-400">Manage your account and agricultural details</p>
                    </div>
                </div>

                {message && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6">{message}</div>}
                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Details */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-emerald-300">
                            <Shield size={20} /> Personal Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <InputGroup label="Full Name" icon={User} name="full_name" value={formData.full_name} onChange={handleChange} />
                            <InputGroup label="Email" icon={Mail} name="email" value={formData.email} onChange={handleChange} type="email" />
                            <InputGroup label="New Password (optional)" icon={Lock} name="password" value={formData.password} onChange={handleChange} type="password" placeholder="Leave blank to keep current" />
                        </div>
                    </div>

                    {/* Address Details */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-emerald-300">
                            <MapPin size={20} /> Location Details
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <InputGroup label="Address" name="address" value={formData.address} onChange={handleChange} fullWidth />

                            <SelectGroup
                                label="District"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                options={districtOptions}
                                placeholder="Select District"
                            />

                            <SelectGroup
                                label="Block Name"
                                name="block_name"
                                value={formData.block_name}
                                onChange={handleChange}
                                options={blockOptions}
                                placeholder="Select Block"
                                disabled={!formData.district}
                            />

                            <InputGroup label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
                            <InputGroup label="Area / Village" name="area" value={formData.area} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Agricultural Details */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-emerald-300">
                            <Sprout size={20} /> Agricultural Data
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <SelectGroup
                                label="Soil Type"
                                name="soil_type"
                                value={formData.soil_type}
                                onChange={handleChange}
                                options={['Clay', 'Sandy', 'Loamy', 'Red', 'Black', 'Alluvial']}
                                placeholder="Select Soil Type"
                            />

                            <div className="flex items-center space-x-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl h-[86px]">
                                <input
                                    type="checkbox"
                                    name="uses_fertilizers"
                                    checked={formData.uses_fertilizers || false}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                                />
                                <span className="text-slate-300">Uses Fertilizers?</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={saving}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 ml-auto"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const InputGroup = ({ label, icon: Icon, fullWidth, ...props }) => (
    <div className={`space-y-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className="text-sm font-medium text-slate-400 ml-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />}
            <input
                className={`w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all`}
                {...props}
            />
        </div>
    </div>
);

const SelectGroup = ({ label, options, placeholder, disabled, ...props }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-slate-400 ml-1">{label}</label>
        <select
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            {...props}
        >
            <option value="">{placeholder}</option>
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

export default Profile;
