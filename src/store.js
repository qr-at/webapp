import { reactive } from "vue";
import {
  onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signOut
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

onAuthStateChanged(auth, async user => {
  if (user && user.email.includes("@miamioh.edu")) {
    const usr = {
      id: user.uid,
      email: user.email,
      name: user.displayName,
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
      console.log("Not authorized to use this application. If you believe this is an error please contact Joshua Ferris <ferrisj2@miamioh.edu>");
      mutations.setUser(null);
    }
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
