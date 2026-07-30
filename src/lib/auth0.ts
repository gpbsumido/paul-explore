import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import {
  isPermissionDenied,
  permissionDeniedReturnTo,
} from "@/lib/authCallback";
import { LOGIN_PROMPT_COOKIE } from "@/lib/loginReturnTo";
import { sessionConfig } from "@/lib/authSession";

export const auth0 = new Auth0Client({
  logoutStrategy: "v2",
  authorizationParameters: {
    // without an audience Auth0 issues an opaque token — useless for the API
    audience: process.env.AUTH0_AUDIENCE,
  },
  // A hard six-hour session, capped from login. See src/lib/authSession.ts.
  session: sessionConfig,
  // The SDK's default onCallback returns a bare 500 on any callback error, so
  // declining the consent screen (error=access_denied) used to dump you on an
  // error page. Send that one case back to where you started with a flag the
  // AuthErrorToast picks up. Success and every other error keep the default
  // behaviour so real misconfig still surfaces.
  onCallback: async (error, ctx) => {
    const baseUrl = process.env.APP_BASE_URL as string;
    if (error) {
      if (isPermissionDenied(error)) {
        const res = NextResponse.redirect(
          permissionDeniedReturnTo(ctx.returnTo, baseUrl),
        );
        // One-shot flag: the proxy reads this on the next /auth/login and forces
        // prompt=login, so Auth0 asks who's logging in again rather than reusing
        // the still-live session and re-showing the permission screen.
        res.cookies.set(LOGIN_PROMPT_COOKIE, "login", {
          path: "/",
          maxAge: 600,
          httpOnly: true,
          sameSite: "lax",
          secure: true,
        });
        return res;
      }
      return new NextResponse(error.message, { status: 500 });
    }
    return NextResponse.redirect(new URL(ctx.returnTo ?? "/", baseUrl));
  },
});
