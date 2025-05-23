<!-- src/components/DebugPanel.vue -->
<template>
  <div v-if="shouldShow" class="debug-panel">
    <!-- Bouton flottant pour ouvrir/fermer -->
    <button 
      @click="togglePanel" 
      class="debug-toggle-btn"
      :class="{ 'panel-open': panelOpen }"
    >
      🔍 {{ panelOpen ? 'Fermer' : 'Debug' }}
    </button>

    <!-- Panel de diagnostic -->
    <div v-if="panelOpen" class="debug-content" @click.stop>
      <div class="debug-header">
        <h4>🔍 Diagnostic Publications</h4>
        <button @click="closePanel" class="close-btn">&times;</button>
      </div>

      <div class="debug-body">
        <!-- Actions rapides -->
        <div class="debug-actions">
          <button @click="runFullDiagnostic" :disabled="isRunning" class="btn-diagnostic">
            {{ isRunning ? '⏳ En cours...' : '🔍 Diagnostic complet' }}
          </button>
          <button @click="testApiOnly" class="btn-api">
            🌐 Test API uniquement
          </button>
          <button @click="checkAuthOnly" class="btn-auth">
            🔐 Vérifier Auth
          </button>
        </div>

        <!-- Résultats en temps réel -->
        <div v-if="diagnosticResults" class="debug-results">
          <h5>📊 Résultats :</h5>
          
          <!-- Status Auth -->
          <div class="result-section">
            <h6>🔐 Authentification</h6>
            <div class="status-grid">
              <span class="status-item" :class="diagnosticResults.auth?.hasUser ? 'status-ok' : 'status-error'">
                User: {{ diagnosticResults.auth?.hasUser ? '✅' : '❌' }}
              </span>
              <span class="status-item" :class="diagnosticResults.auth?.hasToken ? 'status-ok' : 'status-error'">
                Token: {{ diagnosticResults.auth?.hasToken ? '✅' : '❌' }}
              </span>
              <span class="status-item">
                ID: {{ diagnosticResults.auth?.userId || 'N/A' }}
              </span>
            </div>
          </div>

          <!-- Status API -->
          <div class="result-section">
            <h6>🌐 API</h6>
            <div v-for="(result, endpoint) in diagnosticResults.api" :key="endpoint" class="api-result">
              <strong>{{ endpoint }}:</strong>
              <span :class="result.ok ? 'status-ok' : 'status-error'">
                {{ result.status }} {{ result.ok ? '✅' : '❌' }}
              </span>
              <span v-if="result.count !== undefined" class="count-badge">
                {{ result.count }} éléments
              </span>
            </div>
          </div>

          <!-- Environnement -->
          <div class="result-section">
            <h6>⚙️ Environnement</h6>
            <div class="env-info">
              <div>Mode: <strong>{{ diagnosticResults.environment?.MODE }}</strong></div>
              <div>API URL: <strong>{{ diagnosticResults.environment?.VITE_API_URL || 'Par défaut' }}</strong></div>
            </div>
          </div>

          <!-- Erreurs -->
          <div v-if="diagnosticResults.errors?.length > 0" class="result-section error-section">
            <h6>❌ Erreurs détectées</h6>
            <ul class="error-list">
              <li v-for="error in diagnosticResults.errors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>

        <!-- Logs en direct -->
        <div class="debug-logs">
          <h6>📝 Logs (derniers {{ logs.length }})</h6>
          <div class="logs-container">
            <div v-for="(log, index) in logs.slice(-10)" :key="index" 
                 class="log-entry" :class="`log-${log.type}`">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>

        <!-- Actions avancées -->
        <div class="debug-advanced">
          <details>
            <summary>🔧 Actions avancées</summary>
            <div class="advanced-actions">
              <button @click="exportLogs" class="btn-export">💾 Exporter logs</button>
              <button @click="clearLogs" class="btn-clear">🗑️ Vider logs</button>
              <button @click="forceRefreshPublications" class="btn-refresh">🔄 Forcer reload</button>
            </div>
          </details>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div v-if="panelOpen" class="debug-overlay" @click="closePanel"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import api from '@/api'

// Props
const props = defineProps({
  publications: {
    type: Array,
    default: () => []
  },
  forceShow: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['refresh-publications'])

// État du composant
const panelOpen = ref(false)
const isRunning = ref(false)
const diagnosticResults = ref(null)
const logs = ref([])

const route = useRoute()

// Computed
const shouldShow = computed(() => {
  return (
    props.forceShow ||
    import.meta.env.DEV ||
    route.query.debug === 'true' ||
    props.publications.length === 0 ||
    // Force l'affichage si variable d'environnement debug
    import.meta.env.VITE_DEBUG_MODE === 'true' ||
    // Force l'affichage si localStorage contient le flag debug
    localStorage.getItem('debug-mode') === 'true'
  )
})

// Méthodes de logging
const addLog = (message, type = 'info') => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
}

