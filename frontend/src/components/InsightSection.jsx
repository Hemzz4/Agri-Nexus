
// Helper Component for Insight Sections
const InsightSection = ({ title, items, color }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-2">
            <h4 className={`font-bold text-sm ${color} mb-1 uppercase tracking-wider`}>{title}</h4>
            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                {items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                ))}
            </ul>
        </div>
    );
};
