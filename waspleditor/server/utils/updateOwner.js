import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Test from '../models/TestModel.js'; // adapte si besoin

dotenv.config({ path: '.env.local' });

const defaultOwnerId = new mongoose.Types.ObjectId("67e1480c63b5135f20abaa7c");

async function updateTestsWithOwner() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await Test.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: defaultOwnerId } }
    );

    console.log(`✅ ${result.modifiedCount} test(s) updated with owner.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur de mise à jour :', error);
  }
}

updateTestsWithOwner();
