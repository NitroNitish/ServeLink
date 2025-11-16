import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Leaf, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
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

  const cartTotal = Object.entries(cart).reduce((total, [itemId, quantity]) => {
    const item = menuItems.find((i) => i.id === itemId);
    return total + (item?.price || 0) * quantity;
  }, 0);

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

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
          <Button className="relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart
            {cartItemsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                {cartItemsCount}
              </Badge>
            )}
          </Button>
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

      {/* Cart Summary */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm p-4 shadow-elegant">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{cartItemsCount} items</p>
              <p className="text-2xl font-bold text-primary">₹{cartTotal.toFixed(2)}</p>
            </div>
            <Button size="lg">Place Order</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
