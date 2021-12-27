<script setup>
  import store from "./store";
  import Login from "./views/Login.vue";
</script>

<template>
  <div v-if="typeof(store.state.user) == 'undefined'" class="min-h-screen w-screen bg-gray-100 px-4 text-center">Loading</div>
  <login v-else-if="store.state.user == null" />
  <div v-else class="min-h-screen w-screen bg-gray-100 px-4 text-center">
    <p>
      {{ store.state.user }}
    </p>
    <button @click="store.actions.logout" class="rounded-lg text-sm font-semibold px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-red-100 duration-200">
      Log out
    </button>
  </div>
</template>
