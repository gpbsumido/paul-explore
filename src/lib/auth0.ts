import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  logoutStrategy: "v2",
  authorizationParameters: {
    // without an audience Auth0 issues an opaque token — useless for the API
    audience: process.env.AUTH0_AUDIENCE,
  },
});
