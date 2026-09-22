import Link from "next/link";

export function SiteHeader({ date }: { date?: string }) {
  const formatted = date
    ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(`${date}T00:00:00+09:00`))
    : undefined;
  return <header className="topbar">
    <Link href="/" className="brand">AI <span>SCOREBOARD</span></Link>
    <nav aria-label="주요 메뉴">
      <Link href="/">순위</Link>
      <Link href="/models">모델</Link>
      <Link href="/compare">비교</Link>
      <Link href="/methodology">방법론</Link>
    </nav>
    {date && <time dateTime={date} className="snapshot-date">{formatted} 00:00 KST</time>}
  </header>;
}
