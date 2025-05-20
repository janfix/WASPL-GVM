import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' })

export const initDefaultAdmin = async () => {
  try {
    const existing = await User.findOne({ username: "admin" })
    if (existing) {
      console.log('✅ Admin déjà existant, aucune action nécessaire.')
      return
    }

    const hashedPassword = await bcrypt.hash('password', 10)

    const admin = new User({
      username: "admin",
      firstName: 'Admin',
      lastName: 'WASPL',
      email: 'admin@waspl.local',
      password: hashedPassword,
      role: 'Admin',
      notification: true,
      language: 'English',
      institution: 'Wiquid',
      subjects: ['Math', 'Science'],
      domains: ['Physics', 'Biology'],
      grades: ['Grade 9'],
      ISCED: '3',
      reportOptions: 'PDF',
      AIConnectPrefs: {
        mode: 'auto',
        level: 'high'
      }
    })

    await admin.save()
    console.log('✅ Admin par défaut initialisé avec succès.')
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation de l\'admin :', err.message)
  }
}
