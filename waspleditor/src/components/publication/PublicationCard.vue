<template>
    <div class="row">
        <hr>
       <h5> Active Publication : {{ publication.publicationName }}</h5>

    </div>
    <div class="publication-card">
      <div class="sidebar">
        <ul>
            <li
            :class="{ active: activeTab === 'editor' }"
            @click="setActiveTab('editor')"
          >
            Editor
          </li>
            <li
            :class="{ active: activeTab === 'monitor' }"
            @click="setActiveTab('monitor')"
          >
            Monitor
          </li>
          <li
            :class="{ active: activeTab === 'results' }"
            @click="setActiveTab('results')"
          >
            Results
          </li>
          
        </ul>
      </div>
      <div class="content">
        <PublicationMonitor
          v-if="activeTab === 'monitor'"
          :publication="publication"
        />
        <PublicationResults
          v-if="activeTab === 'results'"
          :publication="publication"
        />
        <PublicationEditor
          v-if="activeTab === 'editor'"
          :publication="publication"
        />
      </div>
    </div>
  </template>
  
  <script>
  import PublicationMonitor from './PublicationMonitor.vue';
  import PublicationResults from './PublicationResult.vue';
  import PublicationEditor from './PublicationEditor.vue';
  
  export default {
    name: 'PublicationCard',
    props: {
      publication: {
        type: Object,
        required: true,
      },
    },
    components: {
      PublicationMonitor,
      PublicationResults,
      PublicationEditor,
    },
    data() {
      return {
        activeTab: 'editor', // Default tab
      };
    },
    methods: {
      setActiveTab(tab) {
        this.activeTab = tab;
      },
    },
  };
  </script>
  
  <style scoped>
  .publication-card {
   
    display: flex;
    border : gainsboro 1px solid;
  }
  .sidebar {
    margin-left:-20px;
    width: 180px;
    background-color: #f8f9fa;
    padding: 1rem;
    border-right: 1px solid #ddd;
  }
  .sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .sidebar ul li {
    padding: 10px;
    cursor: pointer;
  }
  .sidebar ul li.active {
    font-weight: bold;
    color: #007bff;
  }
  .content {
    flex: 1;
    padding: 1rem;
  }
  </style>
  