import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { auth0 } from "@/lib/auth0";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paul Sumido",
  description: "Personal playground and portfolio — NBA stats, fantasy league history, Pokémon TCG browser, and write-ups on how it was built.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();
  // read the nonce set by proxy.ts so Next.js we can apply it to scripts
  // const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <Auth0Provider user={session?.user}>{children}</Auth0Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
