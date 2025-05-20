import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/groupModel.js'; // 🔁 adapte le chemin si nécessaire

dotenv.config({ path: '.env.local' }); // ou '.env' selon ton usage

// 🛠️ À adapter avec l'_id réel d'un utilisateur existant dans ta base
const defaultOwnerId = new mongoose.Types.ObjectId("67e1480c63b5135f20abaa7c");

async function updateGroupsWithOwner() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await Group.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: defaultOwnerId } }
    );

    console.log(`✅ ${result.modifiedCount} groupe(s) mis à jour avec owner = ${defaultOwnerId}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des groupes :', error.message);
  }
}

updateGroupsWithOwner();
