<script setup>
  import store from "./store";
  import Login from "./views/Login.vue";
  import AppBar from "./components/AppBar.vue";
</script>

<template>
  <div v-if="typeof(store.state.user) == 'undefined'" class="min-h-screen w-screen bg-gray-100 px-4 text-center">Loading</div>
  <login v-else-if="store.state.user == null" />
  <div v-else class="min-h-screen w-screen bg-gray-100">
    <app-bar />
    <p>
      {{ store.state.user }}
    </p>
  </div>
</template>
