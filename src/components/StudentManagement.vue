<script setup>
  import { ref, onMounted, computed } from "vue";
  import { doc, query, collection, where, getDoc, getDocs, setDoc } from "firebase/firestore";
  import { db } from "../firebase";
  import store from "../store";

  const loading = ref(false);
  const addingStudent = ref(false);
  const searchQuery = ref("");
  const newName = ref("");
  const newEmail = ref("");
  const newSections = ref([]);

  const doesStudentExist = async email => {
    const docRef = doc(db, "users", email);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  };

  const addStudent = async () => {
    if (!newName.value) {
      store.actions.errorToast("Student name is a required field.");
      return;
    }
    if (!newEmail.value) {
      store.actions.errorToast("Student email is a required field.");
      return;
    }
    if (newSections.value.length == 0) {
      store.actions.errorToast("Student sections is a required field.");
      return;
    }

    try {
      addingStudent.value = true;
      // Check student is not already in firestore
      const studentExists = await doesStudentExist(newEmail.value);
      if (studentExists) {
        console.log("Student already exists");
        store.actions.errorToast("Student already exists. Contact Joshua Ferris for overrides.");
        return;
      }
      // Add student to firestore
      await setDoc(doc(db, "users", newEmail.value), {
        name: newName.value,
        instructor: false,
        sections: newSections.value,
      });
      store.state.students.push({ name: newName.value, email: newEmail.value, sections: newSections.value });
      store.actions.successToast(`Added ${newName.value} to the database.`);
      newName.value = "";
      newEmail.value = "";
      newSections.value = [];
    } catch (err) {
      console.log("ERROR | Adding student.", err);
      store.actions.errorToast("Error adding student. Please try again shortly.");
    } finally {
      addingStudent.value = false;
    }
  };

  const searchedStudents = computed(() => {
    if (!store.state.students) return null;
    return store.state.students.filter(student => {
      return (
        student.name.toLowerCase().indexOf(searchQuery.value.toLowerCase()) != -1
        || student.email.toLowerCase().indexOf(searchQuery.value.toLowerCase()) != -1
        || student.section.toLowerCase().indexOf(searchQuery.value.toLowerCase()) != -1
      )
    });
  });

  const fetchStudents = async () => {
    try {
      loading.value = true;
      store.mutations.setStudents(null);
      let students = [];
      const q = query(
        collection(db, "attendance"),
        where("section", "in", store.state.user.sections)
      );
      const qsnap = await getDocs(q);
      qsnap.forEach(doc => {
        students.push(doc.data());
      });
      students.sort((a, b) => a.name.split(" ")[1] > b.name.split(" ")[1]);
      store.mutations.setStudents(students);
    } catch (err) {
      console.log("ERROR | Fetching students.", err);
      store.actions.errorToast("Error fetching students. Please try again shortly.");
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    if (store.state.students) return;
    fetchStudents();
  });
</script>

<template>
  <div class="grid grid-cols-12 gap-4">
    <div class="h-fit col-span-12 md:col-span-3">
      <div class="bg-white shadow-lg rounded-lg py-4 px-6 mb-4">
        <button @click="() => fetchStudents()" :disabled="loading" class="w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
          Refresh Students
        </button>
      </div>
      <div class="bg-white shadow-lg rounded-lg py-4 px-6">
        <h3 class="text-center">Add Student Form</h3>
        <label for="new-name" class="block uppercase tracking-wide text-gray-700 text-xs font-bold">Student Name</label>
        <input v-model="newName" type="text" id="new-name" class="w-full bg-gray-200 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
        <label for="new-email" class="mt-2 block uppercase tracking-wide text-gray-700 text-xs font-bold">Student Email</label>
        <input v-model="newEmail" type="email" id="new-email" class="w-full bg-gray-200 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
        <label for="new-sections" class="mt-2 block uppercase tracking-wide text-gray-700 text-xs font-bold">Student Sections</label>
        <select v-model="newSections" multiple class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" id="new-sections">
          <option v-for="section in store.state.user.sections" :key="section" :value="section">{{ section }}</option>
        </select>
        <button @click="addStudent" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
          Add Student
        </button>
      </div>
    </div>

    <!-- Student List -->
    <transition name="fade" mode="out-in">
      <table
        v-if="store.state.students && store.state.students.length > 0"
        class="h-fit col-span-12 md:col-span-9 py-4 px-6 divide-y divide-gray-200 shadow-lg mb-6"
      >
        <thead class="bg-gray-50">
          <tr>
            <th colspan="6" class="p-2">
              <input type="text" placeholder="Search..." v-model="searchQuery" class="w-full bg-gray-200 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
            </th>
          </tr>
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Attended</th>
            <th scope="col" class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="student in searchedStudents" :key="student.email">
            <td class="px-6 py-4">{{ student.name }}</td>
            <td class="px-6 py-4">{{ student.section }}</td>
            <td class="px-6 py-4">{{ student.excused }}</td>
            <td class="px-6 py-4">{{ student.present }}</td>
            <td class="px-6 py-4">{{ student.lastAttended }}</td>
            <td class="px-6 py-4">
              <div v-if="store.state.student && student.email == store.state.student.email" class="py-1 text-green-500 border border-transparent">Selected</div>
              <button v-else @click="() => store.mutations.setStudent(student)" class="bg-transparent hover:bg-green-500 text-green-700 hover:text-slate-50 py-1 px-2 border border-green-500 hover:border-transparent rounded">
                Select Student
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="store.state.students && store.state.students.length == 0">No students</div>
      <div v-else-if="loading">Loading...</div>
      <div v-else>Error - please try again shortly. You may use the "Refresh Students" button.</div>
    </transition>
  </div>
</template>
