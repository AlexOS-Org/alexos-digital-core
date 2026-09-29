import { describe, expect, it } from "vitest";
import type { Contact, Lead } from "./types";
import { filterLeads } from "./lead-filters";

const lead = (overrides: Partial<Lead> = {}): Lead =>
  ({
    id: "lead-1",
    user_id: "user-1",
    contact_id: "contact-1",
    title: "Office fit-out",
    stage: "qualified",
    value: 250_000,
    probability: 50,
    expected_close_date: null,
    source: "Referral",
    notes: "Needs a formal proposal",
    sort_order: 0,
    deleted_at: null,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  }) as Lead;

const contact = (overrides: Partial<Contact> = {}): Contact =>
  ({
    id: "contact-1",
    user_id: "user-1",
    first_name: "Amina",
    last_name: "Otieno",
    display_name: "Amina Otieno",
    email: "amina@example.com",
    phone: null,
    company: "Northstar Ltd",
    job_title: null,
    source: "Referral",
    status: "active",
    notes: null,
    tags: [],
    avatar_url: null,
    sort_order: 0,
    deleted_at: null,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  }) as Contact;

describe("filterLeads", () => {
  const contacts = new Map([["contact-1", contact()]]);

  it("returns all leads for an empty query", () => {
    const leads = [lead(), lead({ id: "lead-2", contact_id: null })];
    expect(filterLeads(leads, contacts, "  ")).toEqual(leads);
  });

  it("matches opportunity fields case-insensitively", () => {
    expect(
      filterLeads(
        [lead(), lead({ id: "lead-2", title: "Retail renewal", notes: null })],
        contacts,
        "PROPOSAL",
      ),
    ).toHaveLength(1);
  });

  it("matches linked contact details", () => {
    expect(
      filterLeads([lead(), lead({ id: "lead-2", contact_id: null })], contacts, "northstar"),
    ).toEqual([lead()]);
  });

  it("does not match unrelated opportunities", () => {
    expect(filterLeads([lead({ contact_id: null })], contacts, "unknown")).toEqual([]);
  });
});
