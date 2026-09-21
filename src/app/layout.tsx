import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "AI 리더보드 — 매일 보는 AI 산업 스코어보드", description: "출처와 계산 근거를 끝까지 추적할 수 있는 AI 모델 순위." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
