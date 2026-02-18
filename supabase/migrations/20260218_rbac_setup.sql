
-- Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;

-- Allow staff to view their restaurant
CREATE POLICY "Staff can view their restaurant" ON public.restaurants
FOR SELECT USING (
  id IN (SELECT restaurant_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Update orders policy to be more restrictive (currently it's set to true for select)
-- We want owners and staff of THAT restaurant to see the orders.
DROP POLICY "Anyone can view orders" ON public.orders;
CREATE POLICY "Owners and Staff can view orders" ON public.orders
FOR SELECT USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    UNION
    SELECT restaurant_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Update order_items policy
DROP POLICY "Anyone can view order items" ON public.order_items;
CREATE POLICY "Owners and Staff can view order items" ON public.order_items
FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders WHERE restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
