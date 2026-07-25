import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/crm/types";
import { contactInitials } from "@/lib/crm/utils";

export function ContactAvatar({
  contact,
  className,
}: {
  contact: Pick<Contact, "first_name" | "last_name" | "avatar_url"> | null | undefined;
  className?: string;
}) {
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {contact?.avatar_url ? <AvatarImage src={contact.avatar_url} alt="" /> : null}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
        {contactInitials(contact)}
      </AvatarFallback>
    </Avatar>
  );
}
