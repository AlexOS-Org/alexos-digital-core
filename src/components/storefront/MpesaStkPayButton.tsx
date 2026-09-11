import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  orderNumber: string;
  phone: string;
  amount: number;
}

/**
 * Phase A STK trigger on the thank-you page.
 * Logs attempts server-side; does not auto-confirm order payment.
 */
export function MpesaStkPayButton({ orderNumber, phone, amount }: Props) {
  const [stkBusy, setStkBusy] = useState(false);
  const [stkMessage, setStkMessage] = useState<string | null>(null);
  const [stkCheckoutId, setStkCheckoutId] = useState<string | null>(null);
  const [stkStatus, setStkStatus] = useState<string | null>(null);

  async function startStkPush() {
    setStkBusy(true);
    setStkMessage(null);
    setStkStatus(null);
    try {
      const res = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customerMessage?: string;
        checkoutRequestId?: string;
      };
      if (!res.ok || !data.ok) {
        setStkMessage(
          data.error ||
            "Could not open the M-Pesa prompt. Use the Paybill details above instead.",
        );
        return;
      }
      setStkCheckoutId(data.checkoutRequestId ?? null);
      setStkMessage(
        data.customerMessage ||
          "Check your phone for the M-Pesa PIN prompt. Enter your PIN to complete payment.",
      );
      setStkStatus("pending");
    } catch {
      setStkMessage("Network error starting M-Pesa. Use Paybill as a backup.");
    } finally {
      setStkBusy(false);
    }
  }

  useEffect(() => {
    if (
      !stkCheckoutId ||
      stkStatus === "success" ||
      stkStatus === "failed" ||
      stkStatus === "cancelled" ||
      stkStatus === "timeout"
    ) {
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/mpesa/status?checkoutRequestId=${encodeURIComponent(stkCheckoutId)}`,
        );
        const data = (await res.json()) as {
          ok?: boolean;
          status?: string;
          resultDesc?: string | null;
          receipt?: string | null;
        };
        if (cancelled || !data.ok || !data.status) return;
        if (data.status === "none" || data.status === "pending" || data.status === "initiated") {
          return;
        }
        setStkStatus(data.status);
        if (data.status === "success") {
          setStkMessage(
            data.receipt
              ? `Payment received on M-Pesa · receipt ${data.receipt}. DailyGear will confirm it against your order.`
              : "Payment received on M-Pesa. DailyGear will confirm it against your order.",
          );
        } else {
          setStkMessage(
            data.resultDesc ||
              "The M-Pesa prompt did not complete. You can try again or pay via Paybill.",
          );
        }
      } catch {
        /* ignore poll errors */
      }
    };
    const id = window.setInterval(() => void tick(), 4000);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [stkCheckoutId, stkStatus]);

  return (
    <div className="mt-3 space-y-2">
      <Button
        type="button"
        className="rounded-xl"
        disabled={stkBusy || stkStatus === "success"}
        onClick={() => void startStkPush()}
      >
        <Smartphone className="mr-2 h-4 w-4" />
        {stkBusy
          ? "Sending prompt…"
          : stkStatus === "success"
            ? "M-Pesa payment recorded"
            : `Pay KES ${amount.toLocaleString()} on phone (STK)`}
      </Button>
      {stkMessage ? (
        <p className="text-xs text-muted-foreground">{stkMessage}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          STK opens the M-Pesa PIN prompt on the phone used for this order. If it is not available
          yet, pay with Paybill above and keep your confirmation code.
        </p>
      )}
    </div>
  );
}
