import admin, { db } from '~/utils/firebase';
import { fetchUserDataByFid } from '../../../utils/neynarUtils';
import { checkFanTokenOwnership } from '../../../utils/tokenUtils';
import { calculatePODScore } from '../../../utils/scoreUtils';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('userFid');
    
    const db = admin.firestore();
    const usersRef = db.collection('users');
    
    // Get leaderboard data
    const leaderboardSnapshot = await usersRef
      .orderBy('wins', 'desc')
      .limit(10)
      .get();

    const leaderboard = await Promise.all(
      leaderboardSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userData = await fetchUserDataByFid(doc.id);
        const totalGames = (data.wins || 0) + (data.losses || 0) + (data.ties || 0);
        const { balance } = await checkFanTokenOwnership(doc.id);
        
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
          podScore
        };
      })
    );

    // If userFid is provided, get user's data
    let userData = null;
    if (userFid) {
      const userDoc = await usersRef.doc(userFid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (!data) {
          throw new Error('User data is undefined');
        }
        const userDataFromFarcaster = await fetchUserDataByFid(userFid);
        const totalGames = (data.wins || 0) + (data.losses || 0) + (data.ties || 0);
        const { balance } = await checkFanTokenOwnership(userFid);
        
        userData = {
          fid: userFid,
          username: userDataFromFarcaster?.username || `fid:${userFid}`,
          wins: data?.wins || 0,
          losses: data?.losses || 0,
          ties: data?.ties || 0,
          easyWins: data?.easyWins || 0,
          mediumWins: data?.mediumWins || 0,
          hardWins: data.hardWins || 0,
          pfp: userDataFromFarcaster?.pfp || '',
          podScore: calculatePODScore(
            data.wins || 0,
            data.ties || 0,
            data.losses || 0,
            totalGames,
            balance || 0
          )
        };
      }
    }

    return Response.json({ leaderboard, userData });
  } catch (error) {
    console.error('Error fetching data:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
} 

//