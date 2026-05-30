import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const empresas = pgTable('empresas', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: text('nombre').notNull(),
  logoUrl: text('logo_url'),
  contactoEmail: text('contacto_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const perfiles = pgTable('perfiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  rol: text('rol').notNull(),
  empresaId: uuid('empresa_id').references(() => empresas.id, { onDelete: 'set null' }),
  nombre: text('nombre'),
});

export const mensajesRecolector = pgTable('mensajes_recolector', {
  id: uuid('id').defaultRandom().primaryKey(),
  contenidoTexto: text('contenido_texto'),
  fotosUrls: text('fotos_urls').array(),
  recibidoAt: timestamp('recibido_at', { withTimezone: true }).defaultNow(),
  estado: text('estado').default('pendiente'),
});

export const extracciones = pgTable('extracciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  mensajeId: uuid('mensaje_id').references(() => mensajesRecolector.id, { onDelete: 'cascade' }),
  empresaId: uuid('empresa_id').references(() => empresas.id, { onDelete: 'cascade' }),
  tipoMaterial: text('tipo_material').notNull(),
  cantidadKg: numeric('cantidad_kg').notNull(),
  fechaRecoleccion: date('fecha_recoleccion').notNull(),
  confianzaIa: numeric('confianza_ia'),
  datosRaw: jsonb('datos_raw').$type<Record<string, unknown> | null>(),
  estado: text('estado').default('pendiente'),
  corregidoPor: uuid('corregido_por').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const recolecciones = pgTable('recolecciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  extraccionId: uuid('extraccion_id').references(() => extracciones.id, { onDelete: 'set null' }),
  empresaId: uuid('empresa_id')
    .notNull()
    .references(() => empresas.id, { onDelete: 'cascade' }),
  tipoMaterial: text('tipo_material').notNull(),
  cantidadKg: numeric('cantidad_kg').notNull(),
  fechaRecoleccion: date('fecha_recoleccion').notNull(),
  validadoPor: uuid('validado_por').references(() => users.id),
  validadoAt: timestamp('validado_at', { withTimezone: true }).defaultNow(),
});

export const contenidoEducativo = pgTable('contenido_educativo', {
  id: uuid('id').defaultRandom().primaryKey(),
  titulo: text('titulo').notNull(),
  tipo: text('tipo'),
  url: text('url'),
  contenidoMd: text('contenido_md'),
  tags: text('tags').array(),
  publicado: boolean('publicado').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
