import "./globals.css";
import LiffBootstrap from "@/components/LiffBootstrap";
import LiffTransitionOverlay from "@/components/LiffTransitionOverlay";

export const metadata = {
  title: "接龍報名",
  description: "在 LINE 上分享、免登入即可完成報名的接龍小工具",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
     <body className="bg-gradient-to-b from-emerald-50 via-white to-emerald-50 min-h-screen">
        <LiffBootstrap />
        <LiffTransitionOverlay />
        <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
