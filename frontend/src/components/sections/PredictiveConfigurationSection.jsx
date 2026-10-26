import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { motion } from 'framer-motion';
import PredictiveClimateChart from '../PredictiveClimateChart';

const GlassCard = ({ children, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`glass-panel p-6 ${className}`}
    >
        {children}
    </motion.div>
);

const PredictiveConfigurationSection = () => {
    return (
        <section className="mb-12 pt-8 border-t border-white/5">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-pink-400 mb-6 flex items-center gap-3">
                <Sprout className="text-indigo-400" /> Climate Predictions (2026-2030)
            </h2>

            <div className="grid grid-cols-1 gap-8">
                {/* Predictive Climate Chart - Full Width */}
                <PredictiveClimateChart />
            </div>
        </section>
    );
};

export default PredictiveConfigurationSection;
