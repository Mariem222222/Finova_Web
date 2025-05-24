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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 py-10 px-2 md:px-0 flex flex-col items-center">
            <div className="w-full max-w-4xl mx-auto shadow-2xl rounded-2xl bg-white/80 p-4 md:p-8">
                {/* Motivational Banner */}
                <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-200 via-purple-100 to-blue-100 p-5 flex items-center gap-4 shadow animate-fade-in">
                    <svg xmlns='http://www.w3.org/2000/svg' className='inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='40' height='40'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' /></svg>
                    <span className="text-lg md:text-xl font-semibold text-blue-800">Your financial journey is unique. Here are some personalized tips to help you grow!</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-blue-800 flex items-center gap-3 animate-fade-in">
                    <svg xmlns='http://www.w3.org/2000/svg' className='inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='36' height='36'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' /></svg>
                    Personalized Financial Recommendations
                </h1>
                <button
                    onClick={fetchRecommendations}
                    className="mb-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow hover:from-blue-600 hover:to-purple-600 transition flex items-center gap-2 animate-fade-in"
                >
                    <svg xmlns='http://www.w3.org/2000/svg' className='inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='20' height='20'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582M20 20v-5h-.581M5 19A9 9 0 1119 5' /></svg>
                    Refresh Recommendations
                </button>
                {loading && (
                    <div className="flex items-center justify-center py-8 animate-fade-in">
                        <span className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                        <span className="ml-2 text-blue-600">Loading recommendations...</span>
                    </div>
                )}
                {error && <div className="text-red-600 py-4 animate-fade-in">{error}</div>}
                {recommendations && (
                    <div className="flex flex-col gap-8">
                        {recommendations.cards && recommendations.cards.length > 0 ? (
                            recommendations.cards.map((rec, idx) => {
                                // Pick a color/icon for each card for variety
                                const cardColors = [
                                    'from-blue-100 to-green-100',
                                    'from-purple-100 to-pink-100',
                                    'from-yellow-100 to-orange-100',
                                    'from-indigo-100 to-blue-100',
                                    'from-green-100 to-teal-100',
                                ];
                                const icons = [
                                    <svg key="1" className="text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="currentColor" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>,
                                    <svg key="2" className="text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="currentColor" d="M12 8c-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.657-1.343-3-3-3z" /></svg>,
                                    <svg key="3" className="text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="currentColor" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z" /></svg>,
                                    <svg key="4" className="text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="currentColor" d="M9 17v-2a4 4 0 018 0v2" /></svg>,
                                    <svg key="5" className="text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="currentColor" d="M12 8v4l3 3" /></svg>,
                                ];
                                const color = cardColors[idx % cardColors.length];
                                const icon = icons[idx % icons.length];
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.12 }}
                                        className={`bg-gradient-to-br ${color} rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow border border-blue-100 animate-fade-in`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            {icon}
                                            <h2 className="text-xl md:text-2xl font-bold text-blue-700">{rec.title}</h2>
                                        </div>
                                        <p className="text-gray-700 mb-4 text-lg">{rec.detail}</p>
                                        {rec.actionItems && rec.actionItems.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="text-sm font-semibold text-purple-700 mb-2">Action Items:</h3>
                                                <ul className="list-disc list-inside space-y-2">
                                                    {rec.actionItems.map((action, actionIdx) => (
                                                        <li key={actionIdx} className="text-gray-700 text-base">{action}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="bg-gradient-to-br from-red-100 to-yellow-100 rounded-2xl shadow p-8 text-gray-700 flex flex-col items-center animate-fade-in">
                                <svg xmlns='http://www.w3.org/2000/svg' className='mb-2' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='40' height='40'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' /></svg>
                                <span className="font-semibold text-lg">No recommendations found. Try refreshing the page.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                .animate-fade-in {
                  animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}