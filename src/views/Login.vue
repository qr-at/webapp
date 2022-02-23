<script setup>
  import store from "../store";
</script>

<template>
  <main class="min-h-screen w-screen py-32 px-4 text-center">
    <h1 class="text-5xl font-bold text-blue-400 mb-2">QR <span class="text-purple-400">@</span></h1>
    <p class="text-gray-700 text-lg mb-6">Attendance tracking system!</p>
    <button @click="store.actions.login" class="rounded-lg text-sm font-semibold px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-red-100 duration-200">
      Log in with Google
    </button>
  </main>
</template>
