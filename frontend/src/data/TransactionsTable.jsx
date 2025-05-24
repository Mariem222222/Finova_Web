import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useFinance } from "./FinanceContext";
import { format } from "date-fns";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaFileDownload,
  FaCalendarAlt,
  FaChartPie,
  FaWallet
} from 'react-icons/fa';

export default function TransactionsTable() {
  const { transactions, setTransactions } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dateTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/transactions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        console.log('Fetched transactions:', response.data); // Log the fetched transactions
        setTransactions(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "An error occurred. Please try again.");
      }
    };

    fetchTransactions();
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        // Filter by search term
        const matchesSearch =
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter by type
        const matchesType =
          filterType === 'all' ||
          tx.type === filterType;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortField === 'amount') {
          return sortDirection === 'asc'
            ? parseFloat(a.amount) - parseFloat(b.amount)
            : parseFloat(b.amount) - parseFloat(a.amount);
        } else if (sortField === 'dateTime') {
          const dateA = new Date(a.dateTime || new Date());
          const dateB = new Date(b.dateTime || new Date());
          return sortDirection === 'asc'
            ? dateA - dateB
            : dateB - dateA;
        } else {
          return sortDirection === 'asc'
            ? (a[sortField] || '').localeCompare(b[sortField] || '')
            : (b[sortField] || '').localeCompare(a[sortField] || '');
        }
      });
  }, [transactions, searchTerm, sortField, sortDirection, filterType]);

  // Pagination
  const pageCount = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Category totals
  const categoryTotals = useMemo(() => {
    const totals = {};
    filteredTransactions.forEach(tx => {
      if (!totals[tx.category]) {
        totals[tx.category] = {
          income: 0,
          expense: 0
        };
      }
      if (tx.type === 'income') {
        totals[tx.category].income += parseFloat(tx.amount);
      } else {
        totals[tx.category].expense += parseFloat(tx.amount);
      }
    });
    return totals;
  }, [filteredTransactions]);

  // Get transaction status
  const getTransactionStatus = (tx) => {
    const today = new Date();
    const txDate = new Date(tx.dateTime || today);
    const diffTime = Math.abs(today - txDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'recent';
    if (tx.type === 'income' && tx.amount > 1000) return 'major';
    return 'normal';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Date & Time', 'Description', 'Amount', 'Type', 'Category'],
      ...filteredTransactions.map(tx => [
        format(new Date(tx.dateTime || new Date()), 'dd/MM/yyyy HH:mm'),
        tx.description,
        tx.amount,
        tx.type,
        tx.category
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create sort indicator component
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return <FaSort className="text-gray-400 ml-1" />;
    return sortDirection === 'asc' ?
      <FaSortUp className="text-indigo-600 ml-1" /> :
      <FaSortDown className="text-indigo-600 ml-1" />;
  };

  const stopRecurringTransaction = async (id) => {
    if (!id) {
      console.error("Transaction ID is undefined.");
      return;
    }
    try {
      const response = await axios.put(`http://localhost:5000/api/transactions/${id}/stop`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setTransactions(transactions => transactions.map(tx => tx._id === id ? { ...tx, active: false } : tx));
      setSuccessMessage("Recurring transaction stopped successfully!");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error stopping recurring transaction:", error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-100 min-h-screen rounded-xl shadow-lg mt-6 overflow-hidden p-2 md:p-6">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 animate-fade-in" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-b bg-white/80 rounded-t-2xl shadow">
        <div className="flex items-center">
          <FaWallet className="text-indigo-600 mr-3 text-2xl" />
          <h2 className="text-2xl font-extrabold text-blue-800 tracking-tight">Transaction History</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50/50 text-gray-800 w-full md:w-56"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-blue-400" />
          </div>
          <select
            className="py-2 px-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/50 text-gray-800"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl font-bold shadow hover:from-blue-600 hover:to-purple-600 transition"
          >
            <FaFileDownload className="mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-transparent">
        <div className="bg-gradient-to-br from-blue-100 to-green-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transform transition hover:scale-105">
          <div className="text-green-500 text-3xl mb-2"><svg xmlns='http://www.w3.org/2000/svg' className='inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='32' height='32'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v8m0 0l-3-3m3 3l3-3' /></svg></div>
          <div className="text-sm text-blue-700 mb-1 font-semibold">Total Income</div>
          <div className="text-3xl font-extrabold text-blue-900">{formatCurrency(filteredTransactions.reduce((sum, tx) => tx.type === 'income' ? sum + parseFloat(tx.amount) : sum, 0))}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-red-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transform transition hover:scale-105">
          <div className="text-red-500 text-3xl mb-2"><svg xmlns='http://www.w3.org/2000/svg' className='inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='32' height='32'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 16V8m0 0l-3 3m3-3l3 3' /></svg></div>
          <div className="text-sm text-purple-700 mb-1 font-semibold">Total Expenses</div>
          <div className="text-3xl font-extrabold text-purple-900">{formatCurrency(filteredTransactions.reduce((sum, tx) => tx.type === 'expense' ? sum + parseFloat(tx.amount) : sum, 0))}</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-100 to-blue-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transform transition hover:scale-105">
          <div className="text-indigo-500 text-3xl mb-2"><svg xmlns='http://www.w3.org/2000/svg' className='inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='32' height='32'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 12H8m0 0l3-3m-3 3l3 3' /></svg></div>
          <div className="text-sm text-indigo-700 mb-1 font-semibold">Net Balance</div>
          <div className="text-3xl font-extrabold text-indigo-900">{formatCurrency(filteredTransactions.reduce((sum, tx) => tx.type === 'income' ? sum + parseFloat(tx.amount) : sum - parseFloat(tx.amount), 0))}</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white/90 rounded-2xl shadow-xl mt-4">
        <table className="w-full text-left border-collapse rounded-2xl overflow-hidden">
          <thead>
            <tr className="border-b bg-gradient-to-r from-blue-100 to-purple-100">
              <th className="p-3 cursor-pointer hover:bg-blue-50 transition-colors rounded-tl-2xl" onClick={() => handleSort('dateTime')}>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  Date & Time
                  <SortIndicator field="dateTime" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleSort('description')}>
                <div className="flex items-center">
                  Description
                  <SortIndicator field="description" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleSort('amount')}>
                <div className="flex items-center">
                  Amount
                  <SortIndicator field="amount" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleSort('type')}>
                <div className="flex items-center">
                  Type
                  <SortIndicator field="type" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleSort('category')}>
                <div className="flex items-center">
                  <FaChartPie className="mr-2 text-purple-500" />
                  Category
                  <SortIndicator field="category" />
                </div>
              </th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-tr-2xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((tx, index) => {
                const status = getTransactionStatus(tx);
                return (
                  <tr
                    key={index}
                    className={`border-b transition-colors ${index % 2 === 0 ? 'bg-blue-50/30' : 'bg-purple-50/20'} hover:bg-blue-100/60 ${status === 'recent' ? 'ring-2 ring-blue-200' : status === 'major' ? 'ring-2 ring-green-200' : ''}`}
                  >
                    <td className="p-3 whitespace-nowrap">
                      {tx.dateTime
                        ? format(new Date(tx.dateTime), 'dd/MM/yyyy HH:mm')
                        : format(new Date(), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{tx.description}</div>
                    </td>
                    <td className="p-3 font-medium">
                      <span className={`${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm ${tx.type === "income" ? "bg-green-500" : "bg-red-500"
                          }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-3">
                      {status === 'recent' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          Recent
                        </span>
                      )}
                      {status === 'major' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          Major
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {tx.isRecurring && (
                        tx.active ? (
                          <button
                            onClick={() => stopRecurringTransaction(tx._id)}
                            className="px-4 py-2 rounded-xl transition bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold shadow hover:from-red-600 hover:to-red-800"
                          >
                            Stop Recurring
                          </button>
                        ) : (
                          <span className="px-4 py-2 rounded-xl bg-gray-400 text-white cursor-not-allowed">
                            Recurring Stopped
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No transactions found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-100 to-purple-100 border-t rounded-b-2xl mt-2 gap-2">
          <div className="text-sm text-gray-600 mb-2 md:mb-0">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-xl border border-blue-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-xl border border-blue-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              let pageNum;
              if (pageCount <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pageCount - 2) {
                pageNum = pageCount - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-xl border border-blue-200 bg-white font-semibold ${currentPage === pageNum
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow'
                    : 'hover:bg-blue-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="px-3 py-1 rounded-xl border border-blue-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(pageCount)}
              disabled={currentPage === pageCount}
              className="px-3 py-1 rounded-xl border border-blue-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Last
            </button>
          </div>
        </div>
      )}
      {/* Animation styles */}
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