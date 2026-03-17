export const metadata = {
  metadataBase: new URL("https://mazalab.com"),

  title: "MAZALab",
  description: "Strategic advisory at the intersection of AI, risk, governance, and transformation.",

  openGraph: {
    title: "MAZALab",
    description: "Strategic advisory at the intersection of AI, risk, governance, and transformation.",
    url: "https://mazalab.com",
    siteName: "MAZALab",
    images: [{ url: "CaptureLogo7.jpg", width: 1200, height: 630 }],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MAZALab",
    description: "Strategic advisory at the intersection of AI, risk, governance, and transformation.",
    images: ["CaptureLogo7.jpg"],
  },

  icons: {
    icon: "CaptureLogo7.ico",
  
  },
};
import "./globals.css";


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
