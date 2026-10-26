import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Sun, Clock, Sprout, Wind, Beaker, User, Users, MessageSquare, Bot } from 'lucide-react';
import './App.css';
import { motion } from 'framer-motion';

// Pages
import LiveWeatherPage from './pages/LiveWeatherPage';
import HistoricalWeatherPage from './pages/HistoricalWeatherPage';
import PredictiveWeatherPage from './pages/PredictiveWeatherPage';
import FertilizerRecommendation from './components/FertilizerRecommendation';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CommunityPlanning from './pages/CommunityPlanning';
import AIIntelligencePage from './pages/AIIntelligencePage';
import TextMiningPage from './pages/TextMiningPage';
import UnifiedDashboard from './pages/UnifiedDashboard';

// Auth Guard
const PrivateRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');
    return token ? children : <Navigate to="/login" replace />;
};

const NavLink = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link to={to} className={`relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            {isActive && (
                <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-white/10 border border-white/5"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
            <span className="relative z-10">{icon}</span>
            <span className="relative z-10 font-medium">{label}</span>
        </Link>
    );
};

const DashboardLayout = ({ children }) => (
    <div className="flex min-h-screen bg-[#0f172a] text-white">
        {/* Sidebar Navigation */}
        <aside className="w-64 fixed h-full bg-[#1e293b]/50 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 z-50">
            <div className="mb-10 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Wind className="text-emerald-400" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-wide">AGRI-INSIGHT</h1>
                    <p className="text-xs text-slate-500">Climate Intelligence</p>
                </div>
            </div>

            <nav className="space-y-2">
                <NavLink to="/ai-intelligence" icon={<Bot size={20} />} label="AI Intelligence" />
                <NavLink to="/live" icon={<Sun size={20} />} label="Live Weather" />
                <NavLink to="/history" icon={<Clock size={20} />} label="Historical Data" />
                <NavLink to="/predict" icon={<Sprout size={20} />} label="Predictive" />

                <NavLink to="/fertilizer" icon={<Beaker size={20} />} label="Fertilizer Expert" />
                <NavLink to="/planning" icon={<Users size={20} />} label="Community Planning" />
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                <Link to="/profile" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group">
                    <User size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Profile Settings</span>
                </Link>

                <div className="pt-2">
                    <p className="text-xs text-slate-600 mb-2 px-4">v2.0.1 Stable</p>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl w-full transition-all"
                    >
                        <User size={16} className="rotate-180" /> {/* Using generic icon for now or LogOut if available */}
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-6 overflow-x-hidden">
            {children}
        </main>
    </div>
);

const App = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/ai-intelligence" replace />} />

            <Route path="/ai-intelligence" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <AIIntelligencePage />
                    </DashboardLayout>
                </PrivateRoute>
            } />

            <Route path="/text-mining" element={<Navigate to="/ai-intelligence" replace />} />

            <Route path="/live" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <LiveWeatherPage />
                    </DashboardLayout>
                </PrivateRoute>
            } />

            <Route path="/history" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <HistoricalWeatherPage />
                    </DashboardLayout>
                </PrivateRoute>
            } />

            <Route path="/predict" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <PredictiveWeatherPage />
                    </DashboardLayout>
                </PrivateRoute>
            } />

            <Route path="/fertilizer" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <FertilizerRecommendation />
                    </DashboardLayout>
                </PrivateRoute>
            } />

            <Route path="/profile" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <Profile />
                    </DashboardLayout>
                </PrivateRoute>
            } />

            <Route path="/planning" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <CommunityPlanning />
                    </DashboardLayout>
                </PrivateRoute>
            } />

            <Route path="/text-mining" element={
                <PrivateRoute>
                    <DashboardLayout>
                        <TextMiningPage />
                    </DashboardLayout>
                </PrivateRoute>
            } />
        </Routes>
    );
};

export default App;
