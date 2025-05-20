import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Publication from '../models/publicationModel.js';

dotenv.config({ path: '.env.local' }); // Ou '.env' selon ton environnement

// 🛠️ À adapter avec l'_id d'un utilisateur existant dans ta base
const defaultOwnerId = new mongoose.Types.ObjectId("67e1480c63b5135f20abaa7c");

async function updatePublicationsWithOwner() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await Publication.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: defaultOwnerId } }
    );

    console.log(`✅ ${result.modifiedCount} publication(s) mises à jour avec owner = ${defaultOwnerId}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des publications :', error.message);
  }
}

updatePublicationsWithOwner();
