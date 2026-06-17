import Sidebar from "@/components/Sidebar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // root layout is special in NExtJS and it wraps all pages, its the main layout component, the children thing here means whatever page the user is currently visiting, ({children}{...}) = this is type script, explain that the component recieves a prop called children and children is a React component
    return (
        <html lang="en">
            <body className="flex bg-gray-950 text-white min-h-screen">
                <Sidebar />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </body>
        </html>
    );
}