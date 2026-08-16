// ============================================================
// FIREBASE FIRESTORE SERVICE
// Handles real-time saving and reading of user responses
// ============================================================

let firebaseConfig = {
  apiKey: "AIzaSyDSymqZ-QGpDnHA8DrdQvDPSWfRkVr-3pw",
  authDomain: "sori-project.firebaseapp.com",
  projectId: "sori-project",
  storageBucket: "sori-project.firebasestorage.app",
  messagingSenderId: "685891191908",
  appId: "1:685891191908:web:119d7c6d2f9c741a900b71",
  measurementId: "G-JLM99XNPXH"
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}

let appInstance = null;
let auth = null;
let authInitialized = false;
let getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged;

export async function getFirebaseApp() {
  if (appInstance) return appInstance;
  const appModule = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  appInstance = appModule.initializeApp(firebaseConfig);
  return appInstance;
}

export async function initAuth() {
  if (authInitialized) return auth;
  try {
    const app = await getFirebaseApp();
    const authModule = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    getAuth = authModule.getAuth;
    signInWithEmailAndPassword = authModule.signInWithEmailAndPassword;
    signOut = authModule.signOut;
    onAuthStateChanged = authModule.onAuthStateChanged;
    auth = getAuth(app);
    authInitialized = true;
    return auth;
  } catch (err) {
    console.error("❌ Firebase Auth init error:", err);
    return null;
  }
}

export async function loginAdmin(email, password) {
  const authInstance = await initAuth();
  if (!authInstance) throw new Error("Firebase Auth not initialized.");
  return await signInWithEmailAndPassword(authInstance, email, password);
}

export async function logoutAdmin() {
  const authInstance = await initAuth();
  if (authInstance) await signOut(authInstance);
}

export async function onAdminAuthStateChanged(callback) {
  const authInstance = await initAuth();
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, callback);
}

export async function initFirebase() {
  if (firestoreInitialized) return db;

  if (!isFirebaseConfigured()) {
    console.warn("⚠️ Firebase keys not configured. Using localStorage fallback.");
    return null;
  }

  try {
    const app = await getFirebaseApp();
    const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    getFirestore = firestoreModule.getFirestore;
    doc = firestoreModule.doc;
    setDoc = firestoreModule.setDoc;
    deleteDoc = firestoreModule.deleteDoc;
    getDocs = firestoreModule.getDocs;
    collection = firestoreModule.collection;
    onSnapshot = firestoreModule.onSnapshot;
    query = firestoreModule.query;
    orderBy = firestoreModule.orderBy;
    serverTimestamp = firestoreModule.serverTimestamp;

    db = getFirestore(app);
    firestoreInitialized = true;
    console.log("✅ Firebase Firestore connected successfully!");
    return db;
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Firestore:", err);
    return null;
  }
}

