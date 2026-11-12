-- OS Accesstechnology - Schema inicial
-- Execute no Supabase: SQL Editor > New query > Run

create extension if not exists "pgcrypto";

-- Clientes
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,          -- razão social
  trade_name text,                     -- nome fantasia
  cnpj text,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  contact_name text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catálogo (materiais e serviços)
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('material','service')),
  name text not null,
  description text,
  unit text default 'un',
  unit_price numeric(12,2) not null default 0,
  cost_price numeric(12,2),            -- preço de custo/fornecedor
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orçamentos / Ordens de Serviço
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number serial,
  client_id uuid references public.clients(id) on delete set null,
  title text,                          -- objetivo
  scope text,                          -- contemplação/escopo
  quote_status text not null default 'rascunho'
    check (quote_status in ('rascunho','enviado','aprovado','reprovado','cancelado')),
  service_status text not null default 'nao_iniciado'
    check (service_status in ('nao_iniciado','agendado','em_andamento','concluido','cancelado')),
  issue_date date default current_date,
  valid_until date,
  approved_at timestamptz,
  completed_at timestamptz,
  discount numeric(12,2) not null default 0,
  notes text,
  payment_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Itens do orçamento/OS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  kind text not null check (kind in ('material','service')),
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text default 'un',
  unit_cost numeric(12,2),             -- custo (fornecedor)
  markup_percent numeric(6,2),         -- % aplicado
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Agendamentos (calendário)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  status text not null default 'agendado'
    check (status in ('agendado','confirmado','em_andamento','concluido','cancelado')),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recibos
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  number serial,
  order_id uuid references public.orders(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  issue_date date default current_date,
  amount numeric(12,2) not null default 0,
  description text,
  payment_method text,
  notes text,
  created_at timestamptz not null default now()
);

-- Financeiro / pagamentos
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  receipt_id uuid references public.receipts(id) on delete set null,
  kind text not null default 'receita' check (kind in ('receita','despesa')),
  description text,
  amount numeric(12,2) not null default 0,
  due_date date,
  paid_at date,
  status text not null default 'pendente' check (status in ('pendente','pago','cancelado')),
  method text,
  created_at timestamptz not null default now()
);

-- Configurações da empresa (singleton)
create table if not exists public.company_settings (
  id int primary key default 1 check (id = 1),
  trade_name text,
  company_name text,
  cnpj text,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  bank_info text,
  logo_url text,
  default_quote_validity_days int default 15,
  updated_at timestamptz not null default now()
);

insert into public.company_settings (id, trade_name, company_name, cnpj, address, city, state, zip, phone, email, bank_info)
values (
  1,
  'Accesstechnology',
  'RENATO ALVES DE OLIVEIRA JUNIOR 00892448504',
  '30.732.651/0001-37',
  'Rua Vinte e Oito de Junho, 118, São Conrado',
  'Aracaju',
  'SE',
  '49.042-440',
  '(79) 99658-1468',
  'renatoalvesjunior@gmail.com',
  'Inter (077) - Ag. 0001 - C/C 3834292-8'
) on conflict (id) do nothing;

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists trg_catalog_updated on public.catalog_items;
create trigger trg_catalog_updated before update on public.catalog_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_appointments_updated on public.appointments;
create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();

-- RLS (aberto para a chave anon/publishable deste app; ajuste se adicionar login)
alter table public.clients enable row level security;
alter table public.catalog_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.appointments enable row level security;
alter table public.receipts enable row level security;
alter table public.payments enable row level security;
alter table public.company_settings enable row level security;

do $$ begin
  create policy "anon_all_clients" on public.clients for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon_all_catalog_items" on public.catalog_items for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon_all_orders" on public.orders for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon_all_order_items" on public.order_items for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon_all_appointments" on public.appointments for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon_all_receipts" on public.receipts for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon_all_payments" on public.payments for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anon_all_company_settings" on public.company_settings for all using (true) with check (true);
exception when duplicate_object then null; end $$;

-- índices úteis
create index if not exists idx_orders_client on public.orders(client_id);
create index if not exists idx_orders_quote_status on public.orders(quote_status);
create index if not exists idx_orders_service_status on public.orders(service_status);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_appointments_start on public.appointments(start_at);
create index if not exists idx_receipts_order on public.receipts(order_id);
create index if not exists idx_payments_order on public.payments(order_id);
