"use client";
// in NExt.js, components are server side by default, so "use client" declares it to be a client side one, which uses browser 
import Link from "next/link";
// Link used instead of <a> and does client side navigation, which is faster and doesnt fully reload the browser
import { usePathname } from "next/navigation";
// gives current URL path, used to highlight active sidebar item
import{
    BookOpen,
    Upload,
    MessageSquare,
    Brain,
    CreditCard,
    Calendar, 
    LayoutDashboard,
    Book,
} from "lucide-react"
//icons from lucide-react library, each of which is a react component

const links = [
    { href: '/', label: "Dashboard", icon: LayoutDashboard},
    { href: "/topics", label: "Topics", icon: Calendar},
    { href: "/upload", label: "Upload", icon: Upload},
    { href: "/ask", label: "Ask", icon: MessageSquare},
    { href: "/quiz", label: "Quiz", icon: Brain},
    { href: "/flashcards", label: "Flashcards", icon: CreditCard},
    { href: "/schedule", label: "Schedule", icon: BookOpen}
];
//array storing all links since this is the sidebar
// href /, text shown dhasboard, icon Layout Dashboard

export default function Sidebar(){
    //defines React component
    const pathname = usePathname();
    // gets current page path
    return(
        // uses JSX - looks like HTML but is JS used by React
         <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col p-4 gap-2">
            {/* creates sidebar, w-56 width 56, ,minumum hieght is full screen, bg - dark gray, text color white, use flexbox and arrange children vertically, 4 padding, and 2 gap bw child elements  */}
            <h1 className="text-xl font-bold mb-6 px-2">Study Planner</h1>
            {/* heading - Study planner, mb = margin bottom, px - horizontal padding */}
            {links.map(({ href, label, icon: Icon }) => (
                // maps links
                <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${pathname === href
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        }`}
                >
                    <Icon size={18} />
                    <span>{label}</span>
                </Link>
            ))}
        </aside>
    );
}