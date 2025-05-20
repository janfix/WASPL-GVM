<template>

<table class="table table-sm">
  <thead>
    <tr>
      <th>#</th>
      <th>Type</th>
      <th>Name</th>
      <th>Score</th>
      <th>Sticker</th>
    </tr>
  </thead>
  <tbody>
    <tr
      v-for="(zone, index) in zones"
      :key="zone.id"
      :class="{ 'table-primary': zone.id === selectedZoneId }"
      @click="$emit('select-zone', zone.id)"
    >
      <td>{{ index + 1 }}</td>
      <td>{{ zone.type }}</td>
      <td>
        <input
          class="form-control form-control-sm"
          v-model="zone.name"
          :placeholder="'(zone name)'"
          @click.stop
        />
      </td>
      <td>
        <input
          type="number"
          class="form-control form-control-sm"
          v-model.number="zone.score"
          @click.stop
        />
      </td>
      <td>
        <input
          type="text"
          maxlength="2"
          class="form-control form-control-sm text-center"
          v-model="zone.sticker"
          placeholder="🙂"
          @click.stop
        />
      </td>
    </tr>
  </tbody>
</table>

  </template>
  
  <script setup>
  const props = defineProps({
    zones: Array,
    selectedZoneId: String,
    stickerZone: Object,
  })
  defineEmits(['select-zone'])

  console.log(props.stickerZone)
  </script>
  
  <style scoped>
  .table-primary {
    font-weight: bold;
  }
  </style>
  