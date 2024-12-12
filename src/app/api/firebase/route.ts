import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function POST(request: Request) {
  try {
    const { fid, action, difficulty } = await request.json();
    
    if (!fid) {
      return Response.json({ error: 'FID is required' }, { status: 400 });
    }

    const userRef = db.collection('v2').doc(fid);
    
    switch (action) {
      case 'win':
        await userRef.set({
          wins: admin.firestore.FieldValue.increment(1),
          [`${difficulty}Wins`]: admin.firestore.FieldValue.increment(1),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        break;
      case 'loss':
        await userRef.set({
          losses: admin.firestore.FieldValue.increment(1),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        break;
      case 'tie':
        await userRef.set({
          ties: admin.firestore.FieldValue.increment(1),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        break;
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Firebase operation failed:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 