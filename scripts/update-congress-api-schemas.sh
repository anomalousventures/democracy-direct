#!/bin/bash
set -e

# Fetch the latest swagger spec
curl -sL "https://raw.githubusercontent.com/LibraryOfCongress/api.congress.gov/main/Documentation/swagger.yaml" -o /tmp/congress-api-swagger.yaml || { echo 'Failed to download swagger spec'; exit 1; }

# Generate Zod schemas
npx openapi-zod-client /tmp/congress-api-swagger.yaml -o src/lib/generated/congress-api.ts

# Format the generated file
pnpm exec prettier --write src/lib/generated/congress-api.ts

echo "Congress API schemas updated successfully"