// Actions du panel
const togglePanel = () => {
  panelOpen.value = !panelOpen.value
  if (panelOpen.value && !diagnosticResults.value) {
    // Auto-lancer un diagnostic léger à l'ouverture
    checkAuthOnly()
  }
}

const closePanel = () => {
  panelOpen.value = false
}

// Diagnostic complet
const runFullDiagnostic = async () => {
  if (isRunning.value) return
  
  isRunning.value = true
  diagnosticResults.value = {
    timestamp: new Date().toISOString(),
    environment: {},
    auth: {},
    api: {},
    storage: {},
    errors: []
  }
  
  addLog('🚀 Début du diagnostic complet', 'info')
  
  try {
    // 1. Environnement
    diagnosticResults.value.environment = {
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      BASE_URL: import.meta.env.BASE_URL
    }
    addLog('✅ Environnement collecté', 'success')
    
    // 2. Authentification
    await checkAuthOnly()
    
    // 3. Test API
    await testApiOnly()
    
    // 4. Stockage
    diagnosticResults.value.storage = {
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
      hasTokenInStorage: !!(localStorage.getItem('token') || sessionStorage.getItem('token'))
    }
    addLog('✅ Stockage analysé', 'success')
    
    addLog('🏁 Diagnostic terminé', 'success')
    
  } catch (error) {
    addLog(`❌ Erreur diagnostic: ${error.message}`, 'error')
    diagnosticResults.value.errors.push(`Diagnostic error: ${error.message}`)
  } finally {
    isRunning.value = false
  }
}

// Test authentification uniquement
const checkAuthOnly = async () => {
  addLog('🔐 Vérification authentification...', 'info')
  
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      diagnosticResults.value.auth = { hasToken: false, hasUser: false }
      addLog('❌ Aucun token trouvé', 'error')
      return
    }
    
    const decoded = jwtDecode(token)
    diagnosticResults.value.auth = {
      hasToken: true,
      hasUser: !!(decoded.firstname && decoded.lastname),
      userId: decoded._id || decoded.sub,
      userEmail: decoded.email,
      userName: `${decoded.firstname || ''} ${decoded.lastname || ''}`.trim()
    }
    
    addLog(`✅ Auth OK - User: ${diagnosticResults.value.auth.userName}`, 'success')
    
  } catch (error) {
    diagnosticResults.value.auth = { hasToken: false, hasUser: false, error: error.message }
    addLog(`❌ Erreur auth: ${error.message}`, 'error')
  }
}

// Test API uniquement
const testApiOnly = async () => {
  addLog('🌐 Test des API...', 'info')
  
  if (!diagnosticResults.value.api) {
    diagnosticResults.value.api = {}
  }
  
  const endpoints = ['/publications', '/tests']
  const token = localStorage.getItem('token')
  
  for (const endpoint of endpoints) {
    try {
      addLog(`🔄 Test ${endpoint}...`, 'info')
      
      const response = await api.get(endpoint)
      
      diagnosticResults.value.api[endpoint] = {
        status: response.status,
        ok: response.status >= 200 && response.status < 300,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        count: Array.isArray(response.data) ? response.data.length : null
      }
      
      addLog(`✅ ${endpoint}: ${response.status} - ${diagnosticResults.value.api[endpoint].count || 0} éléments`, 'success')
      
    } catch (error) {
      diagnosticResults.value.api[endpoint] = {
        status: error.response?.status || 0,
        ok: false,
        error: error.message
      }
      
      addLog(`❌ ${endpoint}: ${error.message}`, 'error')
      if (!diagnosticResults.value.errors) diagnosticResults.value.errors = []
      diagnosticResults.value.errors.push(`API ${endpoint}: ${error.message}`)
    }
  }
}

// Actions avancées
const exportLogs = () => {
  const logData = {
    timestamp: new Date().toISOString(),
    diagnostic: diagnosticResults.value,
    logs: logs.value
  }
  
  const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  addLog('💾 Logs exportés', 'info')
}

const clearLogs = () => {
  logs.value = []
  addLog('🗑️ Logs vidés', 'info')
}

const forceRefreshPublications = () => {
  addLog('🔄 Forçage du rechargement des publications...', 'info')
  emit('refresh-publications')
}

// Auto-diagnostic si erreur détectée
onMounted(() => {
  // Rendre disponible globalement avec protection d'erreur
  window.debugPanel = {
    runDiagnostic: runFullDiagnostic,
    testApi: testApiOnly,
    checkAuth: checkAuthOnly,
    showPanel: () => { panelOpen.value = true },
    // Méthodes d'activation d'urgence
    forceShow: () => {
      localStorage.setItem('debug-mode', 'true')
      location.reload()
    },
    hide: () => {
      localStorage.removeItem('debug-mode')
      panelOpen.value = false
    }
  }
  
  // Protection contre les erreurs de console
  window.activateDebug = () => {
    try {
      localStorage.setItem('debug-mode', 'true')
      console.log('🔧 Mode debug activé - Rechargez la page')
      return 'Mode debug activé - Rechargez la page'
    } catch (e) {
      console.error('Erreur activation debug:', e)
      return 'Erreur activation debug'
    }
  }
  
  window.quickDebug = async () => {
    try {
      console.log('=== DEBUG RAPIDE ===')
      const token = localStorage.getItem('token')
      console.log('Token présent:', !!token)
      
      if (token) {
        const decoded = jwtDecode(token)
        console.log('User:', decoded.firstname, decoded.lastname)
      }
      
      console.log('Publications:', props.publications.length)
      console.log('URL actuelle:', window.location.href)
      console.log('Environnement:', import.meta.env.MODE)
      
      return 'Debug terminé - Vérifiez la console'
    } catch (e) {
      console.error('Erreur debug rapide:', e)
      return 'Erreur debug rapide'
    }
  }
  
  // Raccourci clavier : Ctrl+Shift+D
  const handleKeyboard = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      localStorage.setItem('debug-mode', 'true')
      panelOpen.value = true
      addLog('🔧 Debug activé via raccourci clavier', 'info')
    }
  }
  
  document.addEventListener('keydown', handleKeyboard)
  
  // Nettoyage
  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyboard)
  }
  
  // Auto-ouvrir si debug dans URL
  if (route.query.debug === 'true') {
    panelOpen.value = true
    setTimeout(runFullDiagnostic, 1000)
  }
  
  // Auto-ouvrir si flag localStorage
  if (localStorage.getItem('debug-mode') === 'true') {
    panelOpen.value = true
    setTimeout(runFullDiagnostic, 500)
  }
  
  addLog('🔧 Panel de diagnostic initialisé', 'info')
  console.log('🔧 Debug panel ready. Use: activateDebug() or quickDebug() or Ctrl+Shift+D')
  
  return cleanup
})
</script>

<style scoped>
.debug-panel {
  position: fixed;
  z-index: 9999;
}

.debug-toggle-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.debug-toggle-btn:hover {
  background: #c82333;
  transform: scale(1.05);
}

.debug-toggle-btn.panel-open {
  background: #28a745;
}

.debug-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.debug-content {
  position: fixed;
  top: 50px;
  right: 10px;
  width: 400px;
  max-height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  overflow: hidden;
  z-index: 9999;
}

.debug-header {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-header h4 {
  margin: 0;
  font-size: 16px;
  color: #495057;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
}

.debug-body {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.debug-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.debug-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
}

.btn-diagnostic {
  background: #007bff;
  color: white;
}

.btn-api {
  background: #17a2b8;
  color: white;
}

.btn-auth {
  background: #28a745;
  color: white;
}

.debug-results {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.result-section {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.result-section h6 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #495057;
}

.status-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-item {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.status-ok {
  background: #d4edda;
  color: #155724;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.api-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.count-badge {
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.env-info div {
  font-size: 11px;
  margin: 2px 0;
}

.error-section {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.error-list {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #721c24;
}

.debug-logs {
  margin-bottom: 16px;
}

.logs-container {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
}

.log-entry {
  display: flex;
  gap: 8px;
  font-size: 10px;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}

.log-time {
  color: #6c757d;
  font-weight: bold;
  min-width: 60px;
}

.log-message {
  flex: 1;
}

.log-success .log-message {
  color: #28a745;
}

.log-error .log-message {
  color: #dc3545;
}

.log-info .log-message {
  color: #17a2b8;
}

.debug-advanced {
  border-top: 1px solid #dee2e6;
  padding-top: 12px;
}

.advanced-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.advanced-actions button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}

.btn-export {
  background: #6c757d;
  color: white;
}

.btn-clear {
  background: #ffc107;
  color: #212529;
}

.btn-refresh {
  background: #17a2b8;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .debug-content {
    width: 95vw;
    right: 2.5vw;
    max-height: 90vh;
  }
}
</style>