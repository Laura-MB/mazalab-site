import MazaContent from "./MazaContent";

export const metadata = {
  title: "MAZALab",
  description: "Strategic advisory at the intersection of AI, risk, governance, and transformation.",
  openGraph: {
    title: "MAZALab",
    description: "Strategic advisory at the intersection of AI, risk, governance, and transformation.",
    url: "https://mazalab.com",
    siteName: "MAZALab",
    images: [{ url: "/CaptureLogo7.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAZALab",
    images: ["/CaptureLogo7.jpg"],
  },
  icons: {
    icon: "/CaptureLogo7.ico",
  },
};

export default function Page() {
  return <MazaContent />;
}
