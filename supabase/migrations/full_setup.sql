
-- Unified Supabase Setup Script for ServeLink

-- 1. Create restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'owner',
  restaurant_id UUID REFERENCES public.restaurants(id),
  access_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create menu_categories table
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  preparation_time INT DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create restaurant_tables table
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  capacity INT DEFAULT 4,
  status TEXT DEFAULT 'available',
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) DEFAULT 0,
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies

-- Restaurants
DROP POLICY IF EXISTS "Owners can manage their restaurants" ON public.restaurants;
CREATE POLICY "Owners can manage their restaurants" ON public.restaurants FOR ALL USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Public can view restaurants" ON public.restaurants;
CREATE POLICY "Public can view restaurants" ON public.restaurants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff can view their restaurant" ON public.restaurants;
CREATE POLICY "Staff can view their restaurant" ON public.restaurants FOR SELECT USING (id IN (SELECT restaurant_id FROM public.profiles WHERE user_id = auth.uid()));

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Menu & Tables
DROP POLICY IF EXISTS "Anyone can view categories" ON public.menu_categories;
CREATE POLICY "Anyone can view categories" ON public.menu_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view tables" ON public.restaurant_tables;
CREATE POLICY "Anyone can view tables" ON public.restaurant_tables FOR SELECT USING (true);

-- Orders (Restricted to Owners and Staff)
DROP POLICY IF EXISTS "Owners and Staff can view orders" ON public.orders;
CREATE POLICY "Owners and Staff can view orders" ON public.orders
FOR SELECT USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    UNION
    SELECT restaurant_id FROM public.profiles WHERE user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Order Items
DROP POLICY IF EXISTS "Owners and Staff can view order items" ON public.order_items;
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
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- 10. Triggers & Functions

-- Profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
