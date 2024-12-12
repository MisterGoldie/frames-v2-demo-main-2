import {
  eventHeaderSchema,
  eventPayloadSchema,
  eventSchema,
} from "@farcaster/frame-sdk";
import { NextRequest } from "next/server";
import { storeNotificationDetails, removeNotificationDetails } from '~/utils/notificationStore';

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  const requestBody = eventSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    return Response.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 }
    );
  }

  // TODO: verify signature

  const headerData = JSON.parse(
    Buffer.from(requestBody.data.header, "base64url").toString("utf-8")
  );
  const header = eventHeaderSchema.safeParse(headerData);
  if (header.success === false) {
    return Response.json(
      { success: false, errors: header.error.errors },
      { status: 400 }
    );
  }
  const fid = header.data.fid;

  const payloadData = JSON.parse(
    Buffer.from(requestBody.data.payload, "base64url").toString("utf-8")
  );
  const payload = eventPayloadSchema.safeParse(payloadData);

  if (payload.success === false) {
    return Response.json(
      { success: false, errors: payload.error.errors },
      { status: 400 }
    );
  }

  switch (payload.data.event) {
    case "frame-added":
      if (payload.data.notificationDetails) {
        await storeNotificationDetails(fid.toString(), {
          url: payload.data.notificationDetails.url,
          token: payload.data.notificationDetails.token
        });
      }
      break;
    case "frame-removed":
      await removeNotificationDetails(fid.toString());
      break;
    case "notifications-enabled":
      await storeNotificationDetails(fid.toString(), {
        url: payload.data.notificationDetails.url,
        token: payload.data.notificationDetails.token
      });
      break;
    case "notifications-disabled":
      await removeNotificationDetails(fid.toString());
      break;
  }

  return Response.json({ success: true });
}
