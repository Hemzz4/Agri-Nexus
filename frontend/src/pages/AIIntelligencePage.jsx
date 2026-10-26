import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    TrendingUp,
    FileText,
    Search,
    Send,
    AlertCircle,
    CheckCircle2,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    ChevronRight,
    Activity,
    Sliders,
    Tag,
    HelpCircle,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Bug,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    Layers,
    FileSpreadsheet,
    Share2,
    CheckCheck,
    Leaf,
    ExternalLink,
    Info
} from 'lucide-react';
import {
    predictAdvisory,
    predictSentiment,
    summarizeText,
    findSimilarQueries,
    extractPestAndCrop
} from '../api';

const TABS = [
    {
        id: 'extractor',
        label: 'Pest & Crop Extractor',
        shortDesc: 'NER & IPM Action Guide',
        icon: Bug,
        accent: 'rose',
        textColor: 'text-rose-400',
        activeClasses: 'border-rose-500/40 bg-rose-500/10 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
    },
    {
        id: 'advisory',
        label: 'AI Agronomist',
        shortDesc: 'Disease & Pest Diagnosis',
        icon: Bot,
        accent: 'emerald',
        textColor: 'text-emerald-400',
        activeClasses: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
    },
    {
        id: 'sentiment',
        label: 'Sentiment Analyzer',
        shortDesc: 'Market & News Intelligence',
        icon: TrendingUp,
        accent: 'cyan',
        textColor: 'text-cyan-400',
        activeClasses: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
    },
    {
        id: 'summary',
        label: 'Agri-Report Summarizer',
        shortDesc: 'Instant Research Digest',
        icon: FileText,
        accent: 'amber',
        textColor: 'text-amber-400',
        activeClasses: 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
    },
    {
        id: 'similar',
        label: 'Farmer Query Search',
        shortDesc: 'Database of Past Solutions',
        icon: Search,
        accent: 'indigo',
        textColor: 'text-indigo-400',
        activeClasses: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
    }
];

const SAMPLE_PROMPTS = {
    extractor: [
        'Severe whiteflies and leaf curl virus observed on tomato and chilli crops with yellowing leaves and curling.',
        'Fall armyworm caterpillars attacking maize whorls causing extensive defoliation, holes and dead hearts.',
        'Brown planthopper infestation at the base of paddy tillers with drying hopper burn patches and wilting.',
        'Pink bollworms boring into cotton bolls alongside red spider mites spinning webs under leaves.',
        'Sugarcane red rot showing red discoloration inside stem along with subterranean termite damage.'
    ],
    advisory: [
        'Paddy blast disease with spindle-shaped brown lesions on leaves',
        'Tomato leaves curling upwards with stunted growth and yellow veins',
        'Cotton plants infested with whiteflies and honeydew mold',
        'Sugarcane red rot showing red discoloration inside stem'
    ],
    sentiment: [
        'Record wheat procurement and surplus monsoon drive strong agricultural commodity optimism',
        'Unseasonal heavy rain and hail devastate standing onion harvest in southern districts',
        'Government increases fertilizer subsidies by 15% to stabilize input costs for farmers'
    ],
    summary: [
        'Precision agriculture combines IoT soil sensors, satellite imagery, and automated drip irrigation to optimize crop yields while reducing fresh water consumption by up to 40%. In Tamil Nadu, smallholder farmers adopting micro-irrigation systems have reported a 25% rise in farm income along with reduced fertilizer wastage. The state agriculture department provides 70% capital subsidies for drip equipment installation across delta districts. Farmers also receive real-time weather forecasts via SMS alerts to time irrigation cycles efficiently before heavy precipitation events.'
    ],
    similar: [
        'My tomato leaves are turning yellow with brown spots',
        'Paddy leaves drying from tip to base with white stripes',
        'Black aphids attacking tender shoots of chilli plants'
    ]
};

