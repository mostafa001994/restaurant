import Link from 'next/link';
import './globals.css';
import SvgIcons from './_icons';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';


// app/layout.tsx یا wherever your root layout is
import { CartProvider } from '@/context/CartContext';
import { UserProvider } from '@/context/UserContext';
import CartWidget from '@/components/CartWidget';
import HeaderAuthSection from '@/components/HeaderAuthSection';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans !bg-gray-50 text-gray-900">

        <SvgIcons />

        <UserProvider>
          <CartProvider>
            <header className="bg-white shadow">
              <nav className="container mx-auto flex items-center justify-between p-1">

                <div className="flex-shrink-0">
                  <Link href="/">
                    <img
                      src="/logo.webp"
                      alt="لوگو"
                      className="h-16 w-auto"
                    />
                  </Link>
                </div>


                <div className="flex gap-4 items-center text-black">
                  <CartWidget />
                  <HeaderAuthSection />
                </div>
              </nav>
            </header>

            <main className="container mx-auto p-4">{children}</main>
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}