const { GoogleGenerativeAI } = require("@google/generative-ai");

class Chatbot {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async ask(question) {
    try {
      const result = await this.model.generateContent(question);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("API Error:", error);
      return "Sorry, I couldn't process your request at the moment.";
    }
  }
}

module.exports = Chatbot; // Export CommonJS