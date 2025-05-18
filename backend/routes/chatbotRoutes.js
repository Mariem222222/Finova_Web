const express = require("express");
const Chatbot = require("../chatbot.js"); // Chemin correct

const router = express.Router();

// Vérification de la clé API
if (!process.env.GEMINI_API_KEY) {
  throw new Error('API KEY manquante dans .env !');
}

const chatbot = new Chatbot(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question requise" });
  }

  try {
    const response = await chatbot.ask(question);
    res.status(200).json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur du serveur" });
  }
});

module.exports = router; // Export ES Module