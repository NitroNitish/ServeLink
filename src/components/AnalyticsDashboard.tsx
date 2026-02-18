import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, LayoutGrid } from "lucide-react";

interface AnalyticsDashboardProps {
  restaurantId: string;
}

export const AnalyticsDashboard = ({ restaurantId }: AnalyticsDashboardProps) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    totalTables: 0,
  });
  const [topItems, setTopItems] = useState<any[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [restaurantId]);

  const fetchAnalytics = async () => {
    const [{ data: orders }, { data: tables }] = await Promise.all([
      supabase.from("orders").select("total_amount, created_at").eq("restaurant_id", restaurantId),
      supabase.from("restaurant_tables").select("id").eq("restaurant_id", restaurantId),
    ]);

    if (orders) {
      const validOrders = orders.filter((o) => o.total_amount != null);
      const total = validOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
      setStats({
        totalOrders: orders.length,
        totalRevenue: total,
        avgOrderValue: validOrders.length ? total / validOrders.length : 0,
        totalTables: tables?.length || 0,
      });

      const byDay: Record<string, number> = {};
      orders.forEach((o) => {
        const day = new Date(o.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        byDay[day] = (byDay[day] || 0) + (o.total_amount ?? 0);
      });
      setRevenueByDay(
        Object.entries(byDay)
          .slice(-7)
          .map(([day, revenue]) => ({ day, revenue: parseFloat(revenue.toFixed(2)) }))
      );
    }

    const { data: items } = await supabase
      .from("order_items")
      .select(`
        quantity,
        menu_item_id,
        menu_items!inner(name, restaurant_id)
      `)
      .eq("menu_items.restaurant_id", restaurantId);

    if (items) {
      const grouped: Record<string, { name: string; quantity: number }> = {};
      items.forEach((item: any) => {
        const name = item.menu_items?.name || "Unknown";
        if (!grouped[name]) grouped[name] = { name, quantity: 0 };
        grouped[name].quantity += item.quantity;
      });
      setTopItems(
        Object.values(grouped)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
      );
    }
  };

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--secondary))",
    "hsl(28 80% 50%)",
    "hsl(15 60% 55%)",
  ];

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, format: (v: number) => v.toString() },
    { label: "Total Revenue", value: stats.totalRevenue, icon: DollarSign, format: (v: number) => `₹${v.toFixed(2)}` },
    { label: "Avg Order Value", value: stats.avgOrderValue, icon: TrendingUp, format: (v: number) => `₹${v.toFixed(2)}` },
    { label: "Tables", value: stats.totalTables, icon: LayoutGrid, format: (v: number) => v.toString() },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, format }) => (
          <Card key={label} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{format(value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Revenue – Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByDay.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`₹${v}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No order data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topItems}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="quantity"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {topItems.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, "Sold"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
