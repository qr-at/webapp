<script setup>
  import { ref } from "vue";
  import { query, collection, where, getDocs, addDoc } from "firebase/firestore";
  import store from "../store";
  import { db } from "../firebase";
  import AppBar from "../components/AppBar.vue";

  const getDateTime = () => {
    const d = new Date();
    return {
      day: d.getDay(),
      tsm: (d.getHours() * 60) + d.getMinutes(),
      date: d.getFullYear() + "-" + String((d.getMonth() + 1)).padStart(2, "0") + "-" + d.getDate(),
    };
  };

  const checkingIn = ref(false);
  const checkedIn = ref(false);
  const noClass = ref(false);

  const checkin = async () => {
    checkingIn.value = true;
    console.log("Checking you in...");
    try {
      let q, qsnap;
      // Check if they have already checked in
      const dt = getDateTime();
      q = query(
        collection(db, "checkins"),
        where("date", "==", dt.date),
        where("email", "==", store.state.user.email),
        where("section", "in", store.state.user.sections)
      );
      qsnap = await getDocs(q);
      if (!qsnap.empty) {
        store.actions.infoToast("You have already checked in.");
        checkedIn.value = true;
        return;
      }
      // Check if they have a class to check in to
      q = query(
        collection(db, "classes"),
        where("day", "==", dt.day),
        where("section", "in", store.state.user.sections)
      );
      qsnap = await getDocs(q);
      let ongoing = false;
      let curSection;
      qsnap.forEach(doc => {
        const data = doc.data();
        if (data.start <= dt.tsm && data.end >= dt.tsm) {
          ongoing = true;
          curSection = data.section;
        }
      });
      if (!ongoing) {
        store.actions.errorToast("Come back during your class.");
        noClass.value = true;
        return;
      }
      // Check them in
      await addDoc(
        collection(db, "checkins"),
        {
          date: dt.date,
          email: store.state.user.email,
          section: curSection,
          present: true,
          excused: false,
        }
      );
      store.actions.successToast("Successfully checked you in.");
      checkedIn.value = true;
    } catch (err) {
      store.actions.errorToast("Error. Please try again shortly.");
      console.log("CHECK IN ERROR")
      console.log(err);
    } finally {
      checkingIn.value = false;
    }
  };
</script>

<template>
  <app-bar />
  <main class="w-screen px-4">
    <h2 class="text-gray-500 text-center text-3xl font-light mb-6">Student</h2>

    <transition name="fade" mode="out-in">
      <div v-if="checkedIn" class="mx-auto w-full sm:1/2 md:w-1/4 bg-white shadow-lg rounded-lg py-4 px-6 text-center">
        You are checked in.
      </div>
      <div v-else-if="noClass" class="mx-auto w-full sm:1/2 md:w-1/4 bg-white shadow-lg rounded-lg py-4 px-6 text-center">
        Come back during your class. Email your professor if you forgot to check in.
      </div>
      <div v-else class="mx-auto w-full sm:1/2 md:w-1/4 bg-white shadow-lg rounded-lg py-4 px-6">
        <p class="text-center text-light tracking-tight">BUS104 EA</p>
        <!-- <p class="text-center text-light tracking-tight text-xs mb-4">Check-in window: 1:00 - 2:50</p> -->
        <button @click="checkin" class="mx-auto block bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-2 px-4 border border-purple-400 hover:border-transparent rounded duration-200">
          <span v-if="checkingIn">Loading!</span>
          <span v-else>Check in</span>
        </button>
      </div>
    </transition>
  </main>
</template>

<style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
