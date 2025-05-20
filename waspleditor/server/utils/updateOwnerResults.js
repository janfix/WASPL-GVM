import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Result from '../models/results.js';

dotenv.config({ path: '.env.local' }); // Utilise .env.local (ou adapte si besoin)

// 🧠 Remplace par l'ObjectId réel de ton user par défaut (admin par exemple)
const defaultOwnerId = new mongoose.Types.ObjectId("67e1480c63b5135f20abaa7c");

async function updateResultsWithOwner() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await Result.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: defaultOwnerId } }
    );

    console.log(`✅ ${result.modifiedCount} résultat(s) mis à jour avec owner = ${defaultOwnerId}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des résultats :', error.message);
  }
}

updateResultsWithOwner();
