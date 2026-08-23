#!/usr/bin/env bash
set -Eeuo pipefail

# Harden Supabase Auth and owner-only SECURITY DEFINER RPCs.
#
# Default mode is DRY RUN. Nothing is changed unless --apply is supplied.
# Required for --apply/--verify:
#   SUPABASE_ACCESS_TOKEN  Supabase Management API PAT/OAuth token
#   SUPABASE_PROJECT_REF   Supabase project ref, e.g. goafwbrayepaihxbqsse
#   ALEXOS_OWNER_EMAILS    Comma-separated owner email allowlist
#
# The token is never printed. Backups contain Auth config and function DDL,
# but no credentials; keep the backup directory private.

API_BASE="https://api.supabase.com/v1"
BACKUP_DIR="${BACKUP_DIR:-.supabase-hardening-backups}"
MODE="dry-run"

usage() {
  cat <<'USAGE'
Usage:
  scripts/harden-supabase-auth-and-rpcs.sh [--dry-run|--apply|--verify]

Modes:
  --dry-run  Validate inputs and print the planned operations without changing Supabase (default).
  --apply    Back up current state, enable HIBP protection, install the owner guard, and verify.
  --verify   Read current Auth config and RPC grants/definitions, without changing anything.

Required environment variables for --apply and --verify:
  SUPABASE_ACCESS_TOKEN
  SUPABASE_PROJECT_REF
  ALEXOS_OWNER_EMAILS   Comma-separated emails, for example owner@example.com
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) MODE="dry-run" ;;
    --apply) MODE="apply" ;;
    --verify) MODE="verify" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}

require_cmd curl
require_cmd jq

if [[ "$MODE" != "dry-run" ]]; then
  : "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN; it is never printed}"
  : "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF}"
fi

if [[ "$MODE" == "apply" || "$MODE" == "dry-run" ]]; then
  : "${ALEXOS_OWNER_EMAILS:?Set ALEXOS_OWNER_EMAILS to the approved owner email allowlist}"
fi

if [[ -n "${SUPABASE_PROJECT_REF:-}" && ! "$SUPABASE_PROJECT_REF" =~ ^[a-z0-9]{15,30}$ ]]; then
  echo "SUPABASE_PROJECT_REF has an unexpected format" >&2
  exit 2
fi