const AIIntelligencePage = ({ isEmbedded = false }) => {
    const [activeTab, setActiveTab] = useState('extractor');

    // 0. Pest & Crop Extractor State
    const [extractorQuery, setExtractorQuery] = useState('');
    const [extractorResult, setExtractorResult] = useState(null);
    const [extractorLoading, setExtractorLoading] = useState(false);
    const [extractorError, setExtractorError] = useState(null);
    const [extractorView, setExtractorView] = useState('annotated'); // 'annotated' | 'entities' | 'ipm' | 'matrix'
    const [extractorFilter, setExtractorFilter] = useState('all'); // 'all' | 'crops' | 'pests' | 'diseases' | 'symptoms'
    const [extractorCopied, setExtractorCopied] = useState(false);

    // 1. AI Agronomist State
    const [advisoryQuery, setAdvisoryQuery] = useState('');
    const [advisoryResult, setAdvisoryResult] = useState(null);
    const [advisoryLoading, setAdvisoryLoading] = useState(false);
    const [advisoryError, setAdvisoryError] = useState(null);

    // 2. Sentiment State
    const [sentimentQuery, setSentimentQuery] = useState('');
    const [sentimentResult, setSentimentResult] = useState(null);
    const [sentimentLoading, setSentimentLoading] = useState(false);
    const [sentimentError, setSentimentError] = useState(null);

    // 3. Summarization State
    const [summaryQuery, setSummaryQuery] = useState('');
    const [summaryCount, setSummaryCount] = useState(3);
    const [summaryResult, setSummaryResult] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(null);
    const [copied, setCopied] = useState(false);

    // 4. Similar Queries State
    const [similarQuery, setSimilarQuery] = useState('');
    const [similarResult, setSimilarResult] = useState(null);
    const [similarLoading, setSimilarLoading] = useState(false);
    const [similarError, setSimilarError] = useState(null);

    // Handlers
    const handleExtractorSubmit = async (e, manualQuery) => {
        if (e) e.preventDefault();
        const text = manualQuery || extractorQuery;
        if (!text.trim()) return;

        setExtractorLoading(true);
        setExtractorError(null);
        try {
            const data = await extractPestAndCrop(text);
            setExtractorResult(data);
        } catch (err) {
            setExtractorError("Failed to extract pests, crops, and agronomic entities. Please ensure the backend server is reachable.");
        } finally {
            setExtractorLoading(false);
        }
    };

    const handleCopyExtractorReport = () => {
        if (!extractorResult) return;
        const r = extractorResult;
        let report = `=== AGRI-INSIGHT PEST & CROP EXTRACTOR REPORT ===\n`;
        report += `Analyzed Text: "${r.query_text}"\n`;
        report += `Overall Threat Level: ${r.metrics?.overall_risk || 'N/A'}\n`;
        report += `Identified: ${r.metrics?.total_crops || 0} Crops, ${r.metrics?.total_pests || 0} Pests, ${r.metrics?.total_diseases || 0} Diseases, ${r.metrics?.total_symptoms || 0} Symptoms\n\n`;

        if (r.crops?.length) {
            report += `🌾 DETECTED CROPS (${r.crops.length}):\n`;
            r.crops.forEach(c => report += `  • ${c.name} (${c.scientific_name}) - Category: ${c.category}\n`);
            report += `\n`;
        }

        if (r.pests?.length) {
            report += `🐛 DETECTED PESTS & INSECTS (${r.pests.length}):\n`;
            r.pests.forEach(p => {
                report += `  • ${p.name} (${p.scientific_name}) [Severity: ${p.severity}, Type: ${p.pest_type}]\n`;
                report += `    Damage: ${p.damage_description}\n`;
                if (p.susceptible_crops?.length) {
                    report += `    Host Crops: ${p.susceptible_crops.join(', ')}\n`;
                }
            });
            report += `\n`;
        }

        if (r.diseases?.length) {
            report += `🦠 DETECTED PATHOGEN DISEASES (${r.diseases.length}):\n`;
            r.diseases.forEach(d => report += `  • ${d.name} (${d.scientific_name}) - Type: ${d.disease_type}\n`);
            report += `\n`;
        }

        if (r.symptoms?.length) {
            report += `⚠️ DETECTED DAMAGE SYMPTOMS (${r.symptoms.length}):\n`;
            r.symptoms.forEach(s => report += `  • ${s.name} (Tokens: ${s.matched_tokens?.join(', ') || 'N/A'})\n`);
            report += `\n`;
        }

        if (r.associations?.length) {
            report += `🔗 PEST-CROP THREAT ASSOCIATIONS:\n`;
            r.associations.forEach(a => report += `  • [${a.threat_level}] ${a.pest_name} attacks ${a.crop_name}: ${a.interaction_note}\n`);
            report += `\n`;
        }

        if (r.ipm_recommendations?.length) {
            report += `🛡️ INTEGRATED PEST MANAGEMENT (IPM) 4-PILLAR ACTION PLAN:\n`;
            r.ipm_recommendations.forEach(rec => {
                report += `------------------------------------------------------------\n`;
                report += `TARGET: ${rec.target} [Threat: ${rec.threat_level}]\n`;
                report += `  1. Cultural & Mechanical: ${rec.cultural}\n`;
                report += `  2. Biological & Predators: ${rec.biological}\n`;
                report += `  3. Botanical & Organic: ${rec.botanical}\n`;
                report += `  4. Targeted Chemical: ${rec.chemical}\n`;
            });
            report += `------------------------------------------------------------\n`;
        }

        navigator.clipboard.writeText(report);
        setExtractorCopied(true);
        setTimeout(() => setExtractorCopied(false), 2200);
    };

    const renderAnnotatedText = (fullText, spans) => {
        if (!fullText) return null;
        if (!spans || spans.length === 0) {
            return <span className="text-slate-300 leading-relaxed font-mono">{fullText}</span>;
        }

        const sortedSpans = [...spans].sort((a, b) => a.start - b.start);
        const elements = [];
        let currentIndex = 0;

        sortedSpans.forEach((span, idx) => {
            if (span.start > currentIndex) {
                elements.push(
                    <span key={`text-${currentIndex}`} className="text-slate-300">
                        {fullText.slice(currentIndex, span.start)}
                    </span>
                );
            }

            let badgeStyle = "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
            let iconText = "🐛";
            if (span.type === 'crop') {
                badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                iconText = "🌾";
            } else if (span.type === 'disease') {
                badgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]";
                iconText = "🦠";
            } else if (span.type === 'symptom') {
                badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
                iconText = "⚠️";
            }

            elements.push(
                <span
                    key={`span-${idx}`}
                    title={`${span.type.toUpperCase()}: ${span.label}`}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 my-0.5 rounded-lg border text-xs font-semibold ${badgeStyle} transition hover:scale-105`}
                >
                    <span>{iconText}</span>
                    <span className="font-bold underline decoration-dotted">{fullText.slice(span.start, span.end)}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-80 px-1 py-0.2 rounded bg-white/10 font-mono">
                        {span.label}
                    </span>
                </span>
            );

            currentIndex = span.end;
        });

        if (currentIndex < fullText.length) {
            elements.push(
                <span key={`text-end`} className="text-slate-300">
                    {fullText.slice(currentIndex)}
                </span>
            );
        }

        return <div className="leading-relaxed font-mono text-sm">{elements}</div>;
    };

    const handleAdvisorySubmit = async (e, manualQuery) => {
        if (e) e.preventDefault();
        const text = manualQuery || advisoryQuery;
        if (!text.trim()) return;

        setAdvisoryLoading(true);
        setAdvisoryError(null);
        try {
            const data = await predictAdvisory(text);
            setAdvisoryResult(data);
        } catch (err) {
            setAdvisoryError("Unable to analyze crop advisory query. Please verify the backend service is running.");
        } finally {
            setAdvisoryLoading(false);
        }
    };

    const handleSentimentSubmit = async (e, manualQuery) => {
        if (e) e.preventDefault();
        const text = manualQuery || sentimentQuery;
        if (!text.trim()) return;

        setSentimentLoading(true);
        setSentimentError(null);
        try {
            const data = await predictSentiment(text);
            setSentimentResult(data);
        } catch (err) {
            setSentimentError("Failed to perform sentiment analysis. Please check backend connection.");
        } finally {
            setSentimentLoading(false);
        }
    };

    const handleSummarySubmit = async (e, manualQuery) => {
        if (e) e.preventDefault();
        const text = manualQuery || summaryQuery;
        if (!text.trim()) return;

        setSummaryLoading(true);
        setSummaryError(null);
        try {
            const data = await summarizeText(text, summaryCount);
            setSummaryResult(data);
        } catch (err) {
            setSummaryError("Failed to summarize agricultural document.");
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleSimilarSubmit = async (e, manualQuery) => {
        if (e) e.preventDefault();
        const text = manualQuery || similarQuery;
        if (!text.trim()) return;

        setSimilarLoading(true);
        setSimilarError(null);
        try {
            const data = await findSimilarQueries(text);
            setSimilarResult(data);
        } catch (err) {
            setSimilarError("Failed to find matching historical farmer queries.");
        } finally {
            setSimilarLoading(false);
        }
    };

    const handleCopySummary = () => {
        if (!summaryResult?.summary) return;
        navigator.clipboard.writeText(summaryResult.summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Page Header */}
            {!isEmbedded && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                            AI Intelligence Hub
                        </h1>
                        <p className="text-sm md:text-base text-slate-400 mt-1">
                            Natural language understanding & smart agricultural problem solving
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            AI Core Online
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-1.5 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                                isActive
                                    ? tab.activeClasses
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-white/10' : 'bg-slate-800/80 text-slate-400'}`}>
                                <Icon size={20} className={isActive ? tab.textColor : ''} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate leading-tight">{tab.label}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{tab.shortDesc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Main Feature Viewport */}
            <AnimatePresence mode="wait">
                {/* 0. PEST & CROP EXTRACTOR */}
                {activeTab === 'extractor' && (
                    <motion.div
                        key="extractor"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6"
                    >
                        {/* Top Input & Scenarios Card */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                                        <Bug size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            Pest & Crop Extractor
                                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                Domain NLP & IPM
                                            </span>
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            High-precision Named Entity Recognition for Crops, Pests, Diseases, Symptoms & IPM Prescriptions
                                        </p>
                                    </div>
                                </div>

                                {extractorResult && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCopyExtractorReport}
                                            className="text-xs px-3 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center gap-1.5 transition"
                                        >
                                            {extractorCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                            {extractorCopied ? "Copied Report!" : "Copy Report"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExtractorResult(null);
                                                setExtractorQuery('');
                                            }}
                                            className="text-xs px-3 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-white/10 flex items-center gap-1.5 transition"
                                        >
                                            <RotateCcw size={14} />
                                            Reset
                                        </button>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={(e) => handleExtractorSubmit(e)} className="space-y-4">
                                <div className="relative">
                                    <textarea
                                        value={extractorQuery}
                                        onChange={(e) => setExtractorQuery(e.target.value)}
                                        rows={3}
                                        placeholder="Type or paste farmer field notes, crop scouting text, or pest reports (e.g., 'Severe whiteflies and leaf curl observed on tomato with yellowing leaves...')"
                                        className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/40 resize-none transition"
                                    />
                                    <div className="absolute right-3 bottom-3 text-[11px] text-slate-500 font-mono">
                                        {extractorQuery.length} chars
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-400 mb-2 block flex items-center gap-1.5">
                                        <Sparkles size={13} className="text-rose-400" />
                                        Quick Test Field Scenarios:
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SAMPLE_PROMPTS.extractor.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setExtractorQuery(prompt);
                                                    handleExtractorSubmit(null, prompt);
                                                }}
                                                className="text-xs px-3 py-1.5 bg-slate-900/60 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-slate-700/50 hover:border-rose-500/30 rounded-lg text-left transition flex items-center gap-1.5 group"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60 group-hover:bg-rose-400"></span>
                                                <span className="line-clamp-1 max-w-[340px]">{prompt}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Info size={14} className="text-slate-500 shrink-0" />
                                        Matches 30+ crops, 16 destructive pests, 12 plant pathogens, and 10 symptom classes.
                                    </p>

                                    <button
                                        type="submit"
                                        disabled={extractorLoading || !extractorQuery.trim()}
                                        className="w-full sm:w-auto min-w-[220px] py-2.5 px-5 bg-gradient-to-r from-rose-500 via-pink-600 to-amber-600 hover:from-rose-600 hover:via-pink-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition"
                                    >
                                        {extractorLoading ? (
                                            <>
                                                <Activity size={18} className="animate-spin" />
                                                Extracting Agro-Entities...
                                            </>
                                        ) : (
                                            <>
                                                <Bug size={18} />
                                                Extract Pests, Crops & IPM
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Error Banner */}
                        {extractorError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-2.5">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <p>{extractorError}</p>
                            </div>
                        )}

                        {/* Loading State */}
                        {extractorLoading && (
                            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                                <div className="relative mb-4">
                                    <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-400 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Bug size={24} className="text-rose-400 animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-white mb-1">Scanning Agricultural Corpus & Taxonomy...</h3>
                                <p className="text-xs text-slate-400 max-w-sm">
                                    Parsing domain entities, matching host crop vulnerabilities, identifying damage symptoms, and compiling 4-pillar IPM recommendations.
                                </p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!extractorResult && !extractorLoading && !extractorError && (
                            <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/5 text-rose-400/50 mb-4">
                                    <Bug size={48} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-200 mb-1">Ready for Field Text Mining</h3>
                                <p className="text-xs text-slate-400 max-w-md mb-6">
                                    Enter crop scouting notes or click one of the quick test field scenarios above to analyze pests, crops, pathogen diseases, damage symptoms, and get comprehensive IPM recommendations.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
                                    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-left">
                                        <span className="text-emerald-400 text-base mb-1 block">🌾</span>
                                        <p className="text-xs font-semibold text-slate-300">Crops & Host Plants</p>
                                        <p className="text-[11px] text-slate-500">Cereals, vegetables, cash crops, millets & plantation</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-left">
                                        <span className="text-rose-400 text-base mb-1 block">🐛</span>
                                        <p className="text-xs font-semibold text-slate-300">Destructive Pests</p>
                                        <p className="text-[11px] text-slate-500">Borers, armyworms, sucking insects, nematodes, mites</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-left">
                                        <span className="text-purple-400 text-base mb-1 block">🦠</span>
                                        <p className="text-xs font-semibold text-slate-300">Plant Pathogens</p>
                                        <p className="text-[11px] text-slate-500">Fungal blights, rusts, wilts, viruses & bacterial cankers</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-left">
                                        <span className="text-amber-400 text-base mb-1 block">🛡️</span>
                                        <p className="text-xs font-semibold text-slate-300">4-Pillar IPM Guides</p>
                                        <p className="text-[11px] text-slate-500">Cultural, biological, botanical & precision chemical</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Result Dashboard */}
                        {extractorResult && !extractorLoading && (
                            <div className="space-y-6">
                                {/* 1. Executive Summary & Stat Badges */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {/* Overall Risk Card */}
                                    {(() => {
                                        const risk = extractorResult.metrics?.overall_risk || 'Unknown';
                                        const isCrit = risk.toLowerCase().includes('crit');
                                        const isHigh = risk.toLowerCase().includes('high');
                                        const isMod = risk.toLowerCase().includes('mod');
                                        const isLow = risk.toLowerCase().includes('low') || risk.toLowerCase().includes('health');

                                        const riskColor = isCrit
                                            ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                            : isHigh
                                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                            : isMod
                                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                            : isLow
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                            : 'bg-slate-700/20 border-slate-600/30 text-slate-300';

                                        return (
                                            <div className={`col-span-2 p-4 rounded-2xl border ${riskColor} flex items-center justify-between`}>
                                                <div>
                                                    <p className="text-[11px] font-mono uppercase tracking-wider opacity-75">Threat Risk Index</p>
                                                    <h4 className="text-xl font-black mt-0.5">{risk}</h4>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-white/10">
                                                    <ShieldAlert size={26} />
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Stat: Crops */}
                                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] text-slate-400 uppercase font-semibold">Crops</span>
                                            <span className="text-base">🌾</span>
                                        </div>
                                        <p className="text-2xl font-black text-emerald-400">{extractorResult.metrics?.total_crops || 0}</p>
                                    </div>

                                    {/* Stat: Pests */}
                                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] text-slate-400 uppercase font-semibold">Pests</span>
                                            <span className="text-base">🐛</span>
                                        </div>
                                        <p className="text-2xl font-black text-rose-400">{extractorResult.metrics?.total_pests || 0}</p>
                                    </div>

                                    {/* Stat: Diseases */}
                                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] text-slate-400 uppercase font-semibold">Pathogens</span>
                                            <span className="text-base">🦠</span>
                                        </div>
                                        <p className="text-2xl font-black text-purple-400">{extractorResult.metrics?.total_diseases || 0}</p>
                                    </div>

                                    {/* Stat: Symptoms */}
                                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] text-slate-400 uppercase font-semibold">Symptoms</span>
                                            <span className="text-base">⚠️</span>
                                        </div>
                                        <p className="text-2xl font-black text-amber-400">{extractorResult.metrics?.total_symptoms || 0}</p>
                                    </div>
                                </div>

                                {/* 2. Sub-Tab View Switcher */}
                                <div className="flex p-1 space-x-1.5 bg-slate-900/70 border border-white/5 rounded-xl overflow-x-auto">
                                    {[
                                        { id: 'annotated', label: 'Annotated Text', icon: Sparkles, count: extractorResult.highlighted_spans?.length },
                                        { id: 'entities', label: 'Extracted Entities', icon: Tag, count: (extractorResult.crops?.length || 0) + (extractorResult.pests?.length || 0) + (extractorResult.diseases?.length || 0) + (extractorResult.symptoms?.length || 0) },
                                        { id: 'ipm', label: '4-Pillar IPM Protocols', icon: ShieldCheck, count: extractorResult.ipm_recommendations?.length },
                                        { id: 'matrix', label: 'Host Vulnerability Matrix', icon: Layers, count: extractorResult.associations?.length }
                                    ].map(tab => {
                                        const Icon = tab.icon;
                                        const isCurrent = extractorView === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setExtractorView(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                                    isCurrent
                                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                                                }`}
                                            >
                                                <Icon size={15} />
                                                <span>{tab.label}</span>
                                                {tab.count !== undefined && (
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isCurrent ? 'bg-rose-500/30 text-rose-200' : 'bg-slate-800 text-slate-400'}`}>
                                                        {tab.count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 3. Sub-View Contents */}
                                <AnimatePresence mode="wait">
                                    {/* View A: Annotated Text */}
                                    {extractorView === 'annotated' && (
                                        <motion.div
                                            key="annotated"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                                                <div>
                                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                        <Sparkles size={16} className="text-rose-400" />
                                                        Visual Entity Span Highlighting
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        Natural language tokens matched with agricultural ontology and taxonomic classes
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🌾 Crop</span>
                                                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">🐛 Pest</span>
                                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">🦠 Pathogen</span>
                                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠️ Symptom</span>
                                                </div>
                                            </div>

                                            <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-700/60 leading-relaxed font-mono">
                                                {renderAnnotatedText(extractorResult.query_text, extractorResult.highlighted_spans)}
                                            </div>

                                            <p className="text-xs text-slate-400 italic">
                                                Tip: Hover over any highlighted badge in the passage to inspect the classified taxonomic label.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* View B: Extracted Entities */}
                                    {extractorView === 'entities' && (
                                        <motion.div
                                            key="entities"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="space-y-4"
                                        >
                                            {/* Filter Chips */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {[
                                                    { id: 'all', label: 'All Entities', count: (extractorResult.crops?.length || 0) + (extractorResult.pests?.length || 0) + (extractorResult.diseases?.length || 0) + (extractorResult.symptoms?.length || 0) },
                                                    { id: 'crops', label: '🌾 Crops', count: extractorResult.crops?.length || 0 },
                                                    { id: 'pests', label: '🐛 Pests', count: extractorResult.pests?.length || 0 },
                                                    { id: 'diseases', label: '🦠 Pathogens', count: extractorResult.diseases?.length || 0 },
                                                    { id: 'symptoms', label: '⚠️ Symptoms', count: extractorResult.symptoms?.length || 0 }
                                                ].map(f => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => setExtractorFilter(f.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                            extractorFilter === f.id
                                                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-white/5'
                                                        }`}
                                                    >
                                                        {f.label} ({f.count})
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Entity Cards Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {/* Crops */}
                                                {(extractorFilter === 'all' || extractorFilter === 'crops') &&
                                                    extractorResult.crops?.map((c, idx) => (
                                                        <div key={`crop-${idx}`} className="p-4 rounded-xl bg-slate-800/50 border border-emerald-500/20 hover:border-emerald-500/40 transition space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                                                                    🌾 Crop Entity
                                                                </span>
                                                                <span className="text-[11px] font-mono text-slate-400">
                                                                    {c.mentions_count} mention{c.mentions_count > 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-bold text-white">{c.name}</h4>
                                                                <p className="text-xs text-slate-400 italic font-serif">{c.scientific_name}</p>
                                                            </div>
                                                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                                                                <span>Category: <span className="text-slate-200 font-semibold">{c.category}</span></span>
                                                                <span className="font-mono text-[11px] text-emerald-400">"{c.matched_tokens?.join(', ')}"</span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                {/* Pests */}
                                                {(extractorFilter === 'all' || extractorFilter === 'pests') &&
                                                    extractorResult.pests?.map((p, idx) => {
                                                        const sev = (p.severity || '').toLowerCase();
                                                        const sevColor = sev.includes('crit')
                                                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                                            : sev.includes('high')
                                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                                                        return (
                                                            <div key={`pest-${idx}`} className="p-4 rounded-xl bg-slate-800/50 border border-rose-500/20 hover:border-rose-500/40 transition space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-semibold">
                                                                        🐛 Destructive Pest
                                                                    </span>
                                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${sevColor}`}>
                                                                        {p.severity}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-base font-bold text-white">{p.name}</h4>
                                                                    <p className="text-xs text-slate-400 italic font-serif">{p.scientific_name}</p>
                                                                </div>
                                                                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                                                    {p.damage_description}
                                                                </p>
                                                                <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span>Type: <span className="text-slate-200">{p.pest_type}</span></span>
                                                                        <span className="font-mono text-rose-400">"{p.matched_tokens?.join(', ')}"</span>
                                                                    </div>
                                                                    {p.susceptible_crops?.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            <span className="text-[10px] text-slate-500">Hosts:</span>
                                                                            {p.susceptible_crops.slice(0, 4).map((sc, i) => (
                                                                                <span key={i} className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                                                                                    {sc}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                {/* Diseases */}
                                                {(extractorFilter === 'all' || extractorFilter === 'diseases') &&
                                                    extractorResult.diseases?.map((d, idx) => (
                                                        <div key={`dis-${idx}`} className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20 hover:border-purple-500/40 transition space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-semibold">
                                                                    🦠 Plant Pathogen
                                                                </span>
                                                                <span className="text-[11px] font-mono text-slate-400">
                                                                    {d.mentions_count} mention{d.mentions_count > 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-bold text-white">{d.name}</h4>
                                                                <p className="text-xs text-slate-400 italic font-serif">{d.scientific_name}</p>
                                                            </div>
                                                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                                                                <span>Pathogen: <span className="text-slate-200 font-semibold">{d.disease_type}</span></span>
                                                                <span className="font-mono text-[11px] text-purple-400">"{d.matched_tokens?.join(', ')}"</span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                {/* Symptoms */}
                                                {(extractorFilter === 'all' || extractorFilter === 'symptoms') &&
                                                    extractorResult.symptoms?.map((s, idx) => (
                                                        <div key={`sym-${idx}`} className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/20 hover:border-amber-500/40 transition space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                                                                    ⚠️ Damage Symptom
                                                                </span>
                                                                <span className="text-[11px] font-mono text-slate-400">
                                                                    {s.mentions_count} detected
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-bold text-white">{s.name}</h4>
                                                            </div>
                                                            <div className="pt-2 border-t border-white/5 text-xs text-slate-400">
                                                                <span>Matched Clues: <span className="font-mono text-amber-400">{s.matched_tokens?.join(', ')}</span></span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* View C: 4-Pillar IPM Protocols */}
                                    {extractorView === 'ipm' && (
                                        <motion.div
                                            key="ipm"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="space-y-4"
                                        >
                                            {(!extractorResult.ipm_recommendations || extractorResult.ipm_recommendations.length === 0) ? (
                                                <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-white/5">
                                                    No specific pest or disease threat identified to warrant chemical/biological intervention.
                                                </div>
                                            ) : (
                                                extractorResult.ipm_recommendations.map((ipm, idx) => (
                                                    <div key={idx} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                                                                    <ShieldCheck size={20} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-base font-bold text-white">{ipm.target}</h3>
                                                                    <p className="text-xs text-slate-400">Multi-stage Integrated Pest Management Directive</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold self-start sm:self-auto">
                                                                Threat Level: {ipm.threat_level}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Pillar 1: Cultural */}
                                                            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-2">
                                                                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                                                                    <span>🚜</span>
                                                                    <span>1. Cultural & Mechanical Sanitation</span>
                                                                </div>
                                                                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                                                    {ipm.cultural}
                                                                </p>
                                                            </div>

                                                            {/* Pillar 2: Biological */}
                                                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                                                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                                                    <span>🐞</span>
                                                                    <span>2. Biological & Conservation Controls</span>
                                                                </div>
                                                                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                                                    {ipm.biological}
                                                                </p>
                                                            </div>

                                                            {/* Pillar 3: Botanical */}
                                                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                                                                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                                                    <span>🌿</span>
                                                                    <span>3. Botanical & Organic Formulations</span>
                                                                </div>
                                                                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                                                    {ipm.botanical}
                                                                </p>
                                                            </div>

                                                            {/* Pillar 4: Precision Chemical */}
                                                            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                                                                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                                                                    <span>🧪</span>
                                                                    <span>4. Targeted Chemical Intervention</span>
                                                                </div>
                                                                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                                                    {ipm.chemical}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </motion.div>
                                    )}

                                    {/* View D: Host Vulnerability Matrix */}
                                    {extractorView === 'matrix' && (
                                        <motion.div
                                            key="matrix"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="space-y-4"
                                        >
                                            {(!extractorResult.associations || extractorResult.associations.length === 0) ? (
                                                <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-white/5">
                                                    No cross-entity pest-to-crop attacks identified among detected entities in this passage.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {extractorResult.associations.map((assoc, idx) => (
                                                        <div key={idx} className="p-5 rounded-2xl bg-slate-800/50 border border-white/10 hover:border-rose-500/30 transition space-y-3">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                                    <span className="text-rose-400">🐛 {assoc.pest_name}</span>
                                                                    <ChevronRight size={14} className="text-slate-500" />
                                                                    <span className="text-emerald-400">🌾 {assoc.crop_name}</span>
                                                                </div>
                                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                                    {assoc.threat_level}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                                {assoc.interaction_note}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 1. AI AGRONOMIST CHAT / DIAGNOSIS */}
                {activeTab === 'advisory' && (
                    <motion.div
                        key="advisory"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        {/* Input Panel */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                        <Bot size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Crop Issue Diagnostic</h2>
                                        <p className="text-xs text-slate-400">Describe crop symptoms or pest behavior</p>
                                    </div>
                                </div>

                                <form onSubmit={(e) => handleAdvisorySubmit(e)} className="space-y-4">
                                    <textarea
                                        value={advisoryQuery}
                                        onChange={(e) => setAdvisoryQuery(e.target.value)}
                                        rows={4}
                                        placeholder="E.g., Paddy leaf blast disease with brown spots and dying tips..."
                                        className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 resize-none transition"
                                    />

                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 mb-2 block flex items-center gap-1.5">
                                            <Sparkles size={13} className="text-emerald-400" />
                                            Quick Test Scenarios:
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {SAMPLE_PROMPTS.advisory.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setAdvisoryQuery(prompt);
                                                        handleAdvisorySubmit(null, prompt);
                                                    }}
                                                    className="text-xs px-2.5 py-1.5 bg-slate-900/60 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 border border-slate-700/50 hover:border-emerald-500/30 rounded-lg text-left transition"
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={advisoryLoading || !advisoryQuery.trim()}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
                                        >
                                            {advisoryLoading ? (
                                                <>
                                                    <Activity size={18} className="animate-spin" />
                                                    Diagnosing Symptoms...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={18} />
                                                    Run AI Diagnosis
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Result Output Panel */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-emerald-400" />
                                        Agronomist Recommendations
                                    </h3>
                                    {advisoryResult && (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Category: {advisoryResult.predicted_category || 'Identified'}
                                        </span>
                                    )}
                                </div>

                                {advisoryError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-2.5">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <p>{advisoryError}</p>
                                    </div>
                                )}

                                {!advisoryResult && !advisoryLoading && !advisoryError && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                                        <Bot size={44} className="mb-3 opacity-30 text-emerald-400" />
                                        <p className="text-sm font-medium text-slate-400">No diagnosis performed yet</p>
                                        <p className="text-xs text-slate-500 max-w-xs mt-1">
                                            Type crop symptoms or click one of the quick test scenarios on the left to receive AI diagnosis and action steps.
                                        </p>
                                    </div>
                                )}

                                {advisoryLoading && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-3"></div>
                                        <p className="text-sm font-semibold text-emerald-300">Evaluating Agro-Taxonomy...</p>
                                        <p className="text-xs text-slate-500 mt-1">Matching pathogens, symptoms, and cures</p>
                                    </div>
                                )}

                                {advisoryResult && !advisoryLoading && (
                                    <div className="space-y-4">
                                        {/* Query echo */}
                                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Analyzed Query</p>
                                            <p className="text-sm text-slate-200 italic font-mono">"{advisoryResult.query}"</p>
                                        </div>

                                        {/* Actionable recommendation */}
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles size={14} /> Recommended Treatment & Action
                                            </p>
                                            <p className="text-sm text-emerald-100 leading-relaxed font-medium">
                                                {advisoryResult.recommended_action || "Apply targeted organic or chemical interventions suited to local agro-climatic conditions."}
                                            </p>
                                        </div>

                                        {/* Extracted Entities */}
                                        {advisoryResult.entities && advisoryResult.entities.length > 0 && (
                                            <div>
                                                <p className="text-xs text-slate-400 font-semibold mb-2">Detected Agro-Entities:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {advisoryResult.entities.map((ent, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 flex items-center gap-1.5"
                                                        >
                                                            <Tag size={11} className="text-emerald-400" />
                                                            <span className="text-emerald-400 font-semibold">{ent.type}:</span>
                                                            <span>{ent.value}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {advisoryResult && !advisoryLoading && (
                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAdvisoryResult(null);
                                            setAdvisoryQuery('');
                                        }}
                                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
                                    >
                                        <RotateCcw size={13} />
                                        Clear Diagnosis
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 2. AGRI-MARKET SENTIMENT ANALYZER */}
                {activeTab === 'sentiment' && (
                    <motion.div
                        key="sentiment"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        {/* Input Panel */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                                        <TrendingUp size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Agri-Market Sentiment</h2>
                                        <p className="text-xs text-slate-400">Classify news, trade sentiment, and price movements</p>
                                    </div>
                                </div>

                                <form onSubmit={(e) => handleSentimentSubmit(e)} className="space-y-4">
                                    <textarea
                                        value={sentimentQuery}
                                        onChange={(e) => setSentimentQuery(e.target.value)}
                                        rows={4}
                                        placeholder="Paste agricultural news, mandi report, or commodity export headline..."
                                        className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 resize-none transition"
                                    />

                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 mb-2 block flex items-center gap-1.5">
                                            <Sparkles size={13} className="text-cyan-400" />
                                            Sample Agricultural Headlines:
                                        </label>
                                        <div className="space-y-1.5">
                                            {SAMPLE_PROMPTS.sentiment.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setSentimentQuery(prompt);
                                                        handleSentimentSubmit(null, prompt);
                                                    }}
                                                    className="w-full text-xs px-3 py-2 bg-slate-900/60 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg text-left transition flex items-center justify-between group"
                                                >
                                                    <span className="truncate">{prompt}</span>
                                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-cyan-400 shrink-0 transition" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={sentimentLoading || !sentimentQuery.trim()}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition"
                                        >
                                            {sentimentLoading ? (
                                                <>
                                                    <Activity size={18} className="animate-spin" />
                                                    Evaluating Sentiment...
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingUp size={18} />
                                                    Analyze Market Sentiment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Sentiment Result Output */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <TrendingUp size={18} className="text-cyan-400" />
                                        Sentiment Breakdown
                                    </h3>
                                    <span className="text-xs text-slate-500 font-mono">Model: NaiveBayes / SVM</span>
                                </div>

                                {sentimentError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-2.5">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <p>{sentimentError}</p>
                                    </div>
                                )}

                                {!sentimentResult && !sentimentLoading && !sentimentError && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                                        <TrendingUp size={44} className="mb-3 opacity-30 text-cyan-400" />
                                        <p className="text-sm font-medium text-slate-400">No news analyzed yet</p>
                                        <p className="text-xs text-slate-500 max-w-xs mt-1">
                                            Enter an agricultural market headline or choose one of the sample news items to classify sentiment.
                                        </p>
                                    </div>
                                )}

                                {sentimentLoading && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3"></div>
                                        <p className="text-sm font-semibold text-cyan-300">Calculating Sentiment Polarity...</p>
                                        <p className="text-xs text-slate-500 mt-1">Parsing market signals & sentiment tone</p>
                                    </div>
                                )}

                                {sentimentResult && !sentimentLoading && (
                                    <div className="space-y-5">
                                        {/* Sentiment Badge Card */}
                                        {(() => {
                                            const sent = (sentimentResult.predicted_sentiment || '').toLowerCase();
                                            const isPos = sent.includes('positive') || sent.includes('bullish');
                                            const isNeg = sent.includes('negative') || sent.includes('bearish');

                                            const color = isPos
                                                ? { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', icon: ArrowUpRight, label: 'Positive / Bullish' }
                                                : isNeg
                                                ? { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300', icon: ArrowDownRight, label: 'Negative / Bearish' }
                                                : { bg: 'bg-slate-700/30', border: 'border-slate-600/30', text: 'text-slate-300', badge: 'bg-slate-600/20 text-slate-300', icon: Minus, label: 'Neutral / Steady' };

                                            const IconComp = color.icon;

                                            return (
                                                <div className={`p-6 rounded-2xl border ${color.bg} ${color.border} text-center space-y-3`}>
                                                    <div className="inline-flex p-3 rounded-full bg-slate-900/60 border border-white/10">
                                                        <IconComp size={32} className={color.text} />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Classified Market Sentiment</span>
                                                        <h4 className={`text-2xl font-extrabold ${color.text} mt-1`}>
                                                            {color.label}
                                                        </h4>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Headline echo */}
                                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Analyzed News Headline</p>
                                            <p className="text-sm text-slate-200 font-medium">"{sentimentResult.news_text}"</p>
                                        </div>

                                        {/* Market Insight Tip */}
                                        <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-start gap-2.5">
                                            <Sparkles size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-cyan-200 leading-relaxed">
                                                Farmers and mandi traders can leverage this sentiment to forecast short-term supply chain adjustments and commodity pricing pressure.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {sentimentResult && !sentimentLoading && (
                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSentimentResult(null);
                                            setSentimentQuery('');
                                        }}
                                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
                                    >
                                        <RotateCcw size={13} />
                                        Clear Analysis
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 3. AGRI-REPORT SUMMARIZER */}
                {activeTab === 'summary' && (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        {/* Input Panel */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                                        <FileText size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Agri-Report Summarizer</h2>
                                        <p className="text-xs text-slate-400">Condense long articles and extension bulletins</p>
                                    </div>
                                </div>

                                <form onSubmit={(e) => handleSummarySubmit(e)} className="space-y-4">
                                    <textarea
                                        value={summaryQuery}
                                        onChange={(e) => setSummaryQuery(e.target.value)}
                                        rows={6}
                                        placeholder="Paste lengthy agricultural research paper, report, or government policy document..."
                                        className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 resize-none transition"
                                    />

                                    {/* Sentence count slider */}
                                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sliders size={16} className="text-amber-400" />
                                            <span className="text-xs font-semibold text-slate-300">Target Summary Length:</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={summaryCount}
                                                onChange={(e) => setSummaryCount(Number(e.target.value))}
                                                className="w-24 accent-amber-400 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold text-amber-400 w-16 text-right">
                                                {summaryCount} {summaryCount === 1 ? 'Sentence' : 'Sentences'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSummaryQuery(SAMPLE_PROMPTS.summary[0]);
                                                handleSummarySubmit(null, SAMPLE_PROMPTS.summary[0]);
                                            }}
                                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition underline-offset-2 hover:underline"
                                        >
                                            <Sparkles size={12} />
                                            Insert Sample Tamil Nadu Irrigation Report
                                        </button>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={summaryLoading || !summaryQuery.trim()}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
                                        >
                                            {summaryLoading ? (
                                                <>
                                                    <Activity size={18} className="animate-spin" />
                                                    Summarizing Text...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText size={18} />
                                                    Generate Executive Summary
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Summary Result Output */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <FileText size={18} className="text-amber-400" />
                                        Key Takeaways
                                    </h3>
                                    {summaryResult && (
                                        <button
                                            onClick={handleCopySummary}
                                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition"
                                        >
                                            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    )}
                                </div>

                                {summaryError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-2.5">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <p>{summaryError}</p>
                                    </div>
                                )}

                                {!summaryResult && !summaryLoading && !summaryError && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                                        <FileText size={44} className="mb-3 opacity-30 text-amber-400" />
                                        <p className="text-sm font-medium text-slate-400">No document summarized yet</p>
                                        <p className="text-xs text-slate-500 max-w-xs mt-1">
                                            Paste an agricultural bulletin or click "Insert Sample Report" on the left to extract the core points.
                                        </p>
                                    </div>
                                )}

                                {summaryLoading && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mb-3"></div>
                                        <p className="text-sm font-semibold text-amber-300">Extracting Salient Insights...</p>
                                        <p className="text-xs text-slate-500 mt-1">Ranking key sentences using text graph algorithms</p>
                                    </div>
                                )}

                                {summaryResult && !summaryLoading && (
                                    <div className="space-y-4">
                                        {/* Compression metrics */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                                                <span className="text-xs text-slate-500">Original Sentences</span>
                                                <p className="text-lg font-bold text-slate-200 mt-0.5">
                                                    {summaryResult.original_sentences_count || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                                <span className="text-xs text-amber-400">Summary Sentences</span>
                                                <p className="text-lg font-bold text-amber-300 mt-0.5">
                                                    {summaryResult.summary_sentences_count || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Summary text content */}
                                        <div className="p-5 bg-slate-900/80 rounded-xl border border-amber-500/20 space-y-3">
                                            <p className="text-xs uppercase tracking-wider font-bold text-amber-400">Extracted Summary</p>
                                            <div className="text-sm text-slate-100 leading-relaxed space-y-2">
                                                {summaryResult.summary.split('. ').map((s, i) => s.trim() && (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                                                        <p>{s.endsWith('.') ? s : `${s}.`}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {summaryResult && !summaryLoading && (
                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSummaryResult(null);
                                            setSummaryQuery('');
                                        }}
                                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
                                    >
                                        <RotateCcw size={13} />
                                        Clear Summary
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 4. FARMER QUERY SEARCH (SIMILAR QUERIES) */}
                {activeTab === 'similar' && (
                    <motion.div
                        key="similar"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        {/* Input Panel */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                        <Search size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Farmer Query Search</h2>
                                        <p className="text-xs text-slate-400">Search past solved farmer issues by semantic meaning</p>
                                    </div>
                                </div>

                                <form onSubmit={(e) => handleSimilarSubmit(e)} className="space-y-4">
                                    <textarea
                                        value={similarQuery}
                                        onChange={(e) => setSimilarQuery(e.target.value)}
                                        rows={4}
                                        placeholder="E.g., Yellow leaves with brown spots on tomato plant..."
                                        className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 resize-none transition"
                                    />

                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 mb-2 block flex items-center gap-1.5">
                                            <Sparkles size={13} className="text-indigo-400" />
                                            Example Search Queries:
                                        </label>
                                        <div className="space-y-1.5">
                                            {SAMPLE_PROMPTS.similar.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setSimilarQuery(prompt);
                                                        handleSimilarSubmit(null, prompt);
                                                    }}
                                                    className="w-full text-xs px-3 py-2 bg-slate-900/60 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-300 border border-slate-700/50 hover:border-indigo-500/30 rounded-lg text-left transition flex items-center justify-between group"
                                                >
                                                    <span className="truncate">{prompt}</span>
                                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-indigo-400 shrink-0 transition" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={similarLoading || !similarQuery.trim()}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition"
                                        >
                                            {similarLoading ? (
                                                <>
                                                    <Activity size={18} className="animate-spin" />
                                                    Searching Database...
                                                </>
                                            ) : (
                                                <>
                                                    <Search size={18} />
                                                    Find Matching Farmer Solutions
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Search Result Output */}
                        <div className="lg:col-span-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Search size={18} className="text-indigo-400" />
                                        Closest Past Queries
                                    </h3>
                                    {similarResult?.similar_queries && (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                            {similarResult.similar_queries.length} Matches Found
                                        </span>
                                    )}
                                </div>

                                {similarError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-2.5">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <p>{similarError}</p>
                                    </div>
                                )}

                                {!similarResult && !similarLoading && !similarError && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                                        <Search size={44} className="mb-3 opacity-30 text-indigo-400" />
                                        <p className="text-sm font-medium text-slate-400">No searches executed yet</p>
                                        <p className="text-xs text-slate-500 max-w-xs mt-1">
                                            Type an issue query or choose an example on the left to locate similar farmer cases stored in the database.
                                        </p>
                                    </div>
                                )}

                                {similarLoading && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin mb-3"></div>
                                        <p className="text-sm font-semibold text-indigo-300">Searching Farmer Query Corpus...</p>
                                        <p className="text-xs text-slate-500 mt-1">Calculating cosine similarities across embeddings</p>
                                    </div>
                                )}

                                {similarResult?.similar_queries && !similarLoading && (
                                    <div className="space-y-3">
                                        {similarResult.similar_queries.length === 0 ? (
                                            <p className="text-sm text-slate-400 py-6 text-center">No matching queries found above threshold.</p>
                                        ) : (
                                            similarResult.similar_queries.map((item, idx) => {
                                                const score = Number(item.similarity_score || 0);
                                                const scoreColor =
                                                    score >= 60 ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' :
                                                    score >= 40 ? 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' :
                                                    'text-slate-300 bg-slate-700/30 border-slate-600/30';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="p-3.5 bg-slate-900/70 border border-slate-700/60 rounded-xl space-y-2 hover:border-indigo-500/40 transition"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs text-slate-500 font-semibold">Match #{idx + 1}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${scoreColor}`}>
                                                                {score.toFixed(1)}% Match
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-200 font-medium">
                                                            "{item.query}"
                                                        </p>
                                                        {/* Progress bar visual */}
                                                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full"
                                                                style={{ width: `${Math.min(score, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>

                            {similarResult && !similarLoading && (
                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSimilarResult(null);
                                            setSimilarQuery('');
                                        }}
                                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
                                    >
                                        <RotateCcw size={13} />
                                        Clear Search
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AIIntelligencePage;
