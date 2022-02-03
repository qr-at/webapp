<script setup>
  import { ref } from "vue";
  import store from "../store";
  import AppBar from "../components/AppBar.vue";
  import ClassSearch from "../components/ClassSearch.vue";
  import StudentSearch from "../components/StudentSearch.vue";
  import StudentManagement from "../components/StudentManagement.vue";

  const activeTab = ref(0);
  const tabs = [
    "Class Search",
    "Student Management",
    "Student Search",
  ];

  const naviagteToTab = (tab) => {
    if (tab === 2 && !store.state.student) {
      store.actions.errorToast("You must first select a student.");
      return;
    }
    activeTab.value = tab;
  };
</script>

<template>
  <app-bar />
  <main class="w-screen px-4">
    <ul class="flex justify-center items-center my-4">
      <li
        v-for="(tab, index) in tabs"
        :key="index"
        class="cursor-pointer py-2 px-4 text-gray-500 border-b-8 select-none duration-200"
        :class="activeTab===index ? 'text-purple-500 border-purple-500' : ''"
        @click="() => naviagteToTab(index)"
      >
        {{ tab }}
      </li>
    </ul>

    <class-search v-if="activeTab===0" />
    <student-management v-else-if="activeTab===1" />
    <student-search v-else />
  </main>
</template>
