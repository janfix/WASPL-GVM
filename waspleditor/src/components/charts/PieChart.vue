<script setup>
import { Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { computed } from 'vue';

// Enregistrement des composants Chart.js
ChartJS.register(Title, Tooltip, Legend, ArcElement);

// Props attendues
const props = defineProps({
  connected: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
});

// Données dynamiques du graphique
const chartData = computed(() => ({
  labels: ['Yes', 'No'],
  datasets: [{
    data: [
      props.connected,
      Math.max(props.total - props.connected, 0)
    ],
    backgroundColor: ['#42b883', '#ddd'],
    borderWidth: 1
  }]
}));

// Options dynamiques du graphique
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    title: {
      display: !!props.title,
      text: props.title,
      font: {
        size: 16,
        weight: 'bold'
      },
      padding: {
        top: 10,
        bottom: 20
      }
    }
  }
}));
</script>

<template>
  <div style="width: 100%; height: 250px;">
    <Pie :data="chartData" :options="chartOptions" />
  </div>
</template>
