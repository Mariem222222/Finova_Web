import React, { useState, useEffect } from "react";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios"; // Import axios for API calls
import { useFinance } from "@/data/FinanceContext";
import { User, Users, TrendingUp, DollarSign, Flag, Download, CheckCircle, Ban, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
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
        setStats(s => ({
          ...s,
          totalUsers: usersData.length,
          activeUsers: usersData.filter(u => u.status === 'active').length,
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
        setStats(s => ({ ...s, totalTransactions: txRes.data.length }));
        // Revenue chart
        const revRes = await axios.get("http://localhost:5000/api/transactions/sales/monthly", { headers: { Authorization: `Bearer ${token}` } });
        setRevenueData(revRes.data);
        setStats(s => ({ ...s, totalRevenue: revRes.data.reduce((sum, r) => sum + (r.total || 0), 0) }));
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
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      setUsers(users.map(user =>
        user._id === userId ? response.data : user
      ));
    } catch (error) {
      console.error("Failed to update user status:", error);
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-yellow-700 flex items-center gap-2">Admin Dashboard <TrendingUp className="inline-block" size={28} /></h1>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-yellow-100 p-6 rounded-lg shadow flex flex-col items-center">
          <Users className="text-yellow-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold">{stats.totalUsers}</h2>
          <p className="text-yellow-800">Total Users</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow flex flex-col items-center">
          <User className="text-green-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold">{stats.activeUsers}</h2>
          <p className="text-green-800">Active Users (24h)</p>
        </div>
        <div className="bg-blue-100 p-6 rounded-lg shadow flex flex-col items-center">
          <DollarSign className="text-blue-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</h2>
          <p className="text-blue-800">Total Revenue</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow flex flex-col items-center">
          <TrendingUp className="text-purple-700 mb-2" size={32} />
          <h2 className="text-2xl font-bold">{stats.totalTransactions}</h2>
          <p className="text-purple-800">Transactions</p>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#facc15" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Revenue (Monthly)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#60a5fa" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Recent Signups & Most Active Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Signups</h2>
          <ul>
            {recentSignups.map(u => (
              <li key={u.id} className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-green-500" size={18} />
                <span className="font-medium">{u.name}</span>
                <span className="text-gray-500">{u.email}</span>
                <span className="ml-auto text-gray-400 text-xs">{new Date(u.joinDate).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Most Active Users</h2>
          <ul>
            {mostActive.map(u => (
              <li key={u.id} className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-blue-500" size={18} />
                <span className="font-medium">{u.name}</span>
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
          <h2 className="text-xl font-semibold">All Users</h2>
          <button onClick={exportUsers} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
            <Download size={18} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Join Date</th>
                <th className="px-4 py-2 text-left">Last Active</th>
                <th className="px-4 py-2 text-left">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-yellow-50">
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-800' : user.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{user.status}</span>
                  </td>
                  <td className="px-4 py-2">{new Date(user.joinDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Date(user.lastActive).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{user.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
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
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-yellow-50">
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
                <tr key={tx._id} className="border-b hover:bg-yellow-50">
                  <td className="px-4 py-2">{tx.userName || 'Unknown'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.type === 'income' ? 'bg-green-100 text-green-800' :
                      tx.type === 'expense' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">${tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-2">{tx.category}</td>
                  <td className="px-4 py-2">{new Date(tx.dateTime).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {tx.status || 'completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Motivational/Admin Tip */}
      <div className="mt-8 p-4 bg-gradient-to-r from-yellow-100 to-yellow-300 rounded-lg text-center text-lg font-semibold text-yellow-800 shadow">
        {motivation}
      </div>
    </div>
  );
}