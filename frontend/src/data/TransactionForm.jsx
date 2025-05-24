import { useState, useEffect } from "react";
import { useFinance } from "./FinanceContext";
import { Spinner } from "@material-tailwind/react";
import { toast } from "react-toastify";
import axios from "axios";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export default function TransactionForm({ onTransactionAdded, budgets = [] }) {
  const { addTransaction, isLoading } = useFinance();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState([
    "Food",
    "Transport",
    "Entertainment",
    "Bills",
    "Health",
    "Other",
  ]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState('monthly');

  const handleAddCategory = () => {
    if (customCategory.trim() && !categories.includes(customCategory)) {
      setCategories([...categories, customCategory]);
      setCustomCategory("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description || !amount) {
      setError("Please fill in all fields.");
      return;
    }
    if (isNaN(amount)) {
      setError("Please enter a valid amount.");
      return;
    }

    const formData = {
      description,
      amount: parseFloat(amount),
      type,
      category,
      dateTime: new Date().toISOString(),
      isRecurring,
      interval: isRecurring ? interval : undefined
    };

    try {
      console.log("Retrieved token:", localStorage.getItem("authToken")); // Log the token being retrieved
      await axios.post("http://localhost:5000/api/transactions", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Ensure the token is included
        },
      });
      setSuccess("Transaction added successfully!");
      setDescription("");
      setAmount("");
      setCategory("Other");
      setDate(new Date().toISOString().split("T")[0]);
      setError("");
      setIsRecurring(false);
      setInterval('monthly');

      if (onTransactionAdded) {
        onTransactionAdded();
      }

      addTransaction(formData);
    } catch (err) {
      console.error("Error adding transaction:", err.response?.data || err.message); // Log the error
      setError("Failed to add transaction. Please try again.");
    }
  };

  useEffect(() => {
    const checkBudget = () => {
      if (type === "expense" && category && amount) {
        const budget = budgets.find((b) => b.category === category);
        if (budget) {
          const projected = budget.spent + parseFloat(amount);
          if (projected > budget.limit) {
            toast.warning(
              `⚠️ This expense will exceed your ${category} budget by €${(
                projected - budget.limit
              ).toFixed(2)}`
            );
          } else if (projected > budget.limit * 0.9) {
            toast.info(
              `ℹ️ This expense will reach ${Math.round(
                (projected / budget.limit) * 100
              )}% of your ${category} budget`
            );
          }
        }
      }
    };

    const timeout = setTimeout(checkBudget, 500);
    return () => clearTimeout(timeout);
  }, [category, amount, type, budgets]);

  return (
    <div className="flex justify-center items-center min-h-[70vh] bg-gradient-to-br from-blue-50 via-white to-purple-100 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white/90 p-8 rounded-2xl shadow-2xl border border-blue-100 space-y-6" aria-label="Transaction Form">
        <h2 className="text-2xl font-extrabold text-blue-700 mb-2 text-center tracking-tight">Add a Transaction</h2>
        <div className="grid grid-cols-1 gap-4">
          <label htmlFor="description" className="sr-only">Description</label>
          <input
            id="description"
            type="text"
            placeholder="Description"
            className="w-full p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:outline-none bg-blue-50/50 text-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            tabIndex={0}
          />
          <label htmlFor="amount" className="sr-only">Amount</label>
          <input
            id="amount"
            type="number"
            placeholder="Amount (€)"
            className="w-full p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:outline-none bg-blue-50/50 text-gray-800"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            tabIndex={0}
          />
          <label htmlFor="date" className="sr-only">Date</label>
          <input
            id="date"
            type="date"
            className="w-full p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:outline-none bg-blue-50/50 text-gray-800"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            tabIndex={0}
          />
        </div>
        <div className="flex gap-3">
          <label htmlFor="type" className="sr-only">Type</label>
          <select
            id="type"
            className="w-1/2 p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:outline-none bg-purple-50/50 text-gray-800"
            value={type}
            onChange={(e) => setType(e.target.value)}
            tabIndex={0}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <label htmlFor="category" className="sr-only">Category</label>
          <select
            id="category"
            className="w-1/2 p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:outline-none bg-purple-50/50 text-gray-800"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            tabIndex={0}
          >
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <label htmlFor="customCategory" className="sr-only">Add new category</label>
          <input
            id="customCategory"
            type="text"
            placeholder="Add new category"
            className="w-full p-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:outline-none bg-green-50/50 text-gray-800"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            tabIndex={0}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-500 hover:to-green-700 transition"
            tabIndex={0}
            aria-label="Add new category"
          >
            Add
          </button>
        </div>
        <div className="flex items-center gap-2 relative group">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 accent-purple-500"
            tabIndex={0}
            aria-describedby="periodic-info"
          />
          <label htmlFor="isRecurring" className="text-sm text-gray-700 font-medium flex items-center gap-1 cursor-pointer">
            Periodic
            <span className="relative flex items-center">
              <InformationCircleIcon
                className="h-5 w-5 text-blue-400 ml-1 cursor-pointer"
                aria-label="Info"
                tabIndex={0}
              />
              <span id="periodic-info" role="tooltip" className="absolute left-6 top-1 z-10 hidden group-hover:block group-focus-within:block bg-white border border-blue-200 text-xs text-gray-700 rounded-lg shadow-lg px-3 py-2 w-56">
                Enable this if the transaction repeats on a regular basis (e.g., monthly subscription, salary, etc.).
              </span>
            </span>
          </label>
        </div>
        {isRecurring && (
          <div className="relative group">
            <label htmlFor="interval" className="sr-only">Interval</label>
            <select
              id="interval"
              className="w-full p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:outline-none bg-purple-50/50 text-gray-800"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              tabIndex={0}
              aria-describedby="interval-info"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
            <span className="absolute right-2 top-3 flex items-center">
              <InformationCircleIcon
                className="h-5 w-5 text-blue-400 ml-1 cursor-pointer"
                aria-label="Info"
                tabIndex={0}
              />
              <span id="interval-info" role="tooltip" className="absolute left-6 top-1 z-10 hidden group-hover:block group-focus-within:block bg-white border border-blue-200 text-xs text-gray-700 rounded-lg shadow-lg px-3 py-2 w-56">
                Choose how often this transaction should repeat.
              </span>
            </span>
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-purple-600 transition text-lg flex items-center justify-center"
          disabled={isLoading}
          tabIndex={0}
        >
          {isLoading ? <Spinner className="h-5 w-5 mx-auto" /> : "Add Transaction"}
        </button>
        {error && <p className="text-red-500 text-sm text-center font-semibold bg-red-50 rounded-xl py-2" tabIndex={0}>{error}</p>}
        {success && <p className="text-green-600 text-sm text-center font-semibold bg-green-50 rounded-xl py-2" tabIndex={0}>{success}</p>}
      </form>
    </div>
  );
}