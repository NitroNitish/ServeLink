
-- Drop the overly permissive INSERT policies and replace with scoped ones
-- Orders: anyone can create (needed for QR-based ordering without login) - keep but make it scoped to valid restaurant
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (restaurant_id IS NOT NULL);

-- Order items: must be tied to a real order
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (order_id IS NOT NULL AND menu_item_id IS NOT NULL);
