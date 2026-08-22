export const DAILYGEAR_SOCIAL_LINKS = {
  whatsapp: {
    label: "WhatsApp",
    href: "https://wa.me/254722658824",
    iconSrc: "https://cdn.simpleicons.org/whatsapp/25D366",
  },
  instagram: {
    label: "Instagram",
    href: "https://www.instagram.com/daily_gearz/",
    iconSrc: "https://cdn.simpleicons.org/instagram/E4405F",
  },
  facebook: {
    label: "Facebook",
    href: "https://www.facebook.com/dailygear",
    iconSrc: "https://cdn.simpleicons.org/facebook/1877F2",
  },
} as const;

export function whatsappHref(value: string | null | undefined) {
  if (!value) return DAILYGEAR_SOCIAL_LINKS.whatsapp.href;
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return normalized ? `https://wa.me/${normalized}` : DAILYGEAR_SOCIAL_LINKS.whatsapp.href;
}
