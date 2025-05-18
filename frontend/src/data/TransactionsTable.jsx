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
    <div className="bg-white rounded-xl shadow-lg mt-6 overflow-hidden">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center">
          <FaWallet className="text-indigo-600 mr-3 text-xl" />
          <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>

          <select
            className="py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FaFileDownload className="mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Total Income</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(filteredTransactions.reduce((sum, tx) =>
              tx.type === 'income' ? sum + parseFloat(tx.amount) : sum, 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(filteredTransactions.reduce((sum, tx) =>
              tx.type === 'expense' ? sum + parseFloat(tx.amount) : sum, 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Net Balance</div>
          <div className="text-2xl font-bold text-indigo-600">
            {formatCurrency(filteredTransactions.reduce((sum, tx) =>
              tx.type === 'income' ? sum + parseFloat(tx.amount) : sum - parseFloat(tx.amount), 0))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-100">
              <th
                className="p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('dateTime')}
              >
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-gray-500" />
                  Date & Time
                  <SortIndicator field="dateTime" />
                </div>
              </th>
              <th
                className="p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center">
                  Description
                  <SortIndicator field="description" />
                </div>
              </th>
              <th
                className="p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center">
                  Amount
                  <SortIndicator field="amount" />
                </div>
              </th>
              <th
                className="p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  <SortIndicator field="type" />
                </div>
              </th>
              <th
                className="p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  <FaChartPie className="mr-2 text-gray-500" />
                  Category
                  <SortIndicator field="category" />
                </div>
              </th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((tx, index) => {
                const status = getTransactionStatus(tx);
                return (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-50 transition-colors ${status === 'recent' ? 'bg-blue-50' :
                      status === 'major' ? 'bg-green-50' : ''
                      }`}
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
                            className="px-4 py-2 rounded transition bg-red-500 text-white hover:bg-red-600"
                          >
                            Stop Recurring
                          </button>
                        ) : (
                          <span className="px-4 py-2 rounded bg-gray-400 text-white cursor-not-allowed">
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
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              // Show pages around current page
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
                  className={`px-3 py-1 rounded-md border ${currentPage === pageNum
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-100'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(pageCount)}
              disabled={currentPage === pageCount}
              className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}