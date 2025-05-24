import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

  // Emoji/type mapping
  const typeEmoji = {
    'Home': '🏠',
    'Car': '🚗',
    'Vacation': '✈️',
    'Emergency Fund': '🚨',
    'Other': '⭐',
  };
  const emoji = typeEmoji[goal.name] || '💡';
  // Color by priority
  const priorityColors = [
    'from-blue-200 to-blue-100',
    'from-purple-200 to-purple-100',
    'from-pink-200 to-pink-100',
    'from-green-200 to-green-100',
    'from-yellow-200 to-yellow-100',
  ];
  const cardColor = priorityColors[(goal.priority - 1) % priorityColors.length];

  return (
    <div className={`bg-gradient-to-br ${cardColor} p-4 rounded-2xl hover:shadow-lg transition relative flex flex-col items-center`}>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      >
        <XCircle size={20} />
      </button>
      <div className="flex flex-col items-center mb-2">
        <span className="text-3xl mb-1">{emoji}</span>
        <h3 className="font-semibold text-lg text-gray-800">{goal.name}</h3>
      </div>
      {/* Circular Progress Ring */}
      <div className="my-2">
        <svg width="64" height="64" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831"
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeDasharray={`${progress}, 100`}
            strokeLinecap="round"
          />
          <text x="18" y="20.35" textAnchor="middle" className="fill-blue-700 text-base font-bold">{Math.round(progress)}%</text>
        </svg>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {goal.currentAmount.toFixed(2)} / {goal.targetAmount.toFixed(2)}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {new Date(goal.targetDate).toLocaleDateString()} • {timeLeft}
      </div>
      {typeof goal.priority !== 'undefined' && (
        <span className="inline-block bg-white bg-opacity-70 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
          Priority: {goal.priority}
        </span>
      )}
    </div>
  );
};

const ChatInterface = () => {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Show welcome message from Maria on first open
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: "Hi! I'm Maria, your AI assistant in Finova. I can now process PDF documents to give you better financial advice! You can upload documents like bank statements, investment reports, or financial guides. How can I assist you today? 😊"
        }
      ]);
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsLoading(true);
      await axios.post(
        "http://localhost:5000/api/documents",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );
      setSelectedFile(file.name);
      toast.success('Document uploaded successfully!');
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: `I've processed "${file.name}". You can now ask me questions about its contents! 📄`
      }]);
    } catch (error) {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return;
    
    const userMsg = { id: Date.now(), sender: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    
    try {
      setIsLoading(true);
      const { data } = await axios.post(
        "http://localhost:5000/api/chatbot",
        { 
          question: chatInput,
          context: selectedFile ? { documentName: selectedFile } : undefined
        },
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("authToken")}` 
          } 
        }
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
  }, [chatInput, isLoading, selectedFile]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="h-96 mb-4 overflow-y-auto space-y-3 pr-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' ? (
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-2xl shadow border border-blue-200">
                  🤖
                </div>
                <div className="relative max-w-[85%]">
                  <div className="bg-blue-50 text-blue-900 p-4 rounded-2xl rounded-bl-none shadow-md">
                    {msg.text}
                  </div>
                  <div className="absolute left-0 bottom-0 w-0 h-0 border-t-8 border-t-blue-50 border-l-8 border-l-transparent border-b-0 border-r-0"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div className="max-w-[85%] p-4 rounded-2xl bg-blue-500 text-white rounded-br-none shadow-md">
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-full px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-2">
              <span className="text-xl">📎</span>
              <span className="text-gray-600">
                {selectedFile ? `Uploaded: ${selectedFile}` : 'Upload PDF Document'}
              </span>
            </div>
          </label>
          {selectedFile && (
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about savings strategies or your documents..."
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
    </div>
  );
};

const ChatbotFloating = () => {
  const [open, setOpen] = useState(false);
  const chatRef = useRef(null);

  // Trap focus when open
  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.focus();
    }
  }, [open]);

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg flex items-center justify-center text-white text-3xl hover:scale-110 transition-all border-4 border-white"
        onClick={() => setOpen(true)}
        aria-label="Open Chatbot"
      >
        <span role="img" aria-label="chatbot">🤖</span>
      </button>
      {/* Chatbot Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-end bg-black bg-opacity-30">
          <div
            ref={chatRef}
            tabIndex={-1}
            className="w-full max-w-md md:mr-12 m-0 md:mb-0 mb-4 rounded-3xl shadow-2xl bg-gradient-to-br from-blue-100 via-white to-purple-100 border border-blue-200 focus:outline-none animate-fade-in-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200 rounded-t-3xl bg-gradient-to-r from-blue-200 to-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-3xl border-2 border-white shadow">
                  <span role="img" aria-label="chatbot">🤖</span>
                </div>
                <span className="text-lg font-bold text-purple-700 tracking-wide">CHATBOT</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-100 text-purple-700"
                  onClick={() => setOpen(false)}
                  aria-label="Close Chatbot"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            {/* Chat Interface */}
            <div className="p-4">
              <ChatInterface />
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default function SavingsPlanning() {
  const [goals, setGoals] = useState([]);
  const [currentSavings, setCurrentSavings] = useState(0);

  // Budget Overview Calculations
  const totalGoals = goals.length;
  const totalTarget = goals.reduce((sum, g) => sum + (parseFloat(g.targetAmount) || 0), 0);
  const totalSaved = goals.reduce((sum, g) => sum + (parseFloat(g.currentAmount) || 0), 0);
  const percentAchieved = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0;

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
        {/* Budget Overview Widget */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-100 p-6 rounded-2xl shadow flex flex-col items-center">
            <span className="text-2xl text-blue-600 mb-2">🎯</span>
            <span className="text-2xl font-bold text-blue-900">{totalGoals}</span>
            <span className="text-blue-800">Total Goals</span>
          </div>
          <div className="bg-purple-100 p-6 rounded-2xl shadow flex flex-col items-center">
            <span className="text-2xl text-purple-600 mb-2">💵</span>
            <span className="text-2xl font-bold text-purple-900">${totalTarget.toLocaleString()}</span>
            <span className="text-purple-800">Total Target</span>
          </div>
          <div className="bg-blue-100 p-6 rounded-2xl shadow flex flex-col items-center">
            <span className="text-2xl text-blue-600 mb-2">💰</span>
            <span className="text-2xl font-bold text-blue-900">${totalSaved.toLocaleString()}</span>
            <span className="text-blue-800">Total Saved</span>
          </div>
          <div className="bg-purple-100 p-6 rounded-2xl shadow flex flex-col items-center">
            <span className="text-2xl text-purple-600 mb-2">%️</span>
            <span className="text-2xl font-bold text-purple-900">{percentAchieved}%</span>
            <span className="text-purple-800">% Achieved</span>
          </div>
        </div>
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

        <ChatbotFloating />
      </div>
    </div>
  );
}