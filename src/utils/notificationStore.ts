import { db } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';

interface NotificationDetails {
  url: string;
  token: string;
}

export async function storeNotificationDetails(fid: string, details: NotificationDetails) {
  try {
    await db.collection('notifications').doc(fid).set({
      ...details,
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log(`Stored notification details for FID: ${fid}`);
  } catch (error) {
    console.error(`Error storing notification details for FID ${fid}:`, error);
    throw error;
  }
}

export async function removeNotificationDetails(fid: string) {
  try {
    await db.collection('notifications').doc(fid).delete();
    console.log(`Removed notification details for FID: ${fid}`);
  } catch (error) {
    console.error(`Error removing notification details for FID ${fid}:`, error);
    throw error;
  }
}

export async function getNotificationDetails(fid: string): Promise<NotificationDetails | null> {
  try {
    const doc = await db.collection('notifications').doc(fid).get();
    return doc.exists ? doc.data() as NotificationDetails : null;
  } catch (error) {
    console.error(`Error getting notification details for FID ${fid}:`, error);
    throw error;
  }
} 