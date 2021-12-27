<script setup>
  import store from "./store";
  import Login from "./views/Login.vue";
  import Instructor from "./views/Instructor.vue";
  import Student from "./views/Student.vue";
</script>

<template>
  <div v-if="typeof(store.state.user) == 'undefined'" class="w-screen bg-gray-100 px-4 text-center">Loading</div>
  <login v-else-if="store.state.user == null" />
  <instructor v-else-if="store.state.user.instructor" />
  <student v-else />
</template>
