import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "@/pages/api/templates/[slug]";

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => mockDb),
}));

vi.mock("@/lib/moderation/moderate-template", () => ({
  moderateTemplate: vi.fn().mockResolvedValue({
    status: "approved",
    scores: { sexual: 0, hate: 0, violence: 0, harassment: 0, selfHarm: 0 },
  }),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  delete: vi.fn().mockReturnThis(),
};

function resetMockDb(): void {
  const chainMethods = ["select", "from", "where", "update", "set", "delete"] as const;
  Object.values(mockDb).forEach((fn) => fn.mockReset());
  chainMethods.forEach((method) => mockDb[method].mockReturnThis());
}

function createLocals(userId: string | null) {
  return {
    user: userId ? { id: userId } : null,
    runtime: {
      env: {
        DATABASE_URL: "postgres://test",
        TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      },
    },
  };
}

const OWNER_ID = "owner-123";
const OTHER_USER_ID = "other-user-456";
const PRIVATE_FIELDS = [
  "userId",
  "moderationStatus",
  "moderationScores",
  "isPublic",
  "flagCount",
  "contentHash",
] satisfies readonly (keyof typeof baseTemplate)[];

const baseTemplate = {
  id: "template-1",
  slug: "public-template",
  title: "Public Template",
  description: null,
  body: "This is a public template body that is long enough to pass validation.",
  isPublic: true,
  moderationStatus: "approved",
  userId: OWNER_ID,
  issueTags: [],
  linkedBillNumbers: [],
  viewCount: 10,
  useCount: 5,
  forkedFrom: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  moderationScores: null,
  flagCount: 0,
  contentHash: null,
};

function createTemplate(overrides: Partial<typeof baseTemplate> = {}) {
  return { ...baseTemplate, ...overrides };
}

const hiddenTemplates = [
  { name: "private", template: createTemplate({ slug: "private-template", isPublic: false }) },
  {
    name: "pending",
    template: createTemplate({ slug: "pending-template", moderationStatus: "pending" }),
  },
  {
    name: "rejected",
    template: createTemplate({ slug: "rejected-template", moderationStatus: "rejected" }),
  },
  {
    name: "flagged",
    template: createTemplate({ slug: "flagged-template", moderationStatus: "flagged" }),
  },
];

describe("Template Security", () => {
  beforeEach(() => {
    resetMockDb();
  });

  describe("GET - Visibility", () => {
    it("allows anyone to view public approved templates", async () => {
      mockDb.limit.mockResolvedValue([baseTemplate]);

      const response = await GET({
        params: { slug: "public-template" },
        locals: createLocals(null),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.template.slug).toBe("public-template");
    });

    it.each(hiddenTemplates)("hides $name templates from non-owners", async ({ template }) => {
      mockDb.limit.mockResolvedValue([template]);

      const response = await GET({
        params: { slug: template.slug },
        locals: createLocals(OTHER_USER_ID),
      } as never);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Template not found");
    });

    it.each(hiddenTemplates)("allows owner to view their $name template", async ({ template }) => {
      mockDb.limit.mockResolvedValue([template]);

      const response = await GET({
        params: { slug: template.slug },
        locals: createLocals(OWNER_ID),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.template.slug).toBe(template.slug);
    });

    it.each([
      { desc: "non-owners", userId: OTHER_USER_ID },
      { desc: "unauthenticated users", userId: null },
    ])("filters private fields for $desc", async ({ userId }) => {
      mockDb.limit.mockResolvedValue([baseTemplate]);

      const response = await GET({
        params: { slug: "public-template" },
        locals: createLocals(userId),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      PRIVATE_FIELDS.forEach((field) => {
        expect(data.template[field]).toBeUndefined();
      });
    });

    it("shows all fields to owner", async () => {
      mockDb.limit.mockResolvedValue([baseTemplate]);

      const response = await GET({
        params: { slug: "public-template" },
        locals: createLocals(OWNER_ID),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.template.userId).toBe(OWNER_ID);
      expect(data.template.moderationStatus).toBe("approved");
      expect(data.template.isPublic).toBe(true);
    });
  });

  describe("PUT - Authorization", () => {
    const validBody = {
      title: "Updated Title",
      body: "This is an updated template body that is long enough to pass validation.",
    };

    function createPutRequest(body: object) {
      return new Request("http://localhost/api/templates/public-template", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }

    it("returns 403 when non-owner tries to update template", async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: "template-1", userId: OWNER_ID }]);

      const response = await PUT({
        params: { slug: "public-template" },
        locals: createLocals("attacker-456"),
        request: createPutRequest(validBody),
      } as never);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Not authorized");
    });

    it("allows owner to update their template", async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: "template-1", userId: OWNER_ID }])
        .mockResolvedValueOnce([{ trustLevel: 0 }]);
      mockDb.returning.mockResolvedValue([{ ...baseTemplate, title: "Updated Title" }]);

      const response = await PUT({
        params: { slug: "public-template" },
        locals: createLocals(OWNER_ID),
        request: createPutRequest(validBody),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.template.title).toBe("Updated Title");
    });
  });

  describe("DELETE - Authorization", () => {
    it("returns 403 when non-owner tries to delete template", async () => {
      mockDb.limit.mockResolvedValue([{ id: "template-1", userId: OWNER_ID }]);

      const response = await DELETE({
        params: { slug: "public-template" },
        locals: createLocals("attacker-456"),
      } as never);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Not authorized");
    });

    it("allows owner to delete their template", async () => {
      mockDb.limit.mockResolvedValue([{ id: "template-1", userId: OWNER_ID }]);

      const response = await DELETE({
        params: { slug: "public-template" },
        locals: createLocals(OWNER_ID),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("returns 404 when template does not exist", async () => {
      mockDb.limit.mockResolvedValue([]);

      const response = await DELETE({
        params: { slug: "nonexistent-template" },
        locals: createLocals(OWNER_ID),
      } as never);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Template not found");
    });
  });
});
