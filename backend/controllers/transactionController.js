const Transaction = require("../models/Transaction");

const addTransaction = async (req, res) => {
  try {
    const { description, amount, type, category, dateTime, isRecurring, interval } = req.body;

    if (!req.user || !req.user.userId) {
      console.error("User ID is missing in the request.");
      return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }

    console.log("Adding transaction for user ID:", req.user.userId); // Debug log

    const transaction = new Transaction({
      description,
      amount,
      type,
      category,
      dateTime,
      userId: req.user.userId, // Use the userId from the token
      isRecurring: isRecurring || false,
      interval: isRecurring ? interval : undefined,
      nextRun: isRecurring ? calculateNextRun(dateTime, interval) : undefined,
      active: isRecurring ? true : undefined
    });

    console.log("Transaction to be saved:", transaction); // Debug log

    const savedTransaction = await transaction.save();
    console.log("Transaction saved to database:", savedTransaction); // Debug log

    res.status(201).json({ message: "Transaction added successfully", transaction: savedTransaction });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Failed to add transaction", details: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId; // Use userId from req.user
    if (!userId) {
      console.error("User ID is missing in the request.");
      return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }

    console.log("Fetching transactions for user ID:", userId); // Debug log

    const transactions = await Transaction.find({ userId }); // Use userId from req.user
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions", details: error.message });
  }
};

// Helper function to calculate nextRun date based on interval
const calculateNextRun = (dateTime, interval) => {
  const date = new Date(dateTime);
  switch (interval) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return undefined;
  }
  return date;
};

module.exports = { addTransaction, getTransactions };

