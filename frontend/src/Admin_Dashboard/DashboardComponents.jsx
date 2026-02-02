"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, User, Users, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useAdminAuth } from "@/context/AdminAuthContext";

const DashboardComponents = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoaded, setIsLoaded] = useState(false);
  const [stats, setStats] = useState(null);
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    loading: true,
    error: null,
  });
  const { theme } = useTheme();
  const { admin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!admin) return;

      try {
        // Fetch stats for revenue, coaches, and users
        const statsRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/stats`, {
          credentials: "include",
        });
        const statsJson = await statsRes.json();

        if (!statsJson.success || !statsJson.data) {
          console.warn("Stats API did not return data", statsJson);
          return;
        }

        const revenueData = Array.isArray(statsJson.data.monthlyRevenue)
          ? statsJson.data.monthlyRevenue.map((item) => ({
              month: `${item._id.month}/${item._id.year}`,
              revenue: item.revenue,
            }))
          : [];

        setStats({ totals: statsJson.data, revenueData });

        // Fetch visitor stats
        const visitorRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/analytics/visitor-stats`, {
          credentials: "include",
        });
        if (!visitorRes.ok) throw new Error("Failed to fetch visitor stats");
        const visitorJson = await visitorRes.json();
        console.log('Visitor Stats Data:', visitorJson); // Debug
        const totalVisitors = visitorJson.deviceStats.reduce((sum, stat) => sum + stat.count, 0);
        setVisitorStats({ totalVisitors, loading: false, error: null });
      } catch (err) {
        console.error("Error fetching data:", err);
        setVisitorStats({ totalVisitors: 0, loading: false, error: "Failed to load visitor stats" });
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [admin]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="border-none shadow-lg">
          <CardContent className="p-2">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground">
              Revenue: ${payload[0].value.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  const handleCardClick = (url) => {
    navigate(url);
  };

  const handleRevenueClick = () => {
    const query = timeRange ? `?range=${timeRange}` : "";
    navigate(`/admin/dashboard/transactions${query}`);
  };

  const handleVisitorsClick = () => {
    navigate(`/admin/dashboard/visitors`);
  };

  if (!admin) return <p className="p-4 text-gray-500">Please login as admin to view dashboard.</p>;
  if (!stats || visitorStats.loading) return <p className="p-4 text-gray-500">Loading...</p>;

  const { totals, revenueData } = stats;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Revenue",
              icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
              value: `$${totals.totalAmount.toLocaleString()}`,
              delay: 0.7,
              url: `/admin/dashboard/transactions`,
              onClick: handleRevenueClick,
            },
            {
              title: "Total Coaches",
              icon: <Users className="h-4 w-4 text-muted-foreground" />,
              value: totals.totalPsychics,
              delay: 0.8,
              url: `/admin/dashboard/alladvisors`,
              onClick: () => handleCardClick('/admin/dashboard/alladvisors'),
            },
            {
              title: "Total Users",
              icon: <User className="h-4 w-4 text-muted-foreground" />,
              value: totals.totalUsers,
              delay: 0.9,
              url: `/admin/dashboard/allusers`,
              onClick: () => handleCardClick('/admin/dashboard/allusers'),
            },
            {
              title: "Total Visitors",
              icon: <Eye className="h-4 w-4 text-muted-foreground" />,
              value: visitorStats.error ? "N/A" : visitorStats.totalVisitors.toLocaleString(),
              delay: 1.0,
              url: `/admin/dashboard/visitors`,
              onClick: handleVisitorsClick,
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className={`bg-white/10 border-white/20 backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px] hover:cursor-pointer ${
                isLoaded ? "animate-slide-in-bottom opacity-100" : "opacity-0"
              }`}
              style={{ animationDelay: `${stat.delay}s` }}
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent className="cursor-pointer">
                <div className="text-2xl font-bold animate-count-up">
                  {stat.title === "Total Visitors" && visitorStats.error ? (
                    <span className="text-red-500">{stat.value}</span>
                  ) : (
                    stat.value
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div
          className="w-full border border-gray-200 mt-4 rounded-md p-2 md:p-4 hover:cursor-pointer transition-all duration-200 hover:shadow-md"
          onClick={handleRevenueClick}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Revenue Over Time</h3>
            <span className="text-sm text-muted-foreground">Click to view all transactions</span>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis
                dataKey="month"
                stroke={theme === "dark" ? "#888888" : "#333333"}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={theme === "dark" ? "#888888" : "#333333"}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={theme === "dark" ? "#adfa1d" : "#0ea5e9"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
};

export default DashboardComponents;