import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { SocketProvider } from "@/contexts/SocketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dev Workflow App",
  description: "Project and task management system",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SocketProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </SocketProvider>
      </body>
    </html>
  );
}
