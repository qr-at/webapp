<script setup>
  import { ref, onBeforeUnmount, computed } from "vue";
  import { query, collection, where, getDocs, onSnapshot, updateDoc, doc, addDoc } from "firebase/firestore";
  import { db } from "../firebase";
  import store from "../store";
  import Toggle from "./Toggle.vue";

  onBeforeUnmount(() => clearSearch());

  const searching = ref(false);
  const searchDate = ref(null);
  const searchSection = ref("");
  const searchSub = ref(null);
  const students = ref(null);

  const presentCount = computed(() => {
    if (!students.value) return 0;
    const onlyPresent = students.value.filter(el => el.present);
    return onlyPresent.length;
  });
  const excusedCount = computed(() => {
    if (!students.value) return 0;
    const onlyExcused = students.value.filter(el => el.excused);
    return onlyExcused.length;
  });

  const sectionHasClass = async (section, date) => {
    const d = new Date(date+"T12:00:00");
    const q = query(
      collection(db, "classes"),
      where("day", "==", d.getDay()),
      where("section", "==", section)
    );
    const qsnap = await getDocs(q);
    return !qsnap.empty;
  };
  const studentsInSection = async section => {
    let studs = [];
    const q = query(
      collection(db, "users"),
      where("sections", "array-contains", section)
    );
    const qsnap = await getDocs(q);
    qsnap.forEach(doc => {
      const { name, instructor } = doc.data();
      if (instructor) return;
      studs.push({ name, email: doc.id, section });
    });
    return studs;
  };

  const clearSearch = () => {
    console.log("Clear Search");
    if (searchSub.value) searchSub.value();
    searchSub.value = null;
    students.value = null;
  };
  const searchClasses = async () => {
    console.log("Search Classes");
    // Validate search fields
    if (!searchDate.value) {
      store.actions.errorToast("The date field is required.");
      return;
    } else if (!searchSection.value) {
      store.actions.errorToast("The section field is required.");
      return;
    }

    try {
      console.log(`Searching for ${searchSection.value}'s class on ${searchDate.value}`);
      searching.value = true;
      
      // Ensure section had a class on requested date
      const hadClass = await sectionHasClass(searchSection.value, searchDate.value);
      if (!hadClass) {
        store.actions.errorToast(`${searchSection.value} did not have class on ${searchDate.value}.`);
        return;
      }

      // Get students in requested section
      const sectionStudents = await studentsInSection(searchSection.value);

      // Create listener for student checkins
      const q = query(
        collection(db, "checkins"),
        where("section", "==", searchSection.value),
        where("date", "==", searchDate.value)
      );
      searchSub.value = onSnapshot(q, qs => {
        const attendance = {};
        qs.forEach(doc => {
          const data = doc.data();
          attendance[data.email] = {
            id: doc.id,
            present: data.present || false,
            excused: data.excused || false,
          };
        });
        students.value = sectionStudents.map(student => {
          const student_attendance = attendance[student.email] || null;
          if (student_attendance) {
            return { ...student, ...student_attendance };
          } else {
            return { ...student, present: false, excused: false };
          }
        });
      });
    } catch (err) {
      console.error("ERROR | Class search", err);
      store.actions.errorToast("Error. Please try again shortly.");
      clearSearch();
    } finally {
      searching.value = false;
    }
  };
  const markExcused = async student => {
    console.log(`Mark excused: ${student.email}`);
    try {
      if (student.id) {
        await updateDoc(
          doc(db, "checkins", student.id),
          { excused: !student.excused }
        );
      } else {
        await addDoc(
          collection(db, "checkins"),
          {
            date: searchDate.value,
            email: student.email,
            section: searchSection.value,
            present: student.present,
            excused: !student.excused,
          }
        );
      }
    } catch (err) {
      console.log("ERROR | Marking student as excused.", err);
      store.actions.errorToast("Error excusing student. Please try again shortly.");
    }
  };
  const markPresent = async student => {
    console.log(`Mark Present: ${student.email}`);
    try {
      if (student.id) {
        await updateDoc(
          doc(db, "checkins", student.id),
          { present: !student.present }
        );
      } else {
        await addDoc(
          collection(db, "checkins"),
          {
            date: searchDate.value,
            email: student.email,
            section: searchSection.value,
            present: !student.present,
            excused: student.excused,
          }
        );
      }
    } catch (err) {
      console.log("ERROR | Marking student as present.", err);
      store.actions.errorToast("Error marking student as present. Please try again shortly.");
    }
  };
</script>

<template>
  <div class="grid grid-cols-12 gap-4">
    <!-- Search Panel -->
    <div class="h-fit col-span-12 md:col-span-3 bg-white shadow-lg rounded-lg py-4 px-6">
      <transition name="fade" mode="out-in">
        <div v-if="students">
          <h3 class="font-bold text-center">{{ searchDate }} - {{ searchSection }}</h3>
          <p class="text-xs text-center">Students: {{ students.length }} (P={{ presentCount }}, E={{ excusedCount }}, A={{ students.length - presentCount - excusedCount }})</p>
          <button @click="clearSearch" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
            New Search
          </button>
        </div>
        <div v-else>
          <h3 class="text-center">Search Classes</h3>
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
          <button @click="searchClasses" :disabled="searching" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
            Search
          </button>
        </div>
      </transition>
    </div>

    <!-- Results Panel -->
    <transition name="fade" mode="out-in">
      <table
        v-if="students && students.length > 0"
        class="h-fit col-span-12 md:col-span-9 py-4 px-6 divide-y divide-gray-200 shadow-lg mb-6"
      >
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="student in students" :key="student.id">
            <td class="px-6 py-4">{{ student.name }}</td>
            <td class="px-6 py-4">{{ student.section }}</td>
            <td class="px-6 py-4"><toggle :status="student.excused" @toggle="() => markExcused(student)" /></td>
            <td class="px-6 py-4"><toggle :status="student.present" @toggle="() => markPresent(student)" /></td>
          </tr>
        </tbody>
      </table>
    </transition>
  </div>
</template>

<style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
