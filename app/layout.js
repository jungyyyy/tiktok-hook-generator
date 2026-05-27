import "./globals.css";

export const metadata = {
  title: "TikTok Hook Generator",
  description: "Generate high-converting TikTok opening hooks with Gemini."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
