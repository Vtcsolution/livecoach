"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/All_Components/screen/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Inbox,
  User,
  MessageSquare,
  CreditCard,
  Heart,
  Cpu,
} from "lucide-react";

export default function Navigation() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [firstAstrologyId, setFirstAstrologyId] = useState(null);

  // Fetch first Astrology psychic when user is available
  useEffect(() => {
    const fetchFirstAstrologyPsychic = async () => {
      try {
        if (!user?._id) return; // Wait for user auth
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/psychics/type/Astrology`,
          { withCredentials: true }
        );
        const psychics = res.data?.data || [];
        if (psychics.length > 0) {
          setFirstAstrologyId(psychics[0]._id);
        }
      } catch (err) {
        console.error("❌ Failed to fetch Astrology psychics:", err.response?.data || err.message);
      }
    };

    fetchFirstAstrologyPsychic();
  }, [user?._id]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      name: "AI Inbox", // Renamed from "Inbox"
      href: firstAstrologyId ? `/chat/${firstAstrologyId}` : "/chat",
      icon: <Cpu className="h-4 w-4" />, // Changed icon to CPU/AI icon
      matchPrefix: "/chat",
    },
    {
      name: "Account",
      href: "/account",
      icon: <User className="h-4 w-4" />,
    },
    {
      name: "Love-Compatibility", // Fixed typo in name
      href: "/love-reports",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      name: "Astrology-Report",
      href: "/astrology-reports",
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  return (
    <nav className="bg-white rounded-lg max-w-7xl mt-2 m-auto shadow-sm border p-2">
      <div className="flex justify-center gap-1 flex-wrap">
        {navItems.map((item) => {
          const isActive = item.matchPrefix
            ? pathname.startsWith(item.matchPrefix)
            : pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2",
                isActive
                  ? "bg-[#3B5EB7] text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}