<template>
    <div class="card-header">
      <div class="row">
        <div class="col"><div class="orderNumber">{{numOrder}}</div>
         
        </div>
        <div class="col badgeTypePosition">
          <span class="badge bg-info">{{ elementType }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    elementType: {
      type: String,
      required: true
    },
    numOrder: {
      type: [Number, String],
      default: null
    }
  });
  </script>
  
  <style scoped>
  .badgeTypePosition {
    text-align: right;
  }

  .card-header{
    background-color: #f0f3f5!important;
    border : 1px solid gainsboro
  }

  .orderNumber{
    color:black;
    border:1px solid gainsboro;
    width: fit-content;
    border-radius: 10px;
    padding-left : 10px;
    padding-right : 10px;
    background-color: #E5FC1A!important;
  }

  </style>