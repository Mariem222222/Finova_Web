import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PiggyBank, Target, TrendingUp, Brain, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const SavingsGoalForm = ({ onAddGoal, goals = [] }) => {
  const [goal, setGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
    priority: goals.length + 1
  });
  const [customGoal, setCustomGoal] = useState("");
  const [isLoadingSavings, setIsLoadingSavings] = useState(true);

  useEffect(() => {
    const fetchCurrentSavings = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(
          "http://localhost:5000/api/savings-goals/current-savings",
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        setGoal(prev => ({
          ...prev,
          currentAmount: response.data.currentSavings.toFixed(2)
        }));
      } catch (error) {
        toast.error("Failed to load current savings");
      } finally {
        setIsLoadingSavings(false);
      }
    };
    fetchCurrentSavings();
  }, []);

  const { remainingAmount, percentageAchieved, estimatedMonthlySavings } = useMemo(() => {
    const target = parseFloat(goal.targetAmount) || 0;
    const current = parseFloat(goal.currentAmount) || 0;
    const remaining = Math.max(target - current, 0);
    const percentage = target > 0 ? ((current / target) * 100).toFixed(2) : 0;

    let monthly = 0;
    if (goal.targetDate && remaining > 0) {
      const targetDate = new Date(goal.targetDate);
      const months = Math.max(
        (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
        targetDate.getMonth() - new Date().getMonth(),
        1
      );
      monthly = (remaining / months).toFixed(2);
    }

    return { remainingAmount: remaining, percentageAchieved: percentage, estimatedMonthlySavings: monthly };
  }, [goal]);

  const handleSubmit = useCallback(async () => {
    if ((!goal.name && !customGoal.trim()) || !goal.targetAmount || !goal.targetDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.post(
        "http://localhost:5000/api/savings-goals",
        { ...goal, name: goal.name || customGoal.trim(), priority: goal.priority || (goals.length + 1) },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      onAddGoal(response.data);
      setGoal({ name: "", targetAmount: "", currentAmount: "", targetDate: "", priority: goals.length + 2 });
      setCustomGoal("");
      toast.success("Goal added to queue!");
    } catch (error) {
      toast.error("Failed to create goal");
    }
  }, [goal, customGoal, onAddGoal, goals.length]);

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
      <header className="flex items-center mb-6">
        <Target className="text-blue-500 mr-3" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Smart Savings Planner</h2>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
            <select
              value={goal.name}
              onChange={(e) => setGoal(g => ({ ...g, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Select goal type</option>
              {["Emergency Fund", "Vacation", "Home", "Car", "Other"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Custom goal name"
              value={customGoal}
              onChange={(e) => {
                setCustomGoal(e.target.value);
                setGoal(g => ({ ...g, name: "" }));
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 mt-2"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
            <input
              type="number"
              value={goal.targetAmount}
              onChange={(e) => setGoal(g => ({ ...g, targetAmount: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300"
              placeholder="$5000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Savings {isLoadingSavings && "(Loading...)"}
            </label>
            <input
              type="number"
              value={goal.currentAmount}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
            <input
              type="date"
              value={goal.targetDate}
              onChange={(e) => setGoal(g => ({ ...g, targetDate: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <input
              type="number"
              min="1"
              value={goal.priority}
              onChange={e => setGoal(g => ({ ...g, priority: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300"
              placeholder="1 (highest)"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Add to Savings Queue
          </button>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl">
          <div className="flex items-center mb-4">
            <Brain className="text-purple-500 mr-2" size={24} />
            <h3 className="text-lg font-semibold">Goal Analytics</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💸</span>
                  <span className="text-sm">Remaining</span>
                </div>
                <span className="text-red-500 font-semibold">${remainingAmount}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  <span className="text-sm">Progress</span>
                </div>
                <span className="text-green-500 font-semibold">{percentageAchieved}%</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500"
                  style={{ width: `${percentageAchieved}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗓️</span>
                  <span className="text-sm">Monthly Needed</span>
                </div>
                <span className="text-blue-500 font-semibold">${estimatedMonthlySavings}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalItem = ({ goal, onRemove }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateProgress = () => {
      const newProgress = (goal.currentAmount / goal.targetAmount) * 100;
      setProgress(Math.min(newProgress, 100));
    };

    const updateTimeLeft = () => {
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      const diff = targetDate - now;

      if (diff < 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days}d ${hours}h left`);
    };

    updateProgress();
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 3600000);
    return () => clearInterval(interval);
  }, [goal]);

  const handleDelete = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      await axios.delete(`http://localhost:5000/api/savings-goals/${goal._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      onRemove(goal._id);
      toast.success("Goal removed!");
    } catch (error) {
      toast.error("Failed to remove goal");
    }
  };
  return (
    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition relative">
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      >
        <XCircle size={20} />
      </button>

      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{goal.name}</h3>
        <span className="text-green-600 font-medium">
          ${goal.currentAmount.toFixed(2)}/${goal.targetAmount.toFixed(2)}
        </span>
      </div>

      <div className="text-sm text-gray-500 mb-2">
        {new Date(goal.targetDate).toLocaleDateString()} • {timeLeft}
      </div>

      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {typeof goal.priority !== 'undefined' && (
        <div className="mb-2">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            Priority: {goal.priority}
          </span>
        </div>
      )}
    </div>
  );
};

const ChatInterface = () => {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");

    try {
      setIsLoading(true);
      const { data } = await axios.post(
        "http://localhost:5000/api/chatbot",
        { question: chatInput },
        { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
      );

      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: data.response }
      ]);
    } catch (error) {
      toast.error("Failed to get response");
    } finally {
      setIsLoading(false);
    }
  }, [chatInput, isLoading]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="h-96 mb-4 overflow-y-auto space-y-3 pr-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${msg.sender === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about savings strategies..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default function SavingsPlanning() {
  const [goals, setGoals] = useState([]);
  const [currentSavings, setCurrentSavings] = useState(0);

  const checkOldestGoal = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get(
        "http://localhost:5000/api/savings-goals/check-oldest",
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.processed) {
        setGoals(prev => prev.filter(g => g._id !== response.data.processedGoal._id));

        // Ajoutez ce bloc pour déclencher la notification
        toast[response.data.status === 'achieved' ? 'success' : 'error'](
          `Goal "${response.data.processedGoal.name}" ${response.data.status}!`,
          {
            onOpen: () => {
              // Envoyez la notification via l'API
              axios.post('/api/notifications', {
                type: response.data.status,
                message: `Goal ${response.data.processedGoal.name} ${response.data.status}`,
                goalId: response.data.processedGoal._id
              }, {
                headers: { Authorization: `Bearer ${authToken}` }
              });
            }
          }
        );
      }
    } catch (error) {
      console.error("Error checking goals:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const [goalsRes, savingsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/savings-goals",
            { headers: { Authorization: `Bearer ${authToken}` } }),
          axios.get("http://localhost:5000/api/savings-goals/current-savings",
            { headers: { Authorization: `Bearer ${authToken}` } })
        ]);

        const currentSavings = Number(savingsRes.data.currentSavings) || 0;
        const goalsWithLiveData = goalsRes.data.map(goal => ({
          ...goal,
          currentAmount: currentSavings,
          priority: typeof goal.priority !== 'undefined' ? goal.priority : 1
        }));

        setGoals(goalsWithLiveData);
        setCurrentSavings(currentSavings);
      } catch (error) {
        toast.error("Failed to load data");
      }
    };

    fetchData();
    const interval = setInterval(() => {
      fetchData();
      checkOldestGoal();
    }, 300000);

    return () => clearInterval(interval);
  }, [checkOldestGoal]);

  const handleRemoveGoal = (goalId) => {
    setGoals(prev => prev.filter(g => g._id !== goalId));
  };

  const fetchGoals = async () => {
    const authToken = localStorage.getItem("authToken");
    const response = await axios.get("http://localhost:5000/api/savings-goals", {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    setGoals(response.data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <PiggyBank className="text-blue-500" size={40} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Financial Planner</h1>
            <p className="text-lg text-gray-600 mt-2">
              Current Savings: ${currentSavings.toFixed(2)}
            </p>
          </div>
        </header>

        <SavingsGoalForm onAddGoal={fetchGoals} goals={goals} />

        {goals.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="text-green-500" size={24} />
              Active Goals
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalItem
                  key={goal._id}
                  goal={goal}
                  onRemove={handleRemoveGoal}
                />
              ))}
            </div>
          </div>
        )}

        <ChatInterface />
      </div>
    </div>
  );
}