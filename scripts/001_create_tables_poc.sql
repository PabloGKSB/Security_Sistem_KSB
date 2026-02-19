-- POC Tablero Eléctrico - Esquema mínimo sin RFID
-- Ejecutable directamente en Supabase SQL Editor

-- Tabla de ubicaciones (catálogo simple)
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Tabla de eventos de puerta
create table if not exists public.door_events (
  id uuid primary key default gen_random_uuid(),
  door_id text not null,
  board_name text not null,
  location text not null,
  event_type text not null check (event_type in ('open', 'close')),
  created_at timestamptz not null default now(),
  details jsonb
);

-- Tabla de estado actual de la puerta
create table if not exists public.door_status (
  id uuid primary key default gen_random_uuid(),
  door_id text not null unique,
  board_name text not null,
  location text not null,
  is_open boolean not null default false,
  last_updated timestamptz not null default now(),
  event_start_time timestamptz,
  last_event_id uuid references public.door_events(id)
);

-- Tabla opcional de contactos de alerta (por ejemplo, email o teléfono)
create table if not exists public.alert_contacts (
  id uuid primary key default gen_random_uuid(),
  contact text not null,
  channel text not null default 'email', -- email, sms, etc.
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Índices para consultas frecuentes
create index if not exists door_events_created_at_idx on public.door_events(created_at desc);
create index if not exists door_events_location_idx on public.door_events(location);
create index if not exists door_status_last_updated_idx on public.door_status(last_updated desc);

