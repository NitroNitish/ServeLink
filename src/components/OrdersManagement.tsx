import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  table_id: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  table_info?: { table_number: string } | null;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    menu_items: { name: string };
  }>;
}

export const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-management")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        restaurant_tables (table_number),
        order_items (
          quantity,
          unit_price,
          menu_items (name)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setOrders(data.map((o: any) => ({
        ...o,
        table_info: o.restaurant_tables,
      })) as Order[]);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      preparing: "bg-blue-500",
      ready: "bg-green-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const filterOrders = (statuses: string[]) =>
    orders.filter((o) => statuses.includes(o.status));

  const renderOrder = (order: Order) => (
    <Card key={order.id} className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {order.table_info ? `Table ${order.table_info.table_number}` : `Order #${order.order_number}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {order.order_items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.menu_items.name}</span>
              <span>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">₹{order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="active" className="space-y-6">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="all">All Orders</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4">
        {filterOrders(["pending", "preparing", "ready"]).map(renderOrder)}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4">
        {filterOrders(["completed"]).map(renderOrder)}
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        {orders.map(renderOrder)}
      </TabsContent>
    </Tabs>
  );
};
