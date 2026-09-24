import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FabSource | 晶圆厂干式真空泵寻源比选工作台",
  description: "面向半导体设备采购的可解释 TCO、技术门槛与供应商风险决策演示。",
  keywords: ["半导体供应链", "晶圆厂采购", "干式真空泵", "TCO", "供应商比选", "vibe coding"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
