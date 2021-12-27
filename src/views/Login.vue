<script setup>
  const login = async () => {
    console.log("Logging you in!");
  };
</script>

<template>
  <main class="min-h-screen w-screen bg-gray-100 py-32 px-4 text-center">
    <h1 class="text-5xl font-bold text-blue-700 mb-2">QR <span class="text-purple-400">@</span></h1>
    <p class="text-gray-700 text-lg mb-6">Attendance tracking for classes taught by Joshua Ferris!</p>
    <button @click="login" class="rounded-lg text-sm font-semibold px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-red-100 duration-200">
      Log in with Google
    </button>
  </main>
</template>
