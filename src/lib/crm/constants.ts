export const CONTACT_TYPES = [
  {
    value: "person",
    label: "Person",
  },
  {
    value: "company",
    label: "Company",
  },
] as const;

export const CONTACT_STATUSES = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
] as const;

export const CONTACT_SOURCES = [
  "Facebook",
  "Instagram",
  "WhatsApp",
  "Website",
  "Referral",
  "Walk-in",
  "Phone",
  "Existing customer",
  "Other",
] as const;
