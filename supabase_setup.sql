-- Run this script in the Supabase SQL Editor

-- 1. Create tables
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  local_id bigint,
  name text not null,
  category text not null,
  unit_price numeric not null,
  cost_price numeric not null,
  quantity_on_hand numeric not null,
  reorder_level numeric not null,
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean default false
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  local_id bigint,
  sale_date bigint not null,
  payment_method text not null,
  customer_name text,
  total_amount numeric not null,
  status text not null,
  deleted boolean default false
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  local_id bigint,
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  product_name text not null,
  unit_price_at_sale numeric not null,
  cost_price_at_sale numeric not null,
  quantity numeric not null,
  subtotal numeric not null,
  deleted boolean default false
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  local_id bigint,
  expense_date bigint not null,
  category text not null,
  amount numeric not null,
  description text,
  payment_method text not null,
  product_id uuid,
  receipt_image text,
  deleted boolean default false
);

-- 2. Turn on Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;

-- 3. Create RLS Policies
create policy "Users can only see their own products" on public.products for all using (auth.uid() = user_id);
create policy "Users can only see their own sales" on public.sales for all using (auth.uid() = user_id);
create policy "Users can only see their own sale_items" on public.sale_items for all using (auth.uid() = user_id);
create policy "Users can only see their own expenses" on public.expenses for all using (auth.uid() = user_id);
