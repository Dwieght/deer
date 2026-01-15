import "./globals.css";

export const metadata = {
  title: "Deer Army | Tommy & Ghazel Fan Home",
  description: "A warm, heartfelt digital home for the Deer Army community supporting Tommy and Ghazel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/logo_no_bg.png" />
        <link rel="icon" href="/assets/deer-mark.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/assets/logo_no_bg.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Work+Sans:wght@300;400;500;600&family=Noto+Naskh+Arabic:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
