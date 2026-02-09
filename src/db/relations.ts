import { relations } from "drizzle-orm";
import {
  users,
  sessions,
  templates,
  templateFlags,
  moderationLog,
  userTemplates,
  issueTags,
  templateIssueTags,
  templateUses,
  legislators,
  bills,
  amendments,
  votes,
  memberVotes,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  templates: many(templates),
  templateFlags: many(templateFlags),
  moderationLogs: many(moderationLog),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  author: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
  flags: many(templateFlags),
  moderationLogs: many(moderationLog),
  issueTags: many(templateIssueTags),
  uses: many(templateUses),
}));

export const templateFlagsRelations = relations(templateFlags, ({ one }) => ({
  template: one(templates, {
    fields: [templateFlags.templateId],
    references: [templates.id],
  }),
  user: one(users, {
    fields: [templateFlags.userId],
    references: [users.id],
  }),
}));

export const moderationLogRelations = relations(moderationLog, ({ one }) => ({
  template: one(templates, {
    fields: [moderationLog.templateId],
    references: [templates.id],
  }),
  admin: one(users, {
    fields: [moderationLog.adminId],
    references: [users.id],
  }),
}));

export const userTemplatesRelations = relations(userTemplates, ({ one }) => ({
  user: one(users, {
    fields: [userTemplates.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [userTemplates.templateId],
    references: [templates.id],
  }),
}));

export const issueTagsRelations = relations(issueTags, ({ one, many }) => ({
  suggestedByUser: one(users, {
    fields: [issueTags.suggestedBy],
    references: [users.id],
    relationName: "suggestedTags",
  }),
  approvedByUser: one(users, {
    fields: [issueTags.approvedBy],
    references: [users.id],
    relationName: "approvedTags",
  }),
  templateIssueTags: many(templateIssueTags),
}));

export const templateIssueTagsRelations = relations(templateIssueTags, ({ one }) => ({
  template: one(templates, {
    fields: [templateIssueTags.templateId],
    references: [templates.id],
  }),
  issueTag: one(issueTags, {
    fields: [templateIssueTags.issueTagId],
    references: [issueTags.id],
  }),
}));

export const templateUsesRelations = relations(templateUses, ({ one }) => ({
  template: one(templates, {
    fields: [templateUses.templateId],
    references: [templates.id],
  }),
}));

export const legislatorsRelations = relations(legislators, ({ many }) => ({
  bills: many(bills),
  amendments: many(amendments),
  memberVotes: many(memberVotes),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  sponsor: one(legislators, {
    fields: [bills.sponsorBioguideId],
    references: [legislators.bioguideId],
  }),
  amendments: many(amendments),
  votes: many(votes),
}));

export const amendmentsRelations = relations(amendments, ({ one, many }) => ({
  sponsor: one(legislators, {
    fields: [amendments.sponsorBioguideId],
    references: [legislators.bioguideId],
  }),
  amendedBill: one(bills, {
    fields: [amendments.amendedBillId],
    references: [bills.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one, many }) => ({
  bill: one(bills, {
    fields: [votes.billId],
    references: [bills.id],
  }),
  amendment: one(amendments, {
    fields: [votes.amendmentId],
    references: [amendments.id],
  }),
  memberVotes: many(memberVotes),
}));

export const memberVotesRelations = relations(memberVotes, ({ one }) => ({
  vote: one(votes, {
    fields: [memberVotes.voteId],
    references: [votes.id],
  }),
  legislator: one(legislators, {
    fields: [memberVotes.bioguideId],
    references: [legislators.bioguideId],
  }),
}));
