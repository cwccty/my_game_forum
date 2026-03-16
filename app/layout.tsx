import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "GameHub - 游戏资讯与 MOD 论坛",
    template: "%s | GameHub"
  },
  description: "一个面向中文玩家的游戏资讯、MOD 外链资源和论坛交流站点 MVP。",
  openGraph: {
    title: "GameHub - 游戏资讯与 MOD 论坛",
    description: "一个面向中文玩家的游戏资讯、MOD 外链资源和论坛交流站点 MVP。",
    siteName: "GameHub",
    locale: "zh_CN",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main className="shell page-shell">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
