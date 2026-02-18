
-- Fix order_items RLS: allow updates (for kitchen/waiter)
CREATE POLICY "Authenticated users can update order items"
ON public.order_items
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Add trigger for menu_items updated_at
CREATE OR REPLACE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for restaurants updated_at
CREATE OR REPLACE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
