import "./globals.css";

export const metadata = {
  title: "Maza Lab Clon",
  description: "Clon de estudio de arquitectura",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}