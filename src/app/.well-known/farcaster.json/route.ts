export async function GET() {
  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEwOTkxNzksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg5YmEyMjgwNmNEOEY2NTEzMUU1YWQwMEUwMTdGQjhCMUFlM0EyZmFBIn0",
      payload: "eyJkb21haW4iOiJwb2RwbGF5djIudmVyY2VsLmFwcCJ9",
      signature:
        "MHhiMDE3YWJiYTNkZTE4NjJmODMxMDFmY2FmYWNjNjdiM2UxOTI1Mjk0NTU1ZjBlMzM5ODNmODM1MWQxMWYwOWJmN2YxNzU2NzExY2YzNWRlMTgxNWMzMzAyN2Y4MmU1OWU1NWQ1MTdjYjA3MDA5ZWY0MjgwNTg0NTRkMWJjYmRlNjFj",
    },
    frame: {
      version: "0.0.0",
      name: "POD Play v2",
      iconUrl: "https://podplayv2.vercel.app/icon.png",
      splashImageUrl: "https://podplayv2.vercel.app/splash.png",
      splashBackgroundColor: "#1A0B2E",
      homeUrl: "https://podplayv2.vercel.app",
      webhookUrl: "https://podplayv2.vercel.app/api/webhook",
    },
  };

  return Response.json(config);
}
////