-- POC Tablero Eléctrico - Semilla de ubicaciones
-- Ejecutable directamente en Supabase SQL Editor

insert into public.locations (name)
values
  ('SANTIAGO CASA MATRIZ'),
  ('ANTOFAGASTA'),
  ('COQUIMBO'),
  ('CONCEPCION'),
  ('PUERTO MONTT')
on conflict (name) do nothing;

