export async function GET() {
  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjc0NzIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgzRjE2ODZlNEI1Yjg2NjdEQzY1RTMzQzMxZDVBYTg2NzcxNzhGZDRBIn0",
      payload: "eyJkb21haW4iOiJwb2RwbGF5djIudmVyY2VsLmFwcCJ9",
      signature:
        "MHgzYTc0MTI3MGJjOGUzNGE1MThkZjk5NGM5MjU3ZTlmMGQ1YWZjNGRlODNkZTIxYjBiM2RmNjZkNTY2OGIwODA5NjZiYjA1ZjM4ZTQ0YjM3MzcwOGRiODJkN2YzNjM5MzAxZTRmZDZkNmNkNGEyMTljNDFlMTIwNDNlNWI2ODY3YzFi",
    },
    frame: {
      version: "0.0.0",
      name: "POD Play v2",
      iconUrl: "https://podplayv2.vercel.app/icon.png",
      splashImageUrl: "https://podplayv2.vercel.app/splash.png",
      splashBackgroundColor: "#7e22ce",
      homeUrl: "https://podplayv2.vercel.app",
      webhookUrl: "https://podplayv2.vercel.app/api/webhook",
    },
  };

  return Response.json(config);
}
////