import { test, expect } from "@playwright/test";

/**
 * Verifies that unauthenticated requests to protected routes are redirected
 * to the Auth0 login page. These tests do not require credentials — they
 * only check that the redirect happens.
 */

const PROTECTED = ["/calendar", "/vitals", "/settings"] as const;

for (const route of PROTECTED) {
  test(`${route} redirects unauthenticated users to login`, async ({
    page,
  }) => {
    await page.goto(route);

    // The middleware sets a returnTo param and redirects to /auth/login, which
    // then hands off to Auth0. Wait until we are no longer on the protected route.
    await expect(page).not.toHaveURL(
      new RegExp(`^http://localhost:3000${route}`),
    );

    // Either on /auth/login (app) or the Auth0 domain (external login page).
    const url = page.url();
    const isAppLoginPage = url.includes("/auth/login");
    const isAuth0Page = url.includes("auth0.com");
    expect(isAppLoginPage || isAuth0Page).toBe(true);
  });
}
