# Operaciones — Murales Decorativos

Guía corta de qué tener listo antes y después del lanzamiento público.

## Antes del lanzamiento (checklist)

- [ ] Variables de entorno en Vercel (Production):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
  - (opcional) `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Aplicar migración `20260426000000_rate_limits_and_storage_limits.sql` en Supabase Cloud (`supabase db push`).
- [ ] Verificar que el bucket `murales` quedó con `file_size_limit = 5 MB` y `allowed_mime_types` restringido.
- [ ] Crear el usuario admin en Supabase Auth y validar `/admin/login`.
- [ ] Activar **backups automáticos diarios** del proyecto Supabase (Settings → Database → Backups). El plan Free no garantiza retención larga; considerá Pro o un job de `pg_dump` semanal a almacenamiento externo.
- [ ] Configurar un cron de keepalive contra `/api/ping` (Vercel Cron o GitHub Actions).
- [ ] Probar formularios `/nuevo` y `/reportar` con captcha activado.

## Moderación de imágenes

El bucket `murales` permite INSERT público (necesario para reportes anónimos). Mitigaciones ya implementadas:

- Validación MIME + extensión + tamaño (5 MB) en `app/api/upload/route.ts`.
- Bucket con `allowed_mime_types` y `file_size_limit` aplicados desde la migración.
- Rate limit persistente vía `rate_limit_hit` (Postgres) en cada POST público.
- Cloudflare Turnstile en los formularios cuando `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está configurado.

Quedan dos capas opcionales según presupuesto:

1. **Moderación automática previa al INSERT en `murales`**: usar un trigger o un edge function que llame a un servicio (AWS Rekognition `DetectModerationLabels`, Google Vision SafeSearch, Sightengine). Se sugiere ejecutarlo de forma asíncrona y, ante un score alto, dejar el mural en `rechazado` automáticamente y registrar en `auditoria`.
2. **Revisión manual**: el flujo actual ya exige aprobación admin antes de mostrar al público (`estado = pendiente`). Asegurate de que ningún rol salte ese paso.

## Backups

- **DB (gratis)**: workflow [.github/workflows/db-backup.yml](../.github/workflows/db-backup.yml) ya creado. Corre los domingos 04:30 UTC, dumpea `public + storage`, sube `.sql.gz` a la rama `backups` y poda dumps de más de 12 semanas. Requiere 3 secrets en GitHub:
  - `SUPABASE_ACCESS_TOKEN` — Personal Access Token de https://supabase.com/dashboard/account/tokens
  - `SUPABASE_DB_PASSWORD` — la del proyecto (Settings → Database → Connection string → password)
  - `SUPABASE_PROJECT_REF` — `cjxrvkifkmuuudovfzuz`
- **DB (Pro)**: Settings → Database → Backups habilita PITR diario con retención de 7 días. El workflow gratis sigue siendo útil como copia off-site.
- **Storage**: el bucket `murales` no se backupea automáticamente. Para protegerlo, sumá un step extra al workflow que use `supabase storage cp -r ss:/murales ./backups/murales-$STAMP` o réplica con rclone a R2/S3.
- **Auditoría**: la tabla `auditoria` es append-only y se backupea junto con la DB.

## Observabilidad — Sentry

Ya integrado. `lib/observability.ts` expone `captureException` y `captureMessage`; cuando `SENTRY_DSN` está definida, `instrumentation.ts` reemplaza el reporter por defecto (console) por uno que delega en Sentry.

Archivos:

- [`instrumentation.ts`](../instrumentation.ts) — registra Sentry para Node/Edge runtimes y conecta el reporter de `lib/observability.ts`.
- [`instrumentation-client.ts`](../instrumentation-client.ts) — Sentry para el browser, con Replay enmascarado.
- [`sentry.server.config.ts`](../sentry.server.config.ts), [`sentry.edge.config.ts`](../sentry.edge.config.ts).
- [`next.config.ts`](../next.config.ts) — wrap con `withSentryConfig` solo si `SENTRY_DSN`, `SENTRY_ORG` y `SENTRY_PROJECT` están definidas.

Pasos para activarlo:

1. Crear proyecto Next.js gratis en [sentry.io](https://sentry.io).
2. En Vercel agregar las variables: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (auth token con scope `project:write`).
3. Redeploy. Sin estas vars, Sentry queda desactivado y los errores siguen yendo a `console`.

`tunnelRoute: "/monitoring"` está activo en `withSentryConfig` para evitar bloqueos de adblockers.

## Rate limit

- **In-memory** (`proxy.ts`): primera barrera, por instancia, sin coordinación. Útil para ráfagas.
- **Persistente** (`lib/rate-limit.ts` + RPC `rate_limit_hit`): atómico en Postgres, compartido entre instancias. Activo en `POST /api/upload`, `POST /api/murales`, `POST /api/murales/[id]/report`.
- Limpieza: invocar `select rate_limits_purge();` semanalmente (ej. Vercel Cron a un endpoint `/api/admin/purge-rate-limits`).
