import { NextRequest } from 'next/server';
import { storeNotificationDetails, removeNotificationDetails } from '~/utils/notificationStore';
import { validateSignature } from '~/utils/validateSignature';

export async function POST(request: NextRequest) {
  try {
    // Parse the signature packet
    const body = await request.json();
    const { header, payload: rawPayload, signature } = body;

    // Decode base64url payload
    const payload = JSON.parse(Buffer.from(rawPayload, 'base64url').toString());
    const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString());

    console.log('Webhook received:', {
      fid: decodedHeader.fid,
      type: decodedHeader.type,
      event: payload.event
    });

    // Validate signature (you'll need to implement validateSignature)
    const isValid = await validateSignature(header, rawPayload, signature);
    if (!isValid) {
      console.error('Invalid signature received');
      return Response.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    switch (payload.event) {
      case "frame_added":
        if (payload.notificationDetails) {
          console.log('Storing notification details for FID:', decodedHeader.fid);
          await storeNotificationDetails(decodedHeader.fid.toString(), {
            url: payload.notificationDetails.url,
            token: payload.notificationDetails.token
          });
        }
        break;

      case "frame_removed":
        console.log('Removing notification details for FID:', decodedHeader.fid);
        await removeNotificationDetails(decodedHeader.fid.toString());
        break;

      case "notifications_enabled":
        console.log('Notifications enabled for FID:', decodedHeader.fid);
        await storeNotificationDetails(decodedHeader.fid.toString(), {
          url: payload.notificationDetails.url,
          token: payload.notificationDetails.token
        });
        break;

      case "notifications_disabled":
        console.log('Notifications disabled for FID:', decodedHeader.fid);
        await removeNotificationDetails(decodedHeader.fid.toString());
        break;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
