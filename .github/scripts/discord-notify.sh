#!/usr/bin/env bash
set -euo pipefail

TITLE=""
COLOR=""
DESCRIPTION=""
BUTTONS=()
FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --title) TITLE="$2"; shift 2 ;;
    --color) COLOR="$2"; shift 2 ;;
    --description) DESCRIPTION="$2"; shift 2 ;;
    --button) BUTTONS+=("$2"); shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [ -z "${DISCORD_WEBHOOK:-}" ]; then
  echo "DISCORD_WEBHOOK not set, skipping notification"
  exit 0
fi

if [ -z "$TITLE" ] || [ -z "$COLOR" ] || [ -z "$DESCRIPTION" ]; then
  echo "Missing required args: --title, --color, --description" >&2
  exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
WEBHOOK_URL="$DISCORD_WEBHOOK"

BUTTONS_JSON="[]"
if [ ${#BUTTONS[@]} -gt 0 ]; then
  BUTTONS_JSON=$(printf '%s\n' "${BUTTONS[@]}" | jq -R 'split("|") | {type: 2, style: 5, label: .[0], url: (.[1:] | join("|"))}' | jq -s '.')
  WEBHOOK_URL="${WEBHOOK_URL}?with_components=true"
fi

PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --argjson color "$COLOR" \
  --arg description "$DESCRIPTION" \
  --arg timestamp "$TIMESTAMP" \
  --argjson buttons "$BUTTONS_JSON" \
  '{
    username: "DD Notification Bot",
    avatar_url: "https://democracy-direct.com/logo-square.png",
    embeds: [{
      title: $title,
      color: $color,
      description: $description,
      footer: { text: "Democracy Direct CI" },
      timestamp: $timestamp
    }]
  } + if ($buttons | length) > 0 then {
    components: [{ type: 1, components: $buttons }]
  } else {} end')

if [ -n "$FILE" ] && [ -f "$FILE" ]; then
  curl -fsS -F "payload_json=$PAYLOAD" -F "file1=@$FILE" "$WEBHOOK_URL"
else
  curl -fsS -H "Content-Type: application/json" -d "$PAYLOAD" "$WEBHOOK_URL"
fi
