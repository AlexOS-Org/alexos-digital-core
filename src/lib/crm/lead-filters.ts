import type { Contact, Lead } from "./types";

function normalized(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase();
}

/**
 * Filter pipeline opportunities without changing the persisted CRM contract.
 * Matching covers the opportunity itself and its linked contact, so owners can
 * find a deal by title, source, note, or relationship details from one search.
 */
export function filterLeads(
  leads: Lead[],
  contactsById: ReadonlyMap<
    string,
    Pick<Contact, "first_name" | "last_name" | "company" | "email">
  >,
  query: string,
): Lead[] {
  const needle = normalized(query);
  if (!needle) return leads;

  return leads.filter((lead) => {
    const contact = lead.contact_id ? contactsById.get(lead.contact_id) : undefined;
    const searchable = [
      lead.title,
      lead.source,
      lead.notes,
      contact?.first_name,
      contact?.last_name,
      contact?.company,
      contact?.email,
    ]
      .map(normalized)
      .filter(Boolean)
      .join(" ");

    return searchable.includes(needle);
  });
}
