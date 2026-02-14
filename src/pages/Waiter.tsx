import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  order_number: string;
  table_id: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  table_info?: { table_number: string } | null;
  order_items: Array<{
    quantity: number;
    menu_items: { name: string };
  }>;
}

const Waiter = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("waiter-orders")
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
          menu_items (name)
        )
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data.map((o: any) => ({
        ...o,
        table_info: o.restaurant_tables,
      })) as Order[]);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Order ${status}` });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready": return <Package className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filterOrders = (status: string[]) => orders.filter((o) => status.includes(o.status));

  const getTableLabel = (order: Order) =>
    order.table_info ? `Table ${order.table_info.table_number}` : `#${order.order_number}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Waiter Panel</h1>
            <p className="text-muted-foreground">Manage table service & orders</p>
          </div>
        </div>

        <Tabs defaultValue="ready" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ready">Ready to Serve</TabsTrigger>
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="ready">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterOrders(["ready"]).map((order) => (
                <Card key={order.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{getTableLabel(order)}</CardTitle>
                      <Badge className="bg-green-500">Ready</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      {order.order_items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.menu_items.name}
                        </p>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => updateOrderStatus(order.id, "completed")}
                    >
                      Mark Served
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterOrders(["pending", "preparing"]).map((order) => (
                <Card key={order.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{getTableLabel(order)}</CardTitle>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {order.order_items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.menu_items.name}
                        </p>
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
                      {getStatusIcon(order.status)} {order.status}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterOrders(["completed"]).map((order) => (
                <Card key={order.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{getTableLabel(order)}</CardTitle>
                      <Badge className="bg-gray-500">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {order.order_items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.menu_items.name}
                        </p>
                      ))}
                    </div>
                    <p className="text-lg font-bold text-primary mt-4">
                      ₹{order.total_amount}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Waiter;
