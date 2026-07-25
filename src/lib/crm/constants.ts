import type { ContactStatus, LeadStage, CrmActivityType } from "./types";

export const LEAD_STAGES: { value: LeadStage; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-slate-500" },
  { value: "contacted", label: "Contacted", color: "bg-blue-500" },
  { value: "qualified", label: "Qualified", color: "bg-indigo-500" },
  { value: "proposal", label: "Proposal", color: "bg-violet-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { value: "won", label: "Won", color: "bg-emerald-500" },
  { value: "lost", label: "Lost", color: "bg-rose-500" },
];

export const CONTACT_STATUSES: { value: ContactStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export const ACTIVITY_TYPES: { value: CrmActivityType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
  { value: "other", label: "Other" },
];

export const CONTACT_SOURCES = [
  "Website",
  "Referral",
  "LinkedIn",
  "Cold Outreach",
  "Event",
  "Advertising",
  "Partner",
  "Other",
] as const;
