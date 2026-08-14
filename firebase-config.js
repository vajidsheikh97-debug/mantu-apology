// ============================================================
// FIREBASE CONFIGURATION — sori-project
// ============================================================

export const firebaseConfig = {
  apiKey:            "AIzaSyDSymqZ-QGpDnHA8DrdQvDPSWfRkVr-3pw",
  authDomain:        "sori-project.firebaseapp.com",
  projectId:         "sori-project",
  storageBucket:     "sori-project.firebasestorage.app",
  messagingSenderId: "685891191908",
  appId:             "1:685891191908:web:119d7c6d2f9c741a900b71",
  measurementId:     "G-JLM99XNPXH"
};

// Helper to check if Firebase keys have been configured
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}
