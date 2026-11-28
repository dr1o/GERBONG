import { NavLink, useLocation } from "react-router-dom";
import { Users, BookOpen, Bookmark, UserCircle2 } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Tokoh",
    to: "/authors",
    icon: Users,
    matchPrefix: "/authors",
  },
  {
    label: "Pustaka",
    to: "/works",
    icon: BookOpen,
    matchPrefix: "/works",
  },
  {
    label: "Favorit",
    to: "/favorites",
    icon: Bookmark,
    matchPrefix: "/favorites",
  },
  {
    label: "Profil & Relawan",
    to: "/about",
    icon: UserCircle2,
    matchPrefix: "/about",
  },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Navigasi Utama GERBONG"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[#D5CFC2] bg-[#F4F1EA]"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-4 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ label, to, icon: Icon, matchPrefix }) => {
          const isActive = pathname === to || pathname.startsWith(`${matchPrefix}/`);

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors ${
                isActive
                  ? "border-t-2 border-[#991B1B] text-[#991B1B] font-semibold -mt-[1px]"
                  : "border-t-2 border-transparent text-[#57534E] hover:text-[#161615] -mt-[1px]"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.75} />
              <span className="text-[11px] leading-none tracking-tight text-center">
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
