// src/utils/diagnostics.js - Version simplifiée pour usage avec le composant

import { jwtDecode } from 'jwt-decode'
import api from '@/api'

// Fonction diagnostic rapide pour la console
export async function quickDiagnostic() {
  console.log('=== DIAGNOSTIC RAPIDE PUBLICATIONS ===')
  
  try {
    // 1. Token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('❌ Aucun token trouvé')
      return
    }
    
    const decoded = jwtDecode(token)
    console.log('✅ User:', decoded.firstname, decoded.lastname)
    console.log('✅ User ID:', decoded._id || decoded.sub)
    
    // 2. Test API publications
    const response = await api.get('/publications')
    console.log(`✅ API Publications: ${response.status}`)
    console.log(`✅ Données reçues:`, response.data)
    console.log(`✅ Nombre: ${Array.isArray(response.data) ? response.data.length : 'Non-array'}`)
    
    return {
      success: true,
      publicationsCount: Array.isArray(response.data) ? response.data.length : 0,
      data: response.data
    }
    
  } catch (error) {
    console.error('❌ Diagnostic échoué:', error)
    return { success: false, error: error.message }
  }
}

// Export pour usage global
if (typeof window !== 'undefined') {
  window.quickDiagnostic = quickDiagnostic
  console.log('💡 Fonction disponible: quickDiagnostic()')
}