<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
  import store from "../store";

  const escapeListener = ref(null);
  const open = ref(false);
  const columnSelect = ref(null)
  const searchQuery = ref("");
  const sortKey = ref("name");
  const sortAsc = ref(true);
  const headings = ref(JSON.parse(localStorage.getItem("headings")) || [
    { key: "name", value: "Student Name", hidden: false },
    { key: "section", value: "Section", hidden: false },
    { key: "excused", value: "Excused", hidden: false },
    { key: "present", value: "Present", hidden: false },
    { key: "lastAttended", value: "Last Seen", hidden: false },
    { key: null, value: "Actions", hidden: true }
  ]);

  watch(
    () => headings.value,
    v => localStorage.setItem("headings", JSON.stringify(v)),
    { deep: true }
  );

  const searchedStudents = computed(() => {
    if (!store.state.students) return null;
    return store.state.students.filter(student => {
      return (
        student.name.toLowerCase().indexOf(searchQuery.value.toLowerCase()) != -1
        || student.email.toLowerCase().indexOf(searchQuery.value.toLowerCase()) != -1
        || student.section.toLowerCase().indexOf(searchQuery.value.toLowerCase()) != -1
      )
    }).sort((a, b) => {
      if (sortKey.value == "name") {
        const aSplit = a.name.split(" ");
        const bSplit = b.name.split(" ");
        const aName = aSplit.reverse().join(" ");
        const bName = bSplit.reverse().join(" ");
        if (sortAsc.value) {
          if (aName < bName) return -1;
          if (aName > bName) return 1;
          return 0;
        }
        if (aName > bName) return -1;
        if (aName < bName) return 1;
        return 0;
      } else if (sortKey.value == "lastAttended") {
        const aDate = new Date(a.lastAttended+"T12:00:00");
        const bDate = new Date(b.lastAttended+"T12:00:00");
        if (sortAsc.value) {
          if (aDate < bDate) return -1;
          if (aDate > bDate) return 1;
          return 0;
        }
        if (aDate > bDate) return -1;
        if (aDate < bDate) return 1;
        return 0;
      } else if (sortKey.value == "section") {
        if (sortAsc.value) {
          return a.section.localeCompare(b.section);
        }
        return -a.section.localeCompare(b.section);
      }
      if (sortAsc.value) {
        return a[sortKey.value] - b[sortKey.value];
      }
      return b[sortKey.value] - a[sortKey.value];
    });
  });

  const toggleColumn = key => {
    const idx = headings.value.findIndex(el => el.key === key);
    headings.value[idx].hidden = !headings.value[idx].hidden;
  };

  const setSortKey = key => {
    if (sortKey.value == key) {
      sortAsc.value = !sortAsc.value;
    } else {
      sortKey.value = key;
      sortAsc.value = true;
    }
  };

  onMounted(() => {
    escapeListener.value = document.addEventListener("keyup", evt => {
      if (evt.code === "Escape") {
        open.value = false;
      }
    });
  });
  onBeforeUnmount(() => {
    document.removeEventListener("keyup", escapeListener.value);
  })
</script>

<template>
  <div class="h-fit col-span-12 md:col-span-9 mb-6">
    <!-- Top matter -->
    <div class="mb-4 flex justify-between items-center">
      <!-- Search Bar -->
      <div class="flex-1 pr-4">
        <div class="relative md:w-1/3">
          <input v-model="searchQuery" type="search" placeholder="Search..." class="w-full pl-10 pr-4 py-2 rounded-lg shadow focus:outline-none focus:shadow-outline text-gray-600 font-medium" >
          <div class="absolute top-0 left-0 inline-flex items-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
              <circle cx="10" cy="10" r="7" />
              <line x1="21" y1="21" x2="15" y2="15" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Column Selector -->
      <div>
        <div class="shadow rounded-lg flex">
          <div class="relative">
            <button @click="open = !open" class="rounded-lg inline-flex items-center bg-white hover:text-blue-500 focus:outline-none focus:shadow-outline text-gray-500 font-semibold py-2 px-2 md:px-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 md:hidden" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                <path d="M5.5 5h13a1 1 0 0 1 0.5 1.5L14 12L14 19L10 16L10 12L5 6.5a1 1 0 0 1 0.5 -1.5" />
              </svg>
              <span class="hidden md:block">Display</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div v-show="open" ref="columnSelect" class="z-40 absolute top-0 right-0 w-48 bg-white rounded-lg shadow-lg mt-12 -mr-1 block py-1 overflow-hidden">
              <template v-for="heading in headings">
                <label class="flex justify-start items-center text-truncate hover:bg-gray-100 px-4 py-2">
                  <div class="text-purple-600 mr-3">
                    <input
                      type="checkbox"
                      class="form-checkbox focus:outline-none focus:shadow-outline rounded-full text-purple-600"
                      :checked="!heading.hidden"
                      @click="toggleColumn(heading.key)"
                    />
                  </div>
                  <div class="select-none text-gray-700">
                    {{ heading.value }}
                  </div>
                </label>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Table -->
    <div class="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
      <table class="border-collapse table-auto w-full whitespace-no-wrap bg-white table-striped relative">
        <thead>
					<tr class="text-left">
            <template v-for="heading in headings">
              <th v-if="heading.key" v-show="!heading.hidden" @click="() => setSortKey(heading.key)" class="bg-gray-100 sticky top-0 border-b border-gray-200 px-6 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs cursor-pointer">
                <div class="flex items-center">
                  <span>{{ heading.value }}</span>
                  <svg v-if="heading.key == sortKey" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" :class="sortAsc ? 'rotate-180' : ''" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th v-else v-show="!heading.hidden" class="bg-gray-100 sticky top-0 border-b border-gray-200 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs">
                <div class="flex items-center text-left">
                  <span>{{ heading.value }}</span>
                </div>
              </th>
            </template>
					</tr>
				</thead>
        <tbody>
          <template v-for="student in searchedStudents" :key="student.id">
						<tr>
              <template v-for="heading in headings">
                <td v-if="heading.key" v-show="!heading.hidden" class="border-dashed border-t border-gray-200">
                  <span class="text-gray-700 px-6 py-3 flex items-center">{{ student[heading.key] }}</span>
                </td>
                <td v-else v-show="!heading.hidden" class="border-dashed border-t border-gray-200">
                  <div v-if="store.state.student && student.email == store.state.student.email" class="py-1 text-green-500 border border-transparent">Selected</div>
                  <button v-else @click="() => store.mutations.setStudent(student)" class="bg-transparent hover:bg-green-500 text-green-700 hover:text-slate-50 py-1 px-2 border border-green-500 hover:border-transparent rounded">
                    Select Student
                  </button>
                </td>
              </template>
						</tr>
					</template>
        </tbody>
      </table>
    </div>
  </div>
</template>
