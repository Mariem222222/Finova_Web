const SavingsGoal = require("../models/SavingsGoal");
const {checkGoalProgressAndNotify} = require("../utils/notificationService");
const { createNotificationHTML, sendEmail } = require("../utils/notificationService");

const processOldestGoal = async () => {
  try {
    const oldestGoal = await SavingsGoal.findOne({ status: 'pending' })
      .sort({ createdAt: 1 })
      .populate('userId');

    if (!oldestGoal) return;

    const now = new Date();
    const isAchieved = oldestGoal.currentAmount >= oldestGoal.targetAmount;
    const isExpired = now > oldestGoal.targetDate;

    if (isAchieved || isExpired) {
      // Envoyer notification finale
      await sendGoalCompletionNotification(oldestGoal, isAchieved);
      
      // Supprimer l'objectif
      await SavingsGoal.findByIdAndDelete(oldestGoal._id);
    }
  } catch (error) {
    console.error("Error processing goal:", error);
  }
};

const sendGoalCompletionNotification = async (goal, isAchieved) => {
  try {
    const user = await User.findById(goal.userId);
    if (!user?.email) return;

    const subject = isAchieved 
      ? `🎉 Objectif "${goal.name}" atteint !`
      : `⚠️ Objectif "${goal.name}" expiré`;

    const message = isAchieved
      ? `Vous avez atteint votre objectif d'épargne "${goal.name}" (${goal.targetAmount}€).`
      : `Votre objectif "${goal.name}" n'a pas été atteint à temps.`;

    await sendEmail(
      user.email,
      subject,
      createNotificationHTML(
        isAchieved ? 'Félicitations !' : 'Objectif expiré',
        message
      )
    );

    console.log(`Notification FIFO envoyée pour: ${goal._id}`);

  } catch (error) {
    console.error("Erreur notification FIFO:", error);
    throw error;
  }
};

module.exports = { processOldestGoal };