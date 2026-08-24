import type { PublicFunnelVariant } from "./funnel.server";

export const YJ_COLOUR_CARDS = [
  {
    label: "Red",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/kgkuyAeqCnUWMUrq.jpg",
  },
  {
    label: "Teal/Green",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/lqYSLmnstKCbhSqy.png",
  },
  {
    label: "Navy Blue with Pink Trim",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/oObQIxmoIjUtNsvS.png",
  },
] as const;

export const YJ_EXACT_COLOUR_IMAGES = YJ_COLOUR_CARDS.map((card) => card.image);

export function yjColourImage(variant: Pick<PublicFunnelVariant, "name" | "color" | "imageUrl">) {
  const colour = `${variant.color ?? ""} ${variant.name}`.toLowerCase();
  const card =
    colour.includes("teal") || colour.includes("green")
      ? YJ_COLOUR_CARDS[1]
      : colour.includes("navy") || (colour.includes("blue") && colour.includes("pink"))
        ? YJ_COLOUR_CARDS[2]
        : colour.includes("red")
          ? YJ_COLOUR_CARDS[0]
          : null;
  return card?.image ?? variant.imageUrl ?? null;
}
