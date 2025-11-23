import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Leaf, ChefHat, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  preparation_time: number;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

const Menu = () => {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table") || "1";
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    const { data: categoriesData } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    const { data: itemsData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true);

    if (categoriesData) setCategories(categoriesData);
    if (itemsData) setMenuItems(itemsData);
  };

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    toast({ title: "Added to cart", description: "Item added successfully" });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [itemId, quantity]) => {
    const item = menuItems.find((i) => i.id === itemId);
    return total + (item?.price || 0) * quantity;
  }, 0);

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const placeOrder = async () => {
    if (cartItemsCount === 0) return;

    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          table_number: tableNumber,
          status: "pending",
          total_amount: cartTotal,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find((i) => i.id === itemId);
        return {
          order_id: orderData.id,
          menu_item_id: itemId,
          quantity,
          unit_price: item?.price || 0,
          special_instructions: specialInstructions || null,
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order Placed Successfully!",
        description: `Your order for table ${tableNumber} has been sent to the kitchen.`,
      });
      setCart({});
      setSpecialInstructions("");
      setCartOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Menu
            </span>
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Your Order</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">Table Number</p>
                  <p className="text-2xl font-bold text-primary">{tableNumber}</p>
                </div>

                {cartItemsCount === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {Object.entries(cart).map(([itemId, quantity]) => {
                        const item = menuItems.find((i) => i.id === itemId);
                        if (!item) return null;
                        return (
                          <div key={itemId} className="flex items-center justify-between border-b pb-2">
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ₹{item.price} × {quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(itemId)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(itemId)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Special Instructions</label>
                      <Textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special requests..."
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold mb-4">
                        <span>Total</span>
                        <span className="text-primary">₹{cartTotal.toFixed(2)}</span>
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={placeOrder}
                        disabled={loading}
                      >
                        {loading ? "Placing Order..." : "Place Order"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto px-4 py-8">
        {categories.length === 0 && menuItems.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Menu Coming Soon</h3>
              <p className="text-muted-foreground">
                Our delicious menu items will be available here shortly.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Items</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <Card key={item.id} className="shadow-card hover:shadow-elegant transition-shadow">
                    <CardHeader>
                      {item.image_url && (
                        <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {item.name}
                            {item.is_veg && <Leaf className="w-4 h-4 text-green-600" />}
                          </CardTitle>
                          <CardDescription className="mt-2">{item.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                        <Button onClick={() => addToCart(item.id)} size="sm">
                          Add to Cart
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Prep time: {item.preparation_time} mins
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuItems
                    .filter((item) => item.category_id === category.id)
                    .map((item) => (
                      <Card key={item.id} className="shadow-card hover:shadow-elegant transition-shadow">
                        <CardHeader>
                          {item.image_url && (
                            <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardTitle className="flex items-center gap-2">
                            {item.name}
                            {item.is_veg && <Leaf className="w-4 h-4 text-green-600" />}
                          </CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                            <Button onClick={() => addToCart(item.id)} size="sm">
                              Add to Cart
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Prep time: {item.preparation_time} mins
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Cart Summary Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm p-4 shadow-elegant">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{cartItemsCount} items</p>
              <p className="text-2xl font-bold text-primary">₹{cartTotal.toFixed(2)}</p>
            </div>
            <Button size="lg" onClick={() => setCartOpen(true)}>
              View Cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
