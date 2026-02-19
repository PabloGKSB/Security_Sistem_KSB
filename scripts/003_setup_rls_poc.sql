-- POC Tablero Eléctrico - RLS básica
-- Nota: para producción se recomienda usar Service Role en el backend

-- Habilitar RLS
alter table public.door_events enable row level security;
alter table public.door_status enable row level security;
alter table public.locations enable row level security;
alter table public.alert_contacts enable row level security;

-- Políticas simples y permisivas para POC (lectura/escritura abierta)

-- door_events: insertar y leer
drop policy if exists "poc_insert_door_events" on public.door_events;
create policy "poc_insert_door_events"
  on public.door_events
  for insert
  with check (true);

drop policy if exists "poc_select_door_events" on public.door_events;
create policy "poc_select_door_events"
  on public.door_events
  for select
  using (true);

-- door_status: leer y actualizar
drop policy if exists "poc_select_door_status" on public.door_status;
create policy "poc_select_door_status"
  on public.door_status
  for select
  using (true);

drop policy if exists "poc_update_door_status" on public.door_status;
create policy "poc_update_door_status"
  on public.door_status
  for update
  using (true)
  with check (true);

-- locations: solo lectura
drop policy if exists "poc_select_locations" on public.locations;
create policy "poc_select_locations"
  on public.locations
  for select
  using (true);

-- alert_contacts: opcional, solo lectura e inserción para pruebas
drop policy if exists "poc_select_alert_contacts" on public.alert_contacts;
create policy "poc_select_alert_contacts"
  on public.alert_contacts
  for select
  using (true);

drop policy if exists "poc_insert_alert_contacts" on public.alert_contacts;
create policy "poc_insert_alert_contacts"
  on public.alert_contacts
  for insert
  with check (true);

