<script setup>
  import { ref, onMounted } from "vue";
  import { query, collection, where, getDocs } from "firebase/firestore";
  import { db } from "../firebase";
  import store from "../store";
  
  const loading = ref(false);

  const fetchAttendance = async () => {
    try {
      loading.value = true;
      store.mutations.setStudentAttendance(null);
      let attendance = [];
      const q = query(
        collection(db, "checkins"),
        where("email", "==", store.state.student.email)
      );
      const qsnap = await getDocs(q);
      qsnap.forEach(doc => {
        const { date, excused, present } = doc.data();
        const jDate = new Date(date+"T12:00:00");
        console.log(jDate);
        attendance.push({ date: jDate, excused, present });
      });
      attendance.sort((a, b) => a.date - b.date);
      store.mutations.setStudentAttendance(attendance);
    } catch (err) {
      console.log("ERROR | Fetching student attendance.", err);
      store.actions.errorToast("Error fetching student attendance. Please try again shortly.");
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    if (store.state.studentAttendance) return;
    fetchAttendance();
  });
</script>

<template>
  <div class="px-4">
    <div class="w-full mb-2">
      <button @click="() => fetchAttendance()" :disabled="loading" class="w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
        Refresh Student Attendance
      </button>
    </div>
    <transition name="fade" mode="out-in">
      <table
        v-if="store.state.studentAttendance && store.state.studentAttendance.length > 0"
        class="w-full py-4 px-6 divide-y divide-gray-200 shadow-lg mb-6"
      >
        <thead class="bg-gray-50">
          <tr>
            <th colspan="3">{{ store.state.student.name }}'s Attendance Records</th>
          </tr>
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="att in store.state.studentAttendance" :key="att.date">
            <td class="px-6 py-4">{{ att.date.getFullYear() + "-" + String((att.date.getMonth() + 1)).padStart(2, "0") + "-" + String(att.date.getDate()).padStart(2, "0") }}</td>
            <td class="px-6 py-4">{{ att.excused }}</td>
            <td class="px-6 py-4">{{ att.present }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="store.state.studentAttendance && store.state.studentAttendance.length == 0">{{ store.state.student.name }} has not attended any classes.</div>
      <div v-else-if="loading">Loading...</div>
      <div v-else>Error - option to try again</div>
    </transition>
  </div>
</template>
