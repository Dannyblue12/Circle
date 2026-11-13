import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { WalletProvider } from "@/components/wallet";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: { default: "Circle · Get paid safely, even as a team", template: "%s · Circle" },
  description:
    "Find gigs, hire talent and get paid in USDC on Stellar. Client money is locked in escrow before work starts, and every team member is paid straight to their own wallet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <WalletProvider>
          <ToastProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
