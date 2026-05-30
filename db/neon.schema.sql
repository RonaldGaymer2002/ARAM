-- Fundares schema for Neon Postgres (no Supabase auth/RLS/realtime)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE empresas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL,
  logo_url       text,
  contacto_email text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE perfiles (
  id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rol        text NOT NULL CHECK (rol IN ('admin', 'empresa')),
  empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  nombre     text
);

CREATE TABLE mensajes_recolector (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contenido_texto text,
  fotos_urls      text[],
  recibido_at     timestamptz DEFAULT now(),
  estado          text DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'procesando', 'extraido', 'validado', 'rechazado'))
);

CREATE TABLE extracciones (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id        uuid REFERENCES mensajes_recolector(id) ON DELETE CASCADE,
  empresa_id        uuid REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_material     text NOT NULL,
  cantidad_kg       numeric NOT NULL,
  fecha_recoleccion date NOT NULL,
  confianza_ia      numeric CHECK (confianza_ia BETWEEN 0 AND 1),
  datos_raw         jsonb,
  estado            text DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'corregido')),
  corregido_por     uuid REFERENCES users(id),
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE recolecciones (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extraccion_id     uuid REFERENCES extracciones(id) ON DELETE SET NULL,
  empresa_id        uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  tipo_material     text NOT NULL,
  cantidad_kg       numeric NOT NULL,
  fecha_recoleccion date NOT NULL,
  validado_por      uuid REFERENCES users(id),
  validado_at       timestamptz DEFAULT now()
);

CREATE TABLE contenido_educativo (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       text NOT NULL,
  tipo         text CHECK (tipo IN ('articulo', 'video', 'infografia')),
  url          text,
  contenido_md text,
  tags         text[],
  publicado    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX extracciones_estado_idx ON extracciones (estado);
CREATE INDEX extracciones_empresa_id_idx ON extracciones (empresa_id);
CREATE INDEX recolecciones_empresa_id_idx ON recolecciones (empresa_id);
CREATE INDEX recolecciones_fecha_idx ON recolecciones (fecha_recoleccion);
CREATE INDEX mensajes_estado_idx ON mensajes_recolector (estado);
