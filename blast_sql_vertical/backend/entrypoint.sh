#!/bin/sh
# Auto-generate CPF_ENCRYPTION_KEY if not provided.
# The key is stored in the persistent data volume so it survives restarts/updates.

KEY_FILE="/app/data/.cpf_encryption_key"

if [ -z "${CPF_ENCRYPTION_KEY:-}" ]; then
  if [ -f "$KEY_FILE" ]; then
    export CPF_ENCRYPTION_KEY
    CPF_ENCRYPTION_KEY=$(cat "$KEY_FILE")
    echo "[entrypoint] Loaded CPF_ENCRYPTION_KEY from $KEY_FILE"
  else
    export CPF_ENCRYPTION_KEY
    CPF_ENCRYPTION_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    mkdir -p "$(dirname "$KEY_FILE")"
    printf '%s' "$CPF_ENCRYPTION_KEY" > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
    echo "[entrypoint] Generated new CPF_ENCRYPTION_KEY — saved to $KEY_FILE"
    echo "[entrypoint] BACK THIS UP: $CPF_ENCRYPTION_KEY"
  fi
fi

exec "$@"
