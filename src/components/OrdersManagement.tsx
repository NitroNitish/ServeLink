import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

interface Order {
  id: string;
  order_number: string;
  table_id: string | null;
  status: OrderStatus;
  total_amount: number | null;
  created_at: string;
  customer_notes: string | null;
  table_info?: { table_number: string } | null;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    menu_items: { name: string };
  }>;
}

interface OrdersManagementProps {
  restaurantId: string;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-accent text-accent-foreground",
  preparing: "bg-primary text-primary-foreground",
  ready: "bg-secondary text-secondary-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export const OrdersManagement = ({ restaurantId }: OrdersManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-management")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

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
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      setOrders(data.map((o: any) => ({ ...o, table_info: o.restaurant_tables })) as Order[]);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId);
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setUpdating(null);
    fetchOrders();
  };

  const filterOrders = (statuses: OrderStatus[]) =>
    orders.filter((o) => statuses.includes(o.status));

  const renderOrder = (order: Order) => (
    <Card key={order.id} className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {order.table_info ? `Table ${order.table_info.table_number}` : `Order #${order.order_number}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {order.order_items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}× {item.menu_items.name}</span>
              <span className="text-muted-foreground">₹{(item.quantity * item.unit_price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        {order.customer_notes && (
          <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Note: {order.customer_notes}
          </p>
        )}
        <div className="border-t pt-2 flex items-center justify-between">
          <span className="font-bold text-primary">₹{(order.total_amount ?? 0).toFixed(2)}</span>
          <Select
            value={order.status}
            onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}
            disabled={updating === order.id}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="active" className="space-y-6">
      <TabsList>
        <TabsTrigger value="active">
          Active ({filterOrders(["pending", "preparing", "ready"]).length})
        </TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="all">All Orders</TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        {filterOrders(["pending", "preparing", "ready"]).length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No active orders right now.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterOrders(["pending", "preparing", "ready"]).map(renderOrder)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterOrders(["completed", "cancelled"]).map(renderOrder)}
        </div>
      </TabsContent>

      <TabsContent value="all">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(renderOrder)}
        </div>
      </TabsContent>
    </Tabs>
  );
};
