<script setup>
  import store from "../store";
</script>

<template>
  <div class="w-screen bg-gray-700 px-4 shadow-sm flex justify-between p-2 mb-6">
    <h1 class="font-semibold text-3xl tracking-tight text-blue-400">QR <span class="text-purple-400">@</span></h1>
    <button @click="store.actions.logout" class="rounded-lg text-sm font-semibold px-4 py-2 border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-red-100 duration-200">
      Log out
    </button>
  </div>
</template>