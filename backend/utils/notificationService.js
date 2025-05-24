// checkGoalProgressAndNotify.js
require('dotenv').config();
const SavingsGoal = require('../models/SavingsGoal');
const User = require('../models/User');
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");

// Connexion DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_portefeuille');

// Fonction locale d'envoi d'email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Finova" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✉ Email envoyé à ${to}`);
  } catch (err) {
    console.error('❌ Error sending email:', err);
    throw new Error('Failed to send email');
  }
}

// Template HTML commun
const createNotificationHTML = (title, message) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #0056b3;">${title}</h2>
    <p style="font-size: 16px; line-height: 1.5;">${message}</p>
    <hr style="border: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #666; font-size: 12px;">
      Ce message a été envoyé automatiquement. Merci de ne pas y répondre.
    </p>
  </div>
`;

async function checkGoalProgressAndNotify() {
  try {    console.log('🚀 Démarrage de la vérification des objectifs...');
    const goals = await SavingsGoal.find({ status: { $ne: 'deleted' } }).populate('userId');
    console.log(`🔍 ${goals.length} objectifs analysés`);
    
    if (goals.length === 0) {
      console.log('❌ Aucun objectif trouvé dans la base de données');
      return;
    }

    for (const goal of goals) {
      const user = goal.userId;
      if (!user) {
        console.warn(`⚠️ Objectif orphelin ${goal._id}`);
        continue;
      }

      const daysRemaining = Math.ceil((goal.targetDate - Date.now()) / (86400000));
      const progress = (goal.currentAmount / goal.targetAmount * 100).toFixed(2);

      // Notification 30 jours
      if (daysRemaining <= 30 && !goal.notified30Days) {
        await sendEmail(
          user.email,
          `📅 Rappel objectif "${goal.name}"`,
          createNotificationHTML(
            `Plus que ${daysRemaining} jours !`,
            `Votre objectif "${goal.name}" (${progress}% atteint) arrive à échéance dans ${daysRemaining} jours.`
          )
        );
        goal.notified30Days = true;
      }      // Notification accompli
      if ((goal.currentAmount >= goal.targetAmount || Date.now() > goal.targetDate) && !goal.closedNotified) {
        console.log(`🎯 Objectif "${goal.name}" atteint pour l'utilisateur ${user.email}`);
        console.log(`   Montant actuel: ${goal.currentAmount}€ / Objectif: ${goal.targetAmount}€`);
        console.log(`   Date actuelle: ${new Date().toISOString()} / Date cible: ${new Date(goal.targetDate).toISOString()}`);
        
        try {
          await sendEmail(
            user.email,
            `🎉 Objectif "${goal.name}" atteint !`,
            createNotificationHTML(
              'Félicitations !',
              `Vous avez atteint votre objectif d'épargne "${goal.name}" (${goal.targetAmount}€).`
            )
          );
          console.log(`✅ Email envoyé avec succès à ${user.email}`);
          goal.closedNotified = true;
        } catch (emailError) {
          console.error(`❌ Erreur lors de l'envoi de l'email:`, emailError);
        }
      }

      await goal.save();
    }
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

// Exécution directe en mode CLI
if (require.main === module) {
  checkGoalProgressAndNotify()
    .then(() => mongoose.disconnect())
    .catch(err => {
      console.error('🔥 Erreur critique:', err);
      process.exit(1);
    });
}

// Ajoutez en fin de fichier
module.exports = { 
  checkGoalProgressAndNotify,
  createNotificationHTML,
  sendEmail
};