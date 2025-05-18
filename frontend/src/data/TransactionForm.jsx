import { useState, useEffect } from "react";
import { useFinance } from "./FinanceContext";
import { Spinner } from "@material-tailwind/react";
import { toast } from "react-toastify";
import axios from "axios";

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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Add a Transaction</h2>
      <input
        type="text"
        placeholder="Description"
        className="w-full p-3 border rounded"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount (€)"
        className="w-full p-3 border rounded"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="date"
        className="w-full p-3 border rounded"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="flex gap-2">
        <select
          className="w-1/2 p-3 border rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="w-1/2 p-3 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add new category"
          className="w-full p-3 border rounded"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
        />
        <button
          type="button"
          onClick={handleAddCategory}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Add
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="isRecurring" className="text-sm text-gray-700">Periodic</label>
      </div>
      {isRecurring && (
        <select
          className="w-full p-3 border rounded"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="Yearly">Yearly</option>
        </select>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
        disabled={isLoading}
      >
        {isLoading ? <Spinner className="h-5 w-5 mx-auto" /> : "Add Transaction"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}
    </form>
  );
}