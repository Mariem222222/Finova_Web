import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get('http://localhost:5000/api/recommendations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecommendations(res.data);
        } catch (err) {
            setError('Failed to fetch recommendations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Personalized Financial Recommendations</h1>
            <button
                onClick={fetchRecommendations}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
            >
                Refresh Recommendations
            </button>
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <span className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                    <span className="ml-2 text-blue-600">Loading recommendations...</span>
                </div>
            )}
            {error && <div className="text-red-600 py-4">{error}</div>}
            {recommendations && (
                <div className="space-y-6">
                    {recommendations.cards && recommendations.cards.length > 0 ? (
                        recommendations.cards.map((rec, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                            >
                                <h2 className="text-xl font-semibold mb-3 text-blue-800">{rec.title}</h2>
                                <p className="text-gray-700 mb-4">{rec.detail}</p>
                                {rec.actionItems && rec.actionItems.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Action Items:</h3>
                                        <ul className="list-disc list-inside space-y-2">
                                            {rec.actionItems.map((action, actionIdx) => (
                                                <li key={actionIdx} className="text-gray-600">{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow p-6 text-gray-700">
                            No recommendations found. Try refreshing the page.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 