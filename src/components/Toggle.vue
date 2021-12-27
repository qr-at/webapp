<template>
  <div @click="$emit('toggle')" class="w-8 h-5 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out" :class="{ 'bg-green-400': status}">
    <div class="bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out" :class="{ 'translate-x-3': status}"></div>
  </div>
</template>

<script setup>
  const props = defineProps({
    status: Boolean,
  });
</script>
