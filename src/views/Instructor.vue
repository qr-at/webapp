<script setup>
  import { ref, reactive } from "vue";
  import { query, collection, where, getDocs, onSnapshot, updateDoc, doc, addDoc } from "firebase/firestore";
  import store from "../store";
  import { db } from "../firebase";
  import AppBar from "../components/AppBar.vue";
  import Toggle from "../components/Toggle.vue";

  const searching = ref(false);
  const students = ref(null);
  const searchDate = ref(null);
  const searchSection = ref("");
  const searchSub = reactive({
    sub: null,
    unsub: () => searchSub.sub(),
  });

  const makeSearch = async () => {
    if (!searchDate.value) {
      store.actions.errorToast("The date field is required.");
      return;
    } else if (!searchSection.value) {
      store.actions.errorToast("The section field is required.");
      return;
    }
    searching.value = true;
    let q, qsnap;
    try {
      console.log("Make Search", searchDate.value, searchSection.value);
      const d = new Date(searchDate.value+"T12:00:00");
      const day = d.getDay();
      // Check if class on that day for section
      q = query(
        collection(db, "classes"),
        where("day", "==", day),
        where("section", "==", searchSection.value)
      );
      qsnap = await getDocs(q);
      if (qsnap.empty) {
        store.actions.errorToast(`${searchSection.value} did not have class on ${searchDate.value}.`);
        return;
      }
      // Get students in class
      q = query(
        collection(db, "users"),
        where("sections", "array-contains", searchSection.value)
      );
      qsnap = await getDocs(q);
      let studentsInSection = [];
      qsnap.forEach(doc => {
        const { name, instructor } = doc.data();
        if (!instructor) {
          studentsInSection.push({
            name,
            email: doc.id,
            section: searchSection.value,
          });
        }
      });
      const studentEmails = studentsInSection.map(el => el.email);
      // Get checkins for students
      q = query(
        collection(db, "checkins"),
        where("section", "==", searchSection.value),
        where("date", "==", searchDate.value),
        where("email", "in", studentEmails)
      );
      const unsubscribe = onSnapshot(q, qs => {
        const attendance = {};
        qs.forEach(doc => {
          const data = doc.data();
          attendance[data.email] = {
            id: doc.id,
            present: data.present || false,
            excused: data.excused || false,
          };
        });
        students.value = studentsInSection.map(student => {
          const student_attendance = attendance[student.email] || null;
          if (student_attendance) {
            return { ...student, ...student_attendance };
          } else {
            return { ...student, present: false, excused: false };
          }
        });
      });
      searchSub.sub = unsubscribe;
    } catch (err) {
      store.actions.errorToast("Error. Please try again shortly.");
      console.log("INSTRUCTOR SEARCH ERROR")
      console.log(err);
    } finally {
      searching.value = false;
    }
  };

  const newSearch = () => {
    searchSub.unsub();
    searchSub.sub = null;
    students.value = null;
  };

  const excuse = async r => {
    try {
      if (r.id) {
        await updateDoc(
          doc(db, "checkins", r.id),
          { excused: !r.excused }
        );
      } else {
        await addDoc(
          collection(db, "checkins"),
          {
            date: searchDate.value,
            email: r.email,
            section: searchSection.value,
            present: r.present,
            excused: !r.excused
          }
        );
      }
    } catch (err) {
      store.actions.errorToast("Error excusing student. Please try again shortly.");
    }
  };

  const markpresent = async r => {
    try {
      if (r.id) {
        await updateDoc(
          doc(db, "checkins", r.id),
          { present: !r.present }
        );
      } else {
        await addDoc(
          collection(db, "checkins"),
          {
            date: searchDate.value,
            email: r.email,
            section: searchSection.value,
            present: !r.present,
            excused: r.excused
          }
        );
      }
    } catch (err) {
      store.actions.errorToast("Error marking student present. Please try again shortly.");
    }
  };
</script>

<template>
  <app-bar />
  <main class="w-screen px-4">
    <h2 class="text-gray-500 text-center text-3xl font-light mb-6">Instructor</h2>

    <div class="grid grid-cols-12 gap-4">
      <div class="h-fit col-span-12 md:col-span-3 bg-white shadow-lg rounded-lg py-4 px-6">
        <transition name="fade" mode="out-in">
          <div v-if="students">
            <h3 class="text-center">New Search</h3>
            <button @click="newSearch" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
              New Search
            </button>
          </div>
          <div v-else>
            <h3 class="text-center">Search</h3>
            <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold" for="search-date">
              Date
            </label>
            <input v-model="searchDate" type="date" id="search-date" class="w-full bg-gray-200 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
            <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mt-2" for="search-section">
              Section
            </label>
            <select v-model="searchSection" class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" id="search-section">
              <option value="">Pick one</option>
              <option v-for="section in store.state.user.sections" :key="section" :value="section">{{ section }}</option>
            </select>
            <button @click="makeSearch" :disabled="searching" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
              Search
            </button>
          </div>
        </transition>
      </div>
      <transition name="fade" mode="out-in">
        <table
          v-if="students && students.length > 0"
          class="h-fit col-span-12 md:col-span-9 py-4 px-6 divide-y divide-gray-200 shadow-lg"
        >
          <thead class="bg-gray-50">
            <tr>
              <th colspan="4">
                <h3 class="font-normal text-center">{{ searchDate }} - {{ searchSection }}</h3>
              </th>
            </tr>
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="rec in students" :key="rec.id">
              <td class="px-6 py-4">{{ rec.name }}</td>
              <td class="px-6 py-4">{{ rec.section }}</td>
              <td class="px-6 py-4"><toggle :status="rec.excused" @toggle="() => excuse(rec)" /></td>
              <td class="px-6 py-4"><toggle :status="rec.present" @toggle="() => markpresent(rec)" /></td>
            </tr>
          </tbody>
        </table>
      </transition>
    </div>
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
