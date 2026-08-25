import { afterEach, describe, expect, it, vi } from "vitest";
import { sendOrderNotifications } from "./order-email";

describe("sendOrderNotifications", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends a branded PDF attachment with the confirmed order number", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("DAILYGEAR_EMAIL_FROM", "orders@example.com");

    const requests: Array<{
      url: string;
      body: { attachments?: Array<{ filename: string; content: string }>; text?: string };
    }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "https://api.resend.com/emails") {
          requests.push({ url, body: JSON.parse(String(init?.body)) });
          return new Response(JSON.stringify({ id: "email-test" }), { status: 200 });
        }
        return new Response("not found", { status: 404 });
      }),
    );

    const result = await sendOrderNotifications({
      orderNumber: "DG-TEST-0001",
      total: 3750,
      shippingFee: 0,
      currency: "KES",
      paymentMethod: "cod",
      customerName: "QA Customer",
      customerEmail: "qa@example.com",
      customerPhone: "0700000000",
      county: "Nairobi",
      town: "Westlands",
      address: "QA address",
      deliveryDetails: null,
      ownerEmail: null,
      items: [
        {
          name: "YJ Baby school backpack",
          sku: "YJ-RED",
          quantity: 1,
          lineTotal: 3750,
          imageUrl: null,
        },
      ],
    });

    expect(result.sent).toBe(true);
    expect(requests).toHaveLength(1);
    const attachment = requests[0]?.body.attachments?.[0];
    expect(attachment?.filename).toBe("dailygear-order-DG-TEST-0001.pdf");
    expect(attachment?.content).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(
      new TextDecoder().decode(
        Uint8Array.from(atob(attachment?.content ?? ""), (char) => char.charCodeAt(0)).slice(0, 4),
      ),
    ).toBe("%PDF");
    expect(requests[0]?.body.text).toContain("KES 3,750.00");
  });
});
