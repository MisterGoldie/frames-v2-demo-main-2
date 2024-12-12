import admin from 'firebase-admin';

interface NotificationDetails {
  url: string;
  token: string;
}

export async function storeNotificationDetails(fid: string, details: NotificationDetails) {
  const db = admin.firestore();
  await db.collection('notifications').doc(fid).set({
    ...details,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

export async function removeNotificationDetails(fid: string) {
  const db = admin.firestore();
  await db.collection('notifications').doc(fid).delete();
}

export async function getNotificationDetails(fid: string): Promise<NotificationDetails | null> {
  const db = admin.firestore();
  const doc = await db.collection('notifications').doc(fid).get();
  return doc.exists ? doc.data() as NotificationDetails : null;
} 