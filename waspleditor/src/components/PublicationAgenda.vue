<template>
    <div class="dashbordBlock">
      <NotificationBell :count="4" @click="handleBellClick" />
      <span class="AgendaBigTitle">📅 Assessment Agenda – {{ upcomingCount }} Upcoming | {{ ongoingCount }} Running</span>
    </div>
  
    <section class="evaluation-agenda">
      <ul class="agenda-list">
        <li
          v-for="pub in sortedPublications"
          :key="pub._id"
          class="agenda-item"
        >
          <span class="agenda-date">{{ formatDate(pub.startingDate) }}</span>
          <span class="agenda-title">
            {{ pub.publicationName || 'Sans titre' }} –{{ pub.testId?.title || 'Sans titre' }} – {{ pub.groupId?.groupName || 'Sans groupe' }}
          </span>
          <span
            class="agenda-status"
            :class="getStatusClass(pub)"
          >
            {{ getStatusLabel(pub) }}
          </span>
          <span class="agenda-count">
            👥 {{ pub.connectedStudentsCount }}
          </span>
        </li>
      </ul>
    </section>
  </template>
  
  <script setup>
  import { onMounted, ref, computed } from 'vue';
  import api from '@/services/axios.js';
  import NotificationBell from '@/components/dashboard/NotificationBell.vue'


const handleBellClick = () => {
    console.log('Cloche cliquée !')
}

  
  const publications = ref([]);
  
  const fetchPublications = async () => {
    try {
      const res = await api.get(import.meta.env.VITE_API_BASE_URL + '/api/publications');
      publications.value = res.data.data || [];
    } catch (err) {
      console.error('Erreur de récupération des publications :', err);
    }
  };
  
  onMounted(fetchPublications);
  
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  
  const getStatusLabel = (pub) => {
    const now = new Date();
    const start = new Date(pub.startingDate);
    const end = new Date(pub.endDate);
    if (now < start) return 'À venir';
    if (now >= start && now <= end) return 'En cours';
    return 'Terminée';
  };
  
  const getStatusClass = (pub) => {
    const label = getStatusLabel(pub);
    return {
      upcoming: label === 'À venir',
      ongoing: label === 'En cours',
    };
  };
  
  const upcomingCount = computed(() =>
    publications.value.filter((p) => getStatusLabel(p) === 'À venir').length
  );
  const ongoingCount = computed(() =>
    publications.value.filter((p) => getStatusLabel(p) === 'En cours').length
  );
  
const sortedPublications = computed(() => {
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  return publications.value
    .filter((pub) => {
      const end = new Date(pub.endDate);
      // Garder si la publication n’est pas terminée, ou si elle est terminée depuis moins d’une semaine
      return end >= oneWeekAgo;
    })
    .sort((a, b) => new Date(a.startingDate) - new Date(b.startingDate));
});

  </script>
  
  <style scoped>
  .evaluation-agenda {
    border-radius: 0.5rem;
    max-height: 250px;
    overflow-y: auto;
    font-size: 0.9rem;
  }
  
  .agenda-title {
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
  }
  
  .agenda-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .agenda-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-left: 4px solid #0d6efd;
    background-color: #f8f9fa;
    margin-bottom: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    gap: 0.75rem;
  }
  
  .agenda-date {
    font-weight: 500;
    color: #555;
    min-width: 90px;
  }
  
  .agenda-title {
    flex-grow: 1;
    color: #000;
  }
  
  .agenda-status {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: bold;
    white-space: nowrap;
  }
  
  .agenda-status.ongoing {
    background-color: #ffe08a;
    color: #856404;
  }
  
  .agenda-status.upcoming {
    background-color: #d1e7dd;
    color: #0f5132;
  }
  
  .agenda-count {
    font-size: 0.75rem;
    color: #333;
  }
  .agendaBigTitle{
    font-size: 2rem!important;
  }
  </style>
  