// Save response data for a given session (merges updates)
export async function saveSessionData(sessionId, updateFields) {
  // Always save to localStorage as instant offline backup
  try {
    const localKey = 'mantu_local_responses';
    const allLocal = JSON.parse(localStorage.getItem(localKey) || '{}');
    allLocal[sessionId] = {
      ...(allLocal[sessionId] || {}),
      ...updateFields,
      sessionId,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(localKey, JSON.stringify(allLocal));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  // If Firebase is configured, push to Firestore
  try {
    const firestore = await initFirebase();
    if (firestore && doc && setDoc) {
      const docRef = doc(firestore, "responses", sessionId);
      await setDoc(docRef, {
        ...updateFields,
        sessionId,
        updatedAt: serverTimestamp ? serverTimestamp() : new Date()
      }, { merge: true });
      console.log("☁️ Saved to Firebase Firestore:", sessionId);
    }
  } catch (err) {
    console.error("Error saving to Firestore:", err);
  }
}

// Real-time listener for Admin Panel
export async function listenToAllResponses(onUpdate) {
  // 1. Initial load from localStorage immediately
  const getLocalResponses = () => {
    try {
      const allLocal = JSON.parse(localStorage.getItem('mantu_local_responses') || '{}');
      return Object.values(allLocal).sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
    } catch {
      return [];
    }
  };

  onUpdate(getLocalResponses());

  // 2. Connect to Firestore if available
  try {
    const firestore = await initFirebase();
    if (firestore && collection && onSnapshot) {
      const q = collection(firestore, "responses");
      onSnapshot(q, (snapshot) => {
        const remoteData = [];
        snapshot.forEach((doc) => {
          remoteData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by timestamp descending
        remoteData.sort((a, b) => {
          const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.lastUpdated || a.startedAt || 0).getTime();
          const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.lastUpdated || b.startedAt || 0).getTime();
          return tB - tA;
        });

        onUpdate(remoteData);
      }, (err) => {
        console.error("Firestore listener error:", err);
      });
    }
  } catch (err) {
    console.error("Error attaching Firestore listener:", err);
  }
}

// Delete a single response by sessionId
export async function deleteSessionData(sessionId) {
  // 1. Remove from localStorage
  try {
    const localKey = 'mantu_local_responses';
    const allLocal = JSON.parse(localStorage.getItem(localKey) || '{}');
    if (allLocal[sessionId]) {
      delete allLocal[sessionId];
      localStorage.setItem(localKey, JSON.stringify(allLocal));
    }
  } catch (e) {
    console.error("Local storage delete error:", e);
  }

  // 2. Remove from Firestore
  try {
    const firestore = await initFirebase();
    if (firestore && doc && deleteDoc) {
      const docRef = doc(firestore, "responses", sessionId);
      await deleteDoc(docRef);
      console.log("🗑️ Deleted from Firestore:", sessionId);
    }
    return true;
  } catch (err) {
    console.error("Error deleting from Firestore:", err);
    throw err;
  }
}

// Clear all responses AND visitors
export async function clearAllResponses() {
  // 1. Clear localStorage
  try {
    localStorage.removeItem('mantu_local_responses');
    localStorage.removeItem('mantu_visitors');
  } catch (e) {
    console.error("Local storage clear error:", e);
  }

  // 2. Clear Firestore — both collections
  try {
    const firestore = await initFirebase();
    if (firestore && collection && getDocs && deleteDoc) {
      // Clear responses
      const rSnap = await getDocs(collection(firestore, "responses"));
      const delPromises = [];
      rSnap.forEach((d) => delPromises.push(deleteDoc(d.ref)));

      // Clear visitors
      const vSnap = await getDocs(collection(firestore, "visitors"));
      vSnap.forEach((d) => delPromises.push(deleteDoc(d.ref)));

      await Promise.all(delPromises);
      console.log("🗑️ All responses & visitors cleared from Firestore.");
    }
    return true;
  } catch (err) {
    console.error("Error clearing Firestore:", err);
    throw err;
  }
}
// ─────────────────────────────────────────────────────────────
// VISITOR TRACKING — persistent per browser (via VISITOR_ID)
// Stores total visit count, last seen, device, visit timestamps
// ─────────────────────────────────────────────────────────────

export async function recordVisitorVisit(visitorId, device) {
  const now = new Date().toISOString();

  // 1. Update localStorage visitors map
  try {
    const localKey = 'mantu_visitors';
    const allVisitors = JSON.parse(localStorage.getItem(localKey) || '{}');
    const existing = allVisitors[visitorId] || { visitCount: 0, visits: [] };
    const visitCount = (existing.visitCount || 0) + 1;
    const visits = existing.visits || [];
    visits.unshift(now); // newest first
    if (visits.length > 50) visits.pop(); // cap history at 50

    allVisitors[visitorId] = {
      visitorId,
      device,
      visitCount,
      firstSeen: existing.firstSeen || now,
      lastSeen: now,
      visits,
    };
    localStorage.setItem(localKey, JSON.stringify(allVisitors));
  } catch (e) {
    console.error('Visitor localStorage error:', e);
  }

  // 2. Push to Firestore visitors collection
  try {
    const firestore = await initFirebase();
    if (firestore && doc && setDoc) {
      const docRef = doc(firestore, 'visitors', visitorId);

      // We use a merge write with a sub-array field trick for visit log
      // We read first to append visits array safely
      const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDoc(docRef);
      const existing = snap.exists() ? snap.data() : null;
      const oldVisits = existing?.visits || [];
      const oldCount  = existing?.visitCount || 0;

      const newVisits = [now, ...oldVisits].slice(0, 50);

      await setDoc(docRef, {
        visitorId,
        device,
        visitCount: oldCount + 1,
        firstSeen: existing?.firstSeen || now,
        lastSeen: now,
        visits: newVisits,
        updatedAt: serverTimestamp ? serverTimestamp() : new Date(),
      }, { merge: false }); // full overwrite to keep clean
      console.log('👁️ Visitor visit recorded:', visitorId);
    }
  } catch (err) {
    console.error('Error recording visitor visit:', err);
  }
}

// Real-time listener for Visitors (Admin Panel)
export async function listenToVisitors(onUpdate) {
  // 1. Load from localStorage first
  const getLocalVisitors = () => {
    try {
      const all = JSON.parse(localStorage.getItem('mantu_visitors') || '{}');
      return Object.values(all).sort((a, b) => b.visitCount - a.visitCount);
    } catch {
      return [];
    }
  };
  onUpdate(getLocalVisitors());

  // 2. Firestore real-time listener
  try {
    const firestore = await initFirebase();
    if (firestore && collection && onSnapshot) {
      const q = collection(firestore, 'visitors');
      onSnapshot(q, (snapshot) => {
        const data = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
        data.sort((a, b) => b.visitCount - a.visitCount);
        onUpdate(data);
      });
    }
  } catch (err) {
    console.error('Error attaching visitors listener:', err);
  }
}
