import admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let initializationError: Error | null = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase configuration environment variables');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }

  db = admin.firestore();
} catch (error: unknown) {
  console.error('Error in Firebase initialization:', error);
  initializationError = error instanceof Error ? error : new Error('Unknown error during Firebase initialization');
  db = null;
}

export type UserRecord = {
  wins: number;
  losses: number;
  ties: number;
  easyWins: number;
  mediumWins: number;
  hardWins: number;
  timestamp: admin.firestore.Timestamp;
}

export const getDb = () => {
  if (db) return db;
  throw initializationError || new Error('Firestore is not initialized');
};

export async function updateUserRecord(fid: string, isWin: boolean, difficulty: 'easy' | 'medium' | 'hard') {
  try {
    const database = getDb();
    const userRef = database.collection('v2').doc(fid);
    
    const update: any = {
      [isWin ? 'wins' : 'losses']: admin.firestore.FieldValue.increment(1),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (isWin) {
      update[`${difficulty}Wins`] = admin.firestore.FieldValue.increment(1);
    }
    
    await userRef.set(update, { merge: true });
  } catch (error) {
    console.error(`Error updating user record for FID ${fid}:`, error);
  }
}

export async function updateUserTie(fid: string) {
  try {
    const database = getDb();
    const userRef = database.collection('v2').doc(fid);
    await userRef.set({
      ties: admin.firestore.FieldValue.increment(1),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Error updating user tie for FID ${fid}:`, error);
  }
}

export async function getUserRecord(fid: string): Promise<UserRecord> {
  try {
    const database = getDb();
    const userDoc = await database.collection('v2').doc(fid).get();
    if (!userDoc.exists) {
      return {
        wins: 0,
        losses: 0,
        ties: 0,
        easyWins: 0,
        mediumWins: 0,
        hardWins: 0,
        timestamp: admin.firestore.Timestamp.fromDate(new Date())
      };
    }

    const userData = userDoc.data() as UserRecord;
    return userData;
  } catch (error) {
    console.error(`Error getting user record for FID ${fid}:`, error);
    throw error;
  }
} 