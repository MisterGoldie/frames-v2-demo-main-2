import admin from 'firebase-admin';
import { fetchUserDataByFid } from '../../../utils/neynarUtils';

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

    const userRef = db.collection('users').doc(fid);
    
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

export async function GET() {
  try {
    const db = admin.firestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .orderBy('wins', 'desc')
      .limit(5)
      .get();

    const leaderboard = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userData = await fetchUserDataByFid(doc.id);
        const totalGames = (data.wins || 0) + (data.losses || 0) + (data.ties || 0);
        const { balance } = await checkFanTokenOwnership(doc.id);
        
        // Calculate POD Score using the formula
        const podScore = calculatePODScore(
          data.wins || 0,
          data.ties || 0,
          data.losses || 0,
          totalGames,
          balance || 0
        );

        return {
          fid: doc.id,
          username: userData?.username || `fid:${doc.id}`,
          wins: data.wins || 0,
          losses: data.losses || 0,
          ties: data.ties || 0,
          easyWins: data.easyWins || 0,
          mediumWins: data.mediumWins || 0,
          hardWins: data.hardWins || 0,
          pfp: userData?.pfp || '',
          podScore  // Add the calculated score
        };
      })
    );

    return Response.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return Response.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
} 


function checkFanTokenOwnership(id: string): { balance: any; } | PromiseLike<{ balance: any; }> {
    throw new Error('Function not implemented.');
}


function calculatePODScore(arg0: any, arg1: any, arg2: any, totalGames: any, balance: any) {
    throw new Error('Function not implemented.');
}
//