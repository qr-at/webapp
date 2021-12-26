import { reactive } from "vue";

const state = reactive({
  user: null,
});

const mutations = {
  setUser: (v) => state.user = v,
};

const actions = {};

export default { state, mutations, actions };
