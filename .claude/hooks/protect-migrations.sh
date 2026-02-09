#!/bin/bash
# Blocks manual creation of drizzle migration files
# Use: pnpm db:generate (schema) or pnpm drizzle-kit generate --custom --name=<name> (data)

INPUT=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == */drizzle/*.sql ]] || [[ "$FILE_PATH" == */drizzle/meta/*.json ]]; then
  # Allow editing existing files (e.g. custom migration SQL); only block creating new ones
  if [ -e "$FILE_PATH" ]; then
    exit 0
  fi
  jq -n '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": "BLOCKED: Do not create migration files manually. Use: pnpm db:generate (schema) or pnpm drizzle-kit generate --custom --name=<name> (data)"
    }
  }'
  exit 0
fi

exit 0
