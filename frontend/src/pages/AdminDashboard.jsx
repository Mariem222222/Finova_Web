import React, { useState, useEffect } from "react";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios"; // Import axios for API calls
import { useFinance } from "@/data/FinanceContext";
import { User, Users, TrendingUp, DollarSign, Flag, Download, CheckCircle, Ban, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    averageTransactionAmount: 0,
    monthlyGrowthRate: 0,
    topCategories: [],
    userRetentionRate: 0
  });
  const [userGrowth, setUserGrowth] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [recentSignups, setRecentSignups] = useState([]);
  const [mostActive, setMostActive] = useState([]);
  const [users, setUsers] = useState([]);
  const [motivation, setMotivation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    // Filter transactions based on type
    const filtered = transactions.filter(tx =>
      filterType === 'all' || tx.type === filterType
    );
    setFilteredTransactions(filtered);
  }, [transactions, filterType]);

  const exportTransactions = () => {
    const headers = ['User', 'Type', 'Amount', 'Category', 'Date', 'Status'];
    let csvContent = headers.join(',') + '\n';

    filteredTransactions.forEach(tx => {
      const row = [
        `"${tx.userName || 'Unknown'}"`,
        tx.type,
        tx.amount,
        `"${tx.category}"`,
        new Date(tx.dateTime).toLocaleDateString(),
        tx.status || 'completed'
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Fetch all admin stats and data
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        // Users
        const usersRes = await axios.get("http://localhost:5000/api/users", { headers: { Authorization: `Bearer ${token}` } });
        const usersData = usersRes.data;
        setUsers(usersData);
        setStats(s => ({          ...s,
          totalUsers: usersData.length,
          activeUsers: usersData.filter(u => u.status === 'active').length,
          blockedUsers: usersData.filter(u => u.status === 'blocked').length,
          flaggedUsers: usersData.filter(u => u.flags && u.flags.length > 0).length,
        }));
        // Recent signups
        setRecentSignups([...usersData].sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate)).slice(0, 5));
        // Most active users (by transactionCount)
        setMostActive([...usersData].sort((a, b) => (b.transactionCount || 0) - (a.transactionCount || 0)).slice(0, 5));
        // User growth chart (by month)
        const growthByMonth = {};
        usersData.forEach(u => {
          const d = new Date(u.joinDate);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          growthByMonth[key] = (growthByMonth[key] || 0) + 1;
        });
        setUserGrowth(Object.entries(growthByMonth).map(([k, v]) => ({ month: k, users: v })));
        // Transactions
        const txRes = await axios.get("http://localhost:5000/api/transactions", { headers: { Authorization: `Bearer ${token}` } });
        setTransactions(txRes.data);
        setStats(s => ({ ...s, totalTransactions: txRes.data.length }));        // Revenue chart
        const revRes = await axios.get("http://localhost:5000/api/transactions/sales/monthly", { headers: { Authorization: `Bearer ${token}` } });
        setRevenueData(revRes.data);
        
        // Calcul des tendances
        const totalRevenue = revRes.data.reduce((sum, r) => sum + (r.total || 0), 0);
        const avgTransactionAmount = txRes.data.reduce((sum, tx) => sum + tx.amount, 0) / txRes.data.length;
        
        // Calcul des catégories les plus populaires
        const categoryCount = {};
        txRes.data.forEach(tx => {
          categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
        });
        const topCategories = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }));

        // Calcul du taux de croissance mensuel
        const monthlyGrowth = revRes.data.length >= 2 
          ? ((revRes.data[revRes.data.length - 1].total - revRes.data[revRes.data.length - 2].total) 
             / revRes.data[revRes.data.length - 2].total * 100)
          : 0;

        // Calcul du taux de rétention (utilisateurs actifs / total utilisateurs)
        const retentionRate = (stats.activeUsers / stats.totalUsers) * 100;

        setStats(s => ({ 
          ...s, 
          totalRevenue,
          averageTransactionAmount: avgTransactionAmount,
          monthlyGrowthRate: monthlyGrowth,
          topCategories,
          userRetentionRate: retentionRate
        }));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Motivational/admin tips
    const tips = [
      "Empower your users by keeping the platform simple and fast!",
      "Review flagged users regularly for a healthy community.",
      "Export data often for safe backups.",
      "Monitor user growth to spot trends early.",
      "A happy user is a returning user!"
    ];
    setMotivation(tips[Math.floor(Math.random() * tips.length)]);
  }, []);
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(users.map(user =>
        user._id === userId ? response.data : user
      ));

      // Afficher une notification
      const action = newStatus === 'blocked' ? 'blocked' : 'unblocked';
      toast.success(`User successfully ${action}`);
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active'
      ? <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
      : <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>;
  };

  // Quick export as CSV
  const exportUsers = () => {
    const headers = ['ID', 'Name', 'Email', 'Status', 'Join Date', 'Last Active', 'Transactions', 'Total Spent', 'Savings'];
    let csvContent = headers.join(',') + '\n';
    users.forEach(user => {
      const row = [
        user.id,
        `"${user.name}"`,
        `"${user.email}"`,
        user.status,
        user.joinDate,
        user.lastActive,
        user.transactionCount,
        user.totalSpent,
        user.savings
      ];
      csvContent += row.join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 flex items-center gap-2">Admin Dashboard <TrendingUp className="inline-block" size={28} /></h1>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg shadow flex flex-col items-center">
          <Users className="text-blue-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold text-blue-900">{stats.totalUsers}</h2>
          <p className="text-blue-800">Total Users</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow flex flex-col items-center">
          <User className="text-purple-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold text-purple-900">{stats.activeUsers}</h2>
          <p className="text-purple-800">Active Users (24h)</p>
        </div>
        <div className="bg-red-100 p-6 rounded-lg shadow flex flex-col items-center">
          <Ban className="text-red-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold text-red-900">{stats.blockedUsers}</h2>
          <p className="text-red-800">Blocked Users</p>
        </div>
        <div className="bg-blue-100 p-6 rounded-lg shadow flex flex-col items-center">
          <DollarSign className="text-blue-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold text-blue-900">${stats.totalRevenue.toLocaleString()}</h2>
          <p className="text-blue-800">Total Revenue</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow flex flex-col items-center">
          <TrendingUp className="text-purple-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold text-purple-900">{stats.totalTransactions}</h2>
          <p className="text-purple-800">Transactions</p>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">User Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#6366f1" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Revenue (Monthly)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Recent Signups & Most Active Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Recent Signups</h2>
          <ul>
            {recentSignups.map(u => (
              <li key={u.id} className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-blue-500" size={18} />
                <span className="font-medium text-blue-900">{u.name}</span>
                <span className="text-gray-500">{u.email}</span>
                <span className="ml-auto text-gray-400 text-xs">{new Date(u.joinDate).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Most Active Users</h2>
          <ul>
            {mostActive.map(u => (
              <li key={u.id} className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-purple-500" size={18} />
                <span className="font-medium text-purple-900">{u.name}</span>
                <span className="text-gray-500">{u.email}</span>
                <span className="ml-auto text-gray-400 text-xs">{u.transactionCount} tx</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Users Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">All Users</h2>
          <button onClick={exportUsers} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            <Download size={18} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Join Date</th>
                <th className="px-4 py-2 text-left">Last Active</th>
                <th className="px-4 py-2 text-left">Transactions</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>              {users.map(user => (
                <tr key={user._id} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-2 text-blue-900">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-blue-100 text-blue-800' : user.status === 'inactive' ? 'bg-purple-100 text-purple-800' : user.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(user.joinDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Date(user.lastActive).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{user.transactionCount}</td>                  <td className="px-4 py-2">
                    {user.status !== 'blocked' ? (
                      <button
                        onClick={() => handleStatusChange(user._id, 'blocked')}
                        className="text-red-600 hover:text-red-800 mr-2"
                        title="Block User"
                      >
                        <Ban size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user._id, 'active')}
                        className="text-green-600 hover:text-green-800 mr-2"
                        title="Unblock User"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Transactions Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-purple-700">Recent Transactions</h2>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border rounded-md"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Savings</option>
            </select>
            <button
              onClick={() => exportTransactions()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx._id} className="border-b hover:bg-purple-50">
                  <td className="px-4 py-2 text-purple-900">{tx.userName || 'Unknown'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.type === 'income' ? 'bg-blue-100 text-blue-800' : tx.type === 'expense' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{tx.type}</span>
                  </td>
                  <td className="px-4 py-2">${tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-2">{tx.category}</td>
                  <td className="px-4 py-2">{new Date(tx.dateTime).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-blue-100 text-blue-800' : tx.status === 'pending' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{tx.status || 'completed'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Trends Analysis */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-6 text-blue-700">Analyse des Tendances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Monthly Growth Rate */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-600" size={24} />
              <h3 className="font-semibold text-blue-800">Croissance Mensuelle</h3>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {stats.monthlyGrowthRate > 0 ? '+' : ''}{stats.monthlyGrowthRate.toFixed(1)}%
            </p>
            <p className="text-sm text-blue-600">par rapport au mois dernier</p>
          </div>

          {/* Average Transaction */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-purple-600" size={24} />
              <h3 className="font-semibold text-purple-800">Transaction Moyenne</h3>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              ${stats.averageTransactionAmount.toFixed(2)}
            </p>
            <p className="text-sm text-purple-600">montant moyen par transaction</p>
          </div>

          {/* User Retention */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-green-600" size={24} />
              <h3 className="font-semibold text-green-800">Rétention Utilisateurs</h3>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.userRetentionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-green-600">taux de rétention actif</p>
          </div>

          {/* Top Categories */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="text-yellow-600" size={24} />
              <h3 className="font-semibold text-yellow-800">Catégories Populaires</h3>
            </div>
            <ul className="space-y-1">
              {stats.topCategories.slice(0, 3).map((cat, index) => (
                <li key={cat.category} className="flex justify-between items-center">
                  <span className="text-yellow-900">{cat.category}</span>
                  <span className="text-yellow-600">{cat.count} tx</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Activity Trends */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Insights Utilisateurs</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={16} />
                <span>
                  {stats.activeUsers} utilisateurs actifs sur {stats.totalUsers} au total
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Ban className="text-red-500" size={16} />
                <span>
                  {stats.blockedUsers} comptes bloqués ({((stats.blockedUsers / stats.totalUsers) * 100).toFixed(1)}%)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={16} />
                <span>
                  En moyenne {(stats.totalTransactions / stats.activeUsers).toFixed(1)} transactions par utilisateur actif
                </span>
              </li>
            </ul>
          </div>

          {/* Financial Metrics */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">Métriques Financières</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <DollarSign className="text-green-500" size={16} />
                <span>
                  Revenu mensuel moyen: ${(stats.totalRevenue / revenueData.length).toFixed(2)}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={16} />
                <span>
                  {stats.monthlyGrowthRate > 0 ? 'Croissance' : 'Décroissance'} de {Math.abs(stats.monthlyGrowthRate).toFixed(1)}% ce mois
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Flag className="text-purple-500" size={16} />
                <span>
                  Catégorie la plus rentable: {stats.topCategories[0]?.category || 'N/A'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* Motivational/Admin Tip */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-100 to-purple-200 rounded-lg text-center text-lg font-semibold text-blue-800 shadow">
        {motivation}
      </div>
    </div>
  );
}