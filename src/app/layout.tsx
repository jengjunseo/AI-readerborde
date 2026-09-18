import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "AI Leaderboard — Daily model intelligence", description: "A source-grounded, multi-lens view of the AI model landscape." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
