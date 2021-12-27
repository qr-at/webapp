import { reactive } from "vue";
import {
  onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signOut
} from "firebase/auth";
import { auth } from "./firebase";

onAuthStateChanged(auth, user => {
  if (user && user.email.includes("@miamioh.edu")) {
    const usr = {
      id: user.uid,
      email: user.email,
      name: user.displayName,
    };
    console.log("Successful logged in.", usr);
    mutations.setUser(usr);
  } else {
    console.log("No user || Not a Miami email");
    mutations.setUser(null);
  }
});

const state = reactive({
  user: undefined,
});

const mutations = {
  setUser: (v) => state.user = v,
};

const actions = {
  login: async () => {
    console.log("Logging you in!");
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  },
  logout: async () => {
    mutations.setUser(null);
    signOut(auth);
  },
};

export default { state, mutations, actions };
