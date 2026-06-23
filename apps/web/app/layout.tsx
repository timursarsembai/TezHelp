import type { Metadata } from "next";
import type { ReactNode } from "react";
import { appName, defaultLocale } from "@tezhelp/config";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: appName,
  description: "Roadside help marketplace in Almaty",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
