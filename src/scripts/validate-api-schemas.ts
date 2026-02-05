/**
 * Validates our Zod schemas against live Congress.gov API responses.
 * Run daily via GitHub Actions to detect API breaking changes.
 *
 * Usage: pnpm tsx src/scripts/validate-api-schemas.ts
 */

import "dotenv/config";
import { createCongressClient } from "@/lib/congress-api";

interface ValidationResult {
  schema: string;
  endpoint: string;
  success: boolean;
  error?: string;
}

async function validateSchemas(): Promise<ValidationResult[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    throw new Error("CONGRESS_API_KEY environment variable is required");
  }

  const client = createCongressClient({ apiKey, minDelayMs: 200 });
  const results: ValidationResult[] = [];

  const tests: Array<{
    name: string;
    endpoint: string;
    fn: () => Promise<unknown>;
  }> = [
    {
      name: "BillListResponse",
      endpoint: "/bill?limit=1",
      fn: () => client.listBills({ limit: 1 }),
    },
    {
      name: "BillDetailResponse",
      endpoint: "/bill/119/hr/1",
      fn: () => client.getBill(119, "hr", 1),
    },
    {
      name: "BillSummariesResponse",
      endpoint: "/bill/119/hr/1/summaries",
      fn: () => client.getBillSummaries(119, "hr", 1),
    },
    {
      name: "HouseVoteListResponse",
      endpoint: "/house-vote/119/1?limit=1",
      fn: () => client.listHouseVotes(119, 1, { limit: 1 }),
    },
    {
      name: "HouseVoteResponse",
      endpoint: "/house-vote/119/1/1",
      fn: () => client.getHouseVote(119, 1, 1),
    },
    {
      name: "HouseVoteMembersResponse",
      endpoint: "/house-vote/119/1/1/members",
      fn: () => client.getHouseVoteMembers(119, 1, 1),
    },
    {
      name: "AmendmentDetailResponse",
      endpoint: "/amendment/119/samdt/1",
      fn: () => client.getAmendment(119, "samdt", "1"),
    },
    {
      name: "SponsoredLegislationResponse",
      endpoint: "/member/B001230/sponsored-legislation?limit=1",
      fn: () => client.getSponsoredBills("B001230", { limit: 1 }),
    },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      results.push({
        schema: test.name,
        endpoint: test.endpoint,
        success: true,
      });
      console.log(`✓ ${test.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        schema: test.name,
        endpoint: test.endpoint,
        success: false,
        error: message,
      });
      console.error(`✗ ${test.name}: ${message}`);
    }
  }

  return results;
}

async function main(): Promise<void> {
  console.log("Validating Congress API schemas against live responses...\n");

  try {
    const results = await validateSchemas();

    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\n${"─".repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      console.log("\nFailed schemas:");
      for (const result of results.filter((r) => !r.success)) {
        console.log(`  - ${result.schema} (${result.endpoint})`);
        console.log(`    Error: ${result.error}`);
      }
      process.exit(1);
    }

    console.log("\nAll schemas validated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Validation failed:", error);
    process.exit(1);
  }
}

main();
