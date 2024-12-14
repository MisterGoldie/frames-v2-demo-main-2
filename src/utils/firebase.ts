import admin from 'firebase-admin';

// Only initialize if no apps exist
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Export the admin instance and commonly used services
export const db = admin.firestore();
export default admin; 