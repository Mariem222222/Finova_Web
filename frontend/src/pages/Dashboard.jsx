import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Home, LogOut, Menu, X } from "lucide-react";
import Charts from "@/widgets/cards/Charts";
import { useFinance } from "@/data/FinanceContext";
import axios from "axios";
import { Progress } from "@material-tailwind/react";

export default function Dashboard() {
  const { transactions } = useFinance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [motivation, setMotivation] = useState("");

  const calculateStats = () => {
    const stats = {
      savings: 0,
      income: 0,
      expenses: 0
    };

    if (Array.isArray(transactions)) {
      transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount) || 0;

        switch (transaction.type) {
          case "income":
            stats.income += amount;
            break;
          case "expense":
            stats.expenses += amount;
            break;
          case "savings":
            stats.savings += amount;
            break;
        }
      });

      if (stats.savings === 0) {
        stats.savings = stats.income - stats.expenses;
      }
    }

    return stats;
  };

  const stats = calculateStats();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/transactions/sales/monthly", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        setSalesData(res.data);
      } catch (err) {
        setSalesData([]); // fallback
      }
    };
    fetchSales();

    // Fetch savings goals
    const fetchGoals = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/savings-goals", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        setGoals(res.data);
      } catch (err) {
        setGoals([]);
      }
    };
    fetchGoals();

    // Motivational tips
    const tips = [
      "A penny saved is a penny earned!",
      "Track your spending to reach your goals faster.",
      "Small savings today, big rewards tomorrow.",
      "Consistency is the key to financial success.",
      "Review your goals regularly and adjust as needed."
    ];
    setMotivation(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  // const handleLogout = () => {
  //   localStorage.removeItem('transactions');
  //   localStorage.removeItem('user');
  //   window.location.href = '/login';
  // };

  const navigateToHome = () => {
    window.location.href = '/';
  };

  // Calculate revenue insights
  const totalRevenue = salesData.reduce((sum, item) => sum + (item.total || 0), 0);
  const bestMonth = salesData.reduce((best, item) => (item.total > (best?.total || 0) ? item : best), null);

  // Find active goals and top-priority goal
  const activeGoals = goals.filter(g => g.status === 'pending');
  const topGoal = activeGoals.sort((a, b) => a.priority - b.priority)[0];
  const topGoalProgress = topGoal ? Math.min(100, (topGoal.currentAmount / topGoal.targetAmount) * 100) : 0;

  // Recent transactions
  const recentTx = [...transactions].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 5);

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-white to-purple-100 min-h-screen overflow-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 flex items-center gap-2">Dashboard <Home className="inline-block" size={28} /></h1>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
          <div className="text-blue-600 text-3xl mb-2">💰</div>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-1">${stats.savings.toFixed(2)}</h2>
          <p className="text-blue-800 font-medium">Savings</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
          <div className="text-purple-600 text-3xl mb-2">📈</div>
          <h2 className="text-3xl font-extrabold text-purple-900 mb-1">${stats.income.toFixed(2)}</h2>
          <p className="text-purple-800 font-medium">Income</p>
        </div>
        <div className="bg-blue-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
          <div className="text-blue-400 text-3xl mb-2">📉</div>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-1">${stats.expenses.toFixed(2)}</h2>
          <p className="text-blue-800 font-medium">Expenses</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
          <div className="text-purple-400 text-3xl mb-2">📄</div>
          <h2 className="text-3xl font-extrabold text-purple-900 mb-1">{transactions.length}</h2>
          <p className="text-purple-800 font-medium">Transactions</p>
        </div>
        <div className="bg-blue-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
          <div className="text-blue-600 text-3xl mb-2">🎯</div>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-1">{activeGoals.length}</h2>
          <p className="text-blue-800 font-medium">Active Goals</p>
        </div>
      </div>

      {/* Top Goal Progress */}
      {topGoal && (
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-2 text-purple-700">Top Priority Goal: {topGoal.name}</h2>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-blue-700">Progress:</span>
            <Progress value={topGoalProgress} color="purple" className="w-1/2 h-4 rounded-full bg-purple-100" />
            <span className="text-sm text-purple-700 font-semibold">{topGoalProgress.toFixed(1)}%</span>
          </div>
          <div className="mt-2 text-gray-500 text-sm">
            {topGoal.currentAmount} / {topGoal.targetAmount} saved
          </div>
        </div>
      )}

      {/* Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Revenue Insights */}
        <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
            <span role="img" aria-label="insight">💡</span> Revenue Insights
          </h2>
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-blue-600 text-2xl font-bold">${totalRevenue.toLocaleString()}</h3>
              <p className="text-gray-500">Total Revenue (12 months)</p>
            </div>
            <div>
              <h3 className="text-purple-600 text-2xl font-bold">{bestMonth ? bestMonth.name : '--'}</h3>
              <p className="text-gray-500">Best Month</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={3} dot={{ r: 5, stroke: '#6366F1', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-blue-700">
            <span role="img" aria-label="info">ℹ️</span> This chart shows your income trends over the past year. Use these insights to plan your business growth!
          </div>
        </div>

        {/* Monthly Invoice Statistics */}
        <div className="bg-white p-6 rounded-2xl shadow-lg col-span-2">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Financial Overview</h2>
          <div className="h-64">
            <Charts />
          </div>
        </div>
      </div>

      {/* Motivational Tip */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-100 to-purple-200 rounded-2xl text-center text-lg font-semibold text-blue-800 shadow-lg">
        {motivation}
      </div>
    </div>
  );
}