owner_values=""
if [[ -n "${ALEXOS_OWNER_EMAILS:-}" ]]; then
  IFS=',' read -r -a owner_emails <<< "$ALEXOS_OWNER_EMAILS"
  ((${#owner_emails[@]} > 0)) || { echo "ALEXOS_OWNER_EMAILS is empty" >&2; exit 2; }
  for raw_email in "${owner_emails[@]}"; do
    email="${raw_email#${raw_email%%[![:space:]]*}}"
    email="${email%${email##*[![:space:]]}}"
    if [[ ! "$email" =~ ^[^,[:space:]\'\"]+@[^,[:space:]\'\"]+$ ]]; then
      echo "Invalid owner email format in ALEXOS_OWNER_EMAILS" >&2
      exit 2
    fi
    [[ -z "$owner_values" ]] || owner_values+=","
    owner_values+="'${email//\'/\'\'}'"
  done
fi

api() {
  local method="$1" path="$2" body="${3:-}" response_file="$4"
  local status
  if [[ -n "$body" ]]; then
    status="$(curl -sS -o "$response_file" -w '%{http_code}' -X "$method" \
      "$API_BASE$path" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H 'Content-Type: application/json' \
      --data "$body")"
  else
    status="$(curl -sS -o "$response_file" -w '%{http_code}' -X "$method" \
      "$API_BASE$path" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN")"
  fi
  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    echo "Supabase Management API request failed: HTTP $status ($method $path)" >&2
    jq -r 'if type == "object" then (.message // .error // "No response detail") else "No response detail" end' "$response_file" 2>/dev/null || true
    return 1
  fi
}

sql_payload() {
  jq -n --arg query "$1" '{query:$query, parameters:[], read_only:false}'
}

AUTH_CONFIG_JSON=""
if [[ "$MODE" != "dry-run" ]]; then
  tmp_auth="$(mktemp)"
  tmp_sql=""
  tmp_result=""
  trap 'rm -f "$tmp_auth" "$tmp_sql" "$tmp_result"' EXIT
  api GET "/projects/$SUPABASE_PROJECT_REF/config/auth" "" "$tmp_auth"
  AUTH_CONFIG_JSON="$(cat "$tmp_auth")"
  current_hibp="$(jq -r '.password_hibp_enabled // false' "$tmp_auth")"
  echo "Current password_hibp_enabled: $current_hibp"
fi

cat <<'PLAN'
Planned operations:
1. Back up the current Auth configuration and target function definitions.
2. PATCH Auth configuration with password_hibp_enabled=true.
3. Create a private owner-email allowlist used only by the guarded RPCs.
4. Add a SECURITY DEFINER helper with explicit search_path that checks auth.jwt().
5. Add the owner check to these RPC families:
   - dg_confirm_order_payment
   - dg_record_order_fulfilment (both overloads)
   - dg_refund_or_void_order_payment
   - dg_update_admin_order
6. Preserve authenticated execution for approved owners, revoke anonymous execution,
   and verify the resulting grants and function definitions.
PLAN

if [[ "$MODE" == "dry-run" ]]; then
  echo "DRY RUN: no Supabase request was sent."
  exit 0
fi

if [[ "$MODE" == "verify" ]]; then
  echo "Auth config (only the relevant flag):"
  jq '{password_hibp_enabled}' <<<"$AUTH_CONFIG_JSON"
  verify_sql=$(cat <<'SQL'
select json_build_object(
  'function_name', p.proname,
  'arguments', pg_get_function_identity_arguments(p.oid),
  'security_definer', p.prosecdef,
  'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
  'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
  'owner_guard_present', position('private.alexos_is_owner()' in pg_get_functiondef(p.oid)) > 0
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('dg_confirm_order_payment','dg_record_order_fulfilment',
                    'dg_refund_or_void_order_payment','dg_update_admin_order')
order by p.proname, pg_get_function_identity_arguments(p.oid)
limit 20;
SQL
)
  tmp_result="$(mktemp)"
  api POST "/projects/$SUPABASE_PROJECT_REF/database/query" "$(sql_payload "$verify_sql")" "$tmp_result"
  jq . "$tmp_result"
  exit 0
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_auth="$BACKUP_DIR/auth-config-$stamp.json"
backup_sql="$BACKUP_DIR/rpc-definitions-$stamp.sql"
cp "$tmp_auth" "$backup_auth"

backup_query=$(cat <<'SQL'
select pg_get_functiondef(p.oid) || E'\n'
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('dg_confirm_order_payment','dg_record_order_fulfilment',
                    'dg_refund_or_void_order_payment','dg_update_admin_order')
order by p.proname, pg_get_function_identity_arguments(p.oid)
limit 20;
SQL
)
tmp_result="$(mktemp)"
api POST "/projects/$SUPABASE_PROJECT_REF/database/query" "$(sql_payload "$backup_query")" "$tmp_result"
jq -r '.[]? | .[0]? // empty' "$tmp_result" > "$backup_sql"
chmod 600 "$backup_auth" "$backup_sql"

patch_body='{"password_hibp_enabled":true}'
tmp_patch="$(mktemp)"
api PATCH "/projects/$SUPABASE_PROJECT_REF/config/auth" "$patch_body" "$tmp_patch"

owner_sql=$(cat <<SQL
begin;

create schema if not exists private;

create table if not exists private.alexos_owner_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.alexos_owner_emails from public, anon, authenticated;

insert into private.alexos_owner_emails (email)
values ($owner_values)
on conflict (email) do nothing;

create or replace function private.alexos_is_owner()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as \$function\$
  select coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1
      from private.alexos_owner_emails
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
\$function\$;

revoke all on function private.alexos_is_owner() from public, anon, authenticated;
grant execute on function private.alexos_is_owner() to authenticated, service_role;

-- Add an idempotent owner check immediately after BEGIN while preserving each
-- function's existing accounting, ownership and idempotency logic.
do \$do\$
declare
  r record;
  ddl text;
  begin_pos integer;
  guard text := E'\n  IF NOT private.alexos_is_owner() THEN\n    RAISE EXCEPTION ''AlexOS owner authorization required'';\n  END IF;\n';
begin
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('dg_confirm_order_payment','dg_record_order_fulfilment',
                        'dg_refund_or_void_order_payment','dg_update_admin_order')
      and p.prosecdef
  loop
    ddl := pg_get_functiondef(r.oid);
    if position('private.alexos_is_owner()' in ddl) = 0 then
      begin_pos := position(E'\nBEGIN' in ddl);
      if begin_pos = 0 then
        raise exception 'Could not find BEGIN in % (%)', r.proname, r.args;
      end if;
      ddl := left(ddl, begin_pos + length(E'\nBEGIN')) || guard || substr(ddl, begin_pos + length(E'\nBEGIN') + 1);
      execute ddl;
    end if;
    execute format('revoke all on function public.%I(%s) from public, anon', r.proname, r.args);
    execute format('grant execute on function public.%I(%s) to authenticated', r.proname, r.args);
  end loop;
end
\$do\$;

commit;
SQL
)
api POST "/projects/$SUPABASE_PROJECT_REF/database/query" "$(sql_payload "$owner_sql")" "$tmp_result"

verify_sql=$(cat <<'SQL'
select json_build_object(
  'function_name', p.proname,
  'arguments', pg_get_function_identity_arguments(p.oid),
  'security_definer', p.prosecdef,
  'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
  'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
  'owner_guard_present', position('private.alexos_is_owner()' in pg_get_functiondef(p.oid)) > 0
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('dg_confirm_order_payment','dg_record_order_fulfilment',
                    'dg_refund_or_void_order_payment','dg_update_admin_order')
order by p.proname, pg_get_function_identity_arguments(p.oid)
limit 20;
SQL
)
api POST "/projects/$SUPABASE_PROJECT_REF/database/query" "$(sql_payload "$verify_sql")" "$tmp_result"

final_hibp="$(curl -sS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" "$API_BASE/projects/$SUPABASE_PROJECT_REF/config/auth" | jq -r '.password_hibp_enabled // false')"
if [[ "$final_hibp" != "true" ]]; then
  echo "Verification failed: password_hibp_enabled is not true" >&2
  exit 1
fi

echo "Applied and verified. Backups saved under: $BACKUP_DIR"
jq . "$tmp_result"
