import { reactive } from "vue";
import { createToast } from "mosha-vue-toastify";
import {
  onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signOut
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

onAuthStateChanged(auth, async user => {
  if (user) {
    if (user.email.includes("@miamioh.edu")) {
      const usr = {
        id: user.uid,
        email: user.email,
      };
      const docRef = doc(db, "users", usr.email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        mutations.setUser({
          ...usr,
          ...docSnap.data(),
        });
        console.log("Successful logged in.", state.user);
      } else {
        actions.errorToast("You are not authorized. Contact Joshua Ferris if you think this is an error.");
        mutations.setUser(null);
      }
    } else {
      actions.errorToast("Please use your @miamioh.edu email.");
      actions.logout();
    }
  } else {
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
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  },
  logout: async () => {
    mutations.setUser(null);
    signOut(auth);
  },
  errorToast: msg => {
    createToast(msg, {
      type: "danger",
      transition: "slide",
    });
  },
  infoToast: msg => {
    createToast(msg, {
      type: "info",
      transition: "slide",
    });
  },
  successToast: msg => {
    createToast(msg, {
      type: "success",
      transition: "slide",
    });
  },
};

export default { state, mutations, actions };
