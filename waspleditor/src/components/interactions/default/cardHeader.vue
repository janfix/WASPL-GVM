<template>
    <div class="card-header">
      <div class="row">
        <div class="col-10">
          <label style="position:relative; margin-right: 30%;"> {{mode}} : {{ elementLabel }}</label>
        </div>
        <div class="col-2 badgeTypePosition">
          <span class="badge bg-info">{{ elementType }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    elementLabel: {
      type: String,
      required: true
    },
    elementType: {
      type: String,
      required: true
    }, mode:{
      type: String,
      required: true
    }
  });
  </script>
  
  <style scoped>
  .badgeTypePosition {
    text-align: right;
  }
  </style>