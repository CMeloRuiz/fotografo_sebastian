-- ============================================================
--  Sebastián Sisa | Esquema de base de datos (Supabase/Postgres)
-- ------------------------------------------------------------
--  Ejecutar completo en el SQL Editor de Supabase.
--  Es idempotente: se puede volver a correr sin romper nada.
--
--  NOTA DE PRIVACIDAD: aquí no entra ninguna foto de clientes del
--  sitio antiguo. Los álbumes y fotos marcados is_demo = true son
--  material de ejemplo y el fotógrafo los reemplaza desde el panel.
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Utilidad: mantener updated_at al día ─────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Administradores ──────────────────────────────────────────
-- Un solo usuario (el fotógrafo), pero la tabla admite más por si
-- en el futuro entra un asistente.
create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists admins_updated_at on admins;
create trigger admins_updated_at before update on admins
  for each row execute function set_updated_at();

-- ── Álbumes ──────────────────────────────────────────────────
create table if not exists albums (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  category      text not null,
  event_date    date,
  description   text,
  cover_photo_id uuid,            -- FK diferida: photos aún no existe
  is_published  boolean not null default false,
  is_featured   boolean not null default false,
  is_demo       boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists albums_updated_at on albums;
create trigger albums_updated_at before update on albums
  for each row execute function set_updated_at();

-- ── Fotos ────────────────────────────────────────────────────
-- variants guarda el JSON que el frontend necesita para <picture>:
--   { "avif": [{"w":480,"url":"..."}], "webp": [...], "fallback": "..." }
-- Se genera en el backend con sharp al subir, no se calcula al vuelo.
create table if not exists photos (
  id            uuid primary key default gen_random_uuid(),
  album_id      uuid not null references albums(id) on delete cascade,
  storage_path  text not null,
  variants      jsonb not null default '{}'::jsonb,
  width         integer,
  height        integer,
  blur_placeholder text,
  title         text,
  alt           text,
  is_featured   boolean not null default false,
  is_demo       boolean not null default false,
  sort_order    integer not null default 0,
  bytes         bigint,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists photos_updated_at on photos;
create trigger photos_updated_at before update on photos
  for each row execute function set_updated_at();

-- La portada se fija ahora que photos existe. on delete set null evita
-- que borrar la foto de portada deje el álbum apuntando al vacío.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'albums_cover_photo_fk'
  ) then
    alter table albums
      add constraint albums_cover_photo_fk
      foreign key (cover_photo_id) references photos(id) on delete set null;
  end if;
end;
$$;

create index if not exists photos_album_idx    on photos (album_id, sort_order);
create index if not exists albums_category_idx on albums (category) where is_published;
create index if not exists albums_order_idx    on albums (sort_order);

-- ── Contenido editable del sitio ─────────────────────────────
-- Clave/valor en JSON: hero, about, contact, social, seo, etc.
-- Así el panel puede editar textos nuevos sin migraciones.
create table if not exists site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_content_updated_at on site_content;
create trigger site_content_updated_at before update on site_content
  for each row execute function set_updated_at();

-- ── Testimonios ──────────────────────────────────────────────
create table if not exists testimonials (
  id           uuid primary key default gen_random_uuid(),
  author       text not null,
  event_type   text,
  text         text not null,
  is_published boolean not null default true,
  is_demo      boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists testimonials_updated_at on testimonials;
create trigger testimonials_updated_at before update on testimonials
  for each row execute function set_updated_at();

-- ── Servicios / paquetes ─────────────────────────────────────
create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  features    jsonb not null default '[]'::jsonb,
  price_label text default 'Cotizar',
  image_key   text,
  sort_order  integer not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists services_updated_at on services;
create trigger services_updated_at before update on services
  for each row execute function set_updated_at();

-- ── Mensajes del formulario de contacto ──────────────────────
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  event_type text,
  event_date date,
  message    text not null,
  status     text not null default 'nuevo'
             check (status in ('nuevo', 'respondido', 'archivado')),
  created_at timestamptz not null default now()
);

create index if not exists contact_status_idx on contact_messages (status, created_at desc);

-- ============================================================
--  Row Level Security
-- ------------------------------------------------------------
--  El backend usa la service_role key, que ignora RLS. Las
--  políticas de abajo existen para que, si alguna vez se consulta
--  con la anon key desde el navegador, solo se pueda LEER lo
--  publicado y nunca escribir ni ver los mensajes de contacto.
-- ============================================================

alter table albums           enable row level security;
alter table photos           enable row level security;
alter table site_content     enable row level security;
alter table testimonials     enable row level security;
alter table services         enable row level security;
alter table contact_messages enable row level security;
alter table admins           enable row level security;

drop policy if exists "albums publicos" on albums;
create policy "albums publicos" on albums
  for select using (is_published = true);

drop policy if exists "fotos de albums publicos" on photos;
create policy "fotos de albums publicos" on photos
  for select using (
    exists (select 1 from albums a where a.id = photos.album_id and a.is_published)
  );

drop policy if exists "contenido publico" on site_content;
create policy "contenido publico" on site_content for select using (true);

drop policy if exists "testimonios publicados" on testimonials;
create policy "testimonios publicados" on testimonials
  for select using (is_published = true);

drop policy if exists "servicios publicados" on services;
create policy "servicios publicados" on services
  for select using (is_published = true);

-- contact_messages y admins quedan sin políticas: con la anon key
-- no son legibles ni escribibles. Solo el backend los toca.
