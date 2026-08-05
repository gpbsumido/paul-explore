import { test, expect } from "@playwright/test";

/**
 * Verifies the session-gate boundary for unauthenticated visitors: the protected
 * routes redirect to login, and the public ones stay put. These tests do not
 * require credentials — they only check where the visitor lands.
 *
 * Web Vitals used to be in the protected list. It was made public (the dashboard
 * shows site-wide, non-personal P75 aggregates, with nothing account-specific in
 * it), so it now belongs with the public routes, and this file asserts that
 * rather than the redirect it used to expect.
 */

const PROTECTED = ["/calendar", "/settings"] as const;

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

const PUBLIC = ["/vitals"] as const;

for (const route of PUBLIC) {
  test(`${route} is public and does not redirect to login`, async ({
    page,
  }) => {
    await page.goto(route);

    // A public route stays on itself for an unauthenticated visitor; the page
    // degrades to an empty shell rather than bouncing to a login.
    await expect(page).toHaveURL(new RegExp(`^http://localhost:3000${route}`));
    expect(page.url()).not.toContain("/auth/login");
  });
}
