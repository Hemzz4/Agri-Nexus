import React from 'react';
import { Clock } from 'lucide-react';
import YieldHeatmap from '../YieldHeatmap';
import AdvancedAnalytics from '../AdvancedAnalytics';

const HistoricalAnalyticsSection = () => {
    return (
        <section className="mb-12 pt-8 border-t border-white/5">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 mb-6 flex items-center gap-3">
                <Clock className="text-blue-400" /> Historical Analytics
            </h2>

            {/* District-Wise Yield Heatmap - Primary Insight Provider */}
            <div className="mb-12">
                <YieldHeatmap />
            </div>

            {/* Section Divider */}
            <div className="flex items-center justify-center mb-12">
                <div className="h-px flex-1 bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
                <div className="mx-4 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-semibold tracking-wider uppercase">
                    Deep Dive Analysis
                </div>
                <div className="h-px flex-1 bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
            </div>

            {/* Advanced Analytics Component handles its own data fetching and layout */}
            <AdvancedAnalytics />
        </section>
    );
};

export default HistoricalAnalyticsSection;
