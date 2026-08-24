import { describe, expect, it } from "vitest";
import { YJ_COLOUR_CARDS, yjColourImage } from "./yj-colours";

const variant = (name: string, color?: string, imageUrl?: string) => ({
  name,
  color: color ?? null,
  imageUrl: imageUrl ?? null,
});

describe("YJ exact colour image mapping", () => {
  it("maps Red to the supplied red reference", () => {
    expect(yjColourImage(variant("YJ Baby – Red"))).toBe(YJ_COLOUR_CARDS[0].image);
  });

  it("maps Teal/Green to the supplied teal/green reference", () => {
    expect(yjColourImage(variant("YJ Baby – Teal/Green"))).toBe(YJ_COLOUR_CARDS[1].image);
    expect(yjColourImage(variant("YJ Baby", "Green"))).toBe(YJ_COLOUR_CARDS[1].image);
  });

  it("maps Navy Blue with Pink Trim to the supplied navy reference", () => {
    expect(yjColourImage(variant("YJ Baby – Navy Blue with Pink Trim"))).toBe(
      YJ_COLOUR_CARDS[2].image,
    );
  });

  it("does not assign a recognized colour image to an unknown label", () => {
    const fallback = "https://example.test/catalogue/unknown.jpg";
    expect(yjColourImage(variant("YJ Baby – Unverified Colour", undefined, fallback))).toBe(
      fallback,
    );
  });

  it("keeps the three hero cards unique and ordered", () => {
    expect(YJ_COLOUR_CARDS).toHaveLength(3);
    expect(YJ_COLOUR_CARDS.map((card) => card.label)).toEqual([
      "Red",
      "Teal/Green",
      "Navy Blue with Pink Trim",
    ]);
    expect(new Set(YJ_COLOUR_CARDS.map((card) => card.image)).size).toBe(3);
  });
});
