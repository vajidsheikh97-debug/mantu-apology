// ============================================================
// FIREBASE FIRESTORE SERVICE
// Handles real-time saving and reading of user responses
// ============================================================

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
export { isFirebaseConfigured };

let db = null;
let firestoreInitialized = false;

// Dynamic imports for Firebase SDK v10 via CDN
let initializeApp, getFirestore, doc, setDoc, deleteDoc, getDocs, collection, onSnapshot, query, orderBy, serverTimestamp;

export async function initFirebase() {
  if (firestoreInitialized) return db;

  if (!isFirebaseConfigured()) {
    console.warn("⚠️ Firebase keys not configured in firebase-config.js yet. Using localStorage fallback.");
    return null;
  }

  try {
    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    initializeApp = appModule.initializeApp;
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

    const app = initializeApp(firebaseConfig);
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

// Clear all responses
export async function clearAllResponses() {
  // 1. Clear localStorage
  try {
    localStorage.removeItem('mantu_local_responses');
  } catch (e) {
    console.error("Local storage clear error:", e);
  }

  // 2. Clear Firestore
  try {
    const firestore = await initFirebase();
    if (firestore && collection && getDocs && deleteDoc) {
      const q = collection(firestore, "responses");
      const snap = await getDocs(q);
      const deletePromises = [];
      snap.forEach((d) => {
        deletePromises.push(deleteDoc(d.ref));
      });
      await Promise.all(deletePromises);
      console.log("🗑️ All responses cleared from Firestore.");
    }
    return true;
  } catch (err) {
    console.error("Error clearing Firestore responses:", err);
    throw err;
  }
}

