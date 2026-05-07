import { Cinzel, Cormorant_Garamond, Lato } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata = {
  title: "Vir & Seba",
  description: "Invitación al casamiento de Vir y Seba",
  icons: {
    icon: "/assets/image/logo/LogoVyS.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${cinzel.variable} ${cormorant.variable} ${lato.variable}`}>
        {children}
      </body>
    </html>
  );
}
