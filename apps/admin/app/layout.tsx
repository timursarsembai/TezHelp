import type { Metadata } from "next";
import type { ReactNode } from "react";
import { appName, defaultLocale } from "@tezhelp/config";

import "./globals.css";

export const metadata: Metadata = {
  title: `${appName} Admin`,
  description: "TezHelp administration foundation",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
