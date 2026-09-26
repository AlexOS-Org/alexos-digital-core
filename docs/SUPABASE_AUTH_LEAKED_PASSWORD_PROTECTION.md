# Supabase Auth — Leaked Password Protection

Supabase's security advisor currently reports `auth_leaked_password_protection` because leaked-password protection is disabled.

The setting is **not a database migration**. It is a Supabase Auth project configuration value named `password_hibp_enabled` and requires a Supabase Pro plan or above.

## Recommended: Supabase Management API

Use a Supabase access token with the minimum required Management API permissions:

- `auth_config_write`
- `project_admin_write`

Never commit the token or place it in repository files.

```bash
export SUPABASE_ACCESS_TOKEN='paste-your-management-token-in-your-shell-only'
export SUPABASE_PROJECT_REF='goafwbrayepaihxbqsse'

curl --fail-with-body --silent --show-error \
  --request PATCH \
  --url "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  --header "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --data '{"password_hibp_enabled":true}'
```

The request returns the Auth configuration. Do not paste the response into a public issue or commit it, because Auth configuration responses can include sensitive operational settings.

### Verify without printing the full configuration

```bash
curl --fail-with-body --silent --show-error \
  --request GET \
  --url "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  --header "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  | jq -e '.password_hibp_enabled == true'
```

A successful command exits with status `0` and prints no secret configuration.

## CLI-friendly wrapper

The Supabase CLI does not currently expose a first-class command for this Auth setting. The following shell wrapper uses the same Management API and can be saved outside the repository, for example as `~/bin/enable-supabase-hibp.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN in the shell environment}"
: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF in the shell environment}"

curl --fail-with-body --silent --show-error \
  --request PATCH \
  --url "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  --header "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --data '{"password_hibp_enabled":true}' \
  | jq -e '.password_hibp_enabled == true' >/dev/null

echo 'Supabase Auth leaked-password protection is enabled.'
```

Run it with:

```bash
chmod 700 ~/bin/enable-supabase-hibp.sh
SUPABASE_PROJECT_REF='goafwbrayepaihxbqsse' ~/bin/enable-supabase-hibp.sh
```

## Dashboard fallback

If the Management API token is unavailable:

1. Open the project's **Authentication / Providers / Email** settings.
2. Enable **Leaked password protection**.
3. Save the Auth configuration.
4. Re-run the Supabase security advisor.
5. Confirm `auth_leaked_password_protection` is no longer reported.

## Operational notes

- Existing users can still sign in with an existing password that does not meet the new requirements.
- New passwords and password changes are checked against the HaveIBeenPwned Pwned Passwords API.
- The feature rejects compromised passwords; it does not expose passwords or password hashes.
- This repository intentionally contains no Supabase Management API token.

References:

- [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
- [Supabase Auth configuration API](https://supabase.com/docs/reference/api/v1-update-auth-config)
