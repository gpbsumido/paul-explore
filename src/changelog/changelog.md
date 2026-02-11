# Changelog

## 2025-02-10

- added CSP headers in proxy.ts with per-request nonces for inline scripts, locked everything else down to same-origin
- layout.tsx reads the nonce from request headers so we can tag scripts with it
- set up postcss with autoprefixer
- styled protected page, use page.module.css as well as a specific module css for it
- created reusable components

## 2025-02-10

- added auth0 login/logout to the homepage using `@auth0/nextjs-auth0`
- created `src/lib/auth0.ts` for the auth0 client and `src/proxy.ts` to handle the auth routes
- main layout.tsx to use Auth0Provider and page.tsx and show login/logout depending on if you're signed in
- added route protection in proxy.ts so you get redirected to login if you try to hit any page besides the homepage without being logged in
- created some reusable components for main page and protected page
