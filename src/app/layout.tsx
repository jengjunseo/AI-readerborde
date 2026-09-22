import type { Metadata } from "next";
import "geist/font/sans";
import "./globals.css";
export const metadata: Metadata = { title: "AI 모델 스코어보드", description: "최신 AI 모델의 능력, 업무 수행, 가성비와 속도를 출처까지 추적하는 일일 스코어보드." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
