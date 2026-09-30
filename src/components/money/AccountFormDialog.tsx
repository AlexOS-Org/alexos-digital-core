import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlexOSFormField } from "@/components/alexos/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCOUNT_ICONS,
  ACCOUNT_ICON_OPTIONS,
  ACCOUNT_TYPES,
  CURRENCIES,
} from "@/lib/money/constants";
import { useSaveAccount, type Account } from "@/lib/money/api";
import { useMoneyCenterScope } from "@/lib/money/scope";
import { cn } from "@/lib/utils";

type FinancialScope = "personal" | "business";
type AccountOwnership = Account & {
  financial_scope?: FinancialScope;
  business_name?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account?: Account | null;
}

export function AccountFormDialog({ open, onOpenChange, account }: Props) {
  const save = useSaveAccount();
  const { businessId, business } = useMoneyCenterScope();
  const existing = account as AccountOwnership | null | undefined;
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("wallet");
  const [type, setType] = useState<Account["type"]>("bank");
  const [currency, setCurrency] = useState("KES");
  const [opening, setOpening] = useState("0");
  const [scope, setScope] = useState<FinancialScope>("personal");
  const [businessName, setBusinessName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNameError(null);
      setBusinessError(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setName(account?.name ?? "");
      setIcon(account?.icon ?? "wallet");
      setType(account?.type ?? "bank");
      setCurrency(account?.currency ?? "KES");
      setOpening(String(account?.opening_balance ?? 0));
      setScope(existing?.financial_scope ?? (businessId ? "business" : "personal"));
      setBusinessName(existing?.business_name ?? business?.name ?? "");
    }
  }, [
    open,
    account,
    existing?.business_name,
    existing?.financial_scope,
    businessId,
    business?.name,
  ]);

  const submit = async () => {
    if (!name.trim()) {
      setNameError("Give this account a name so you can recognise it in reports.");
      return;
    }
    if (scope === "business" && !businessName.trim()) {
      setBusinessError("Name the business this money belongs to.");
      return;
    }
    setNameError(null);
    setBusinessError(null);

    await save.mutateAsync({
      id: account?.id,
      name: name.trim(),
      icon,
      type,
      currency,
      opening_balance: Number(opening) || 0,
      financial_scope: scope,
      business_id: scope === "business" ? (businessId ?? null) : null,
      business_name: scope === "business" ? businessName.trim() : null,
    } as never);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? "Edit account" : "New account"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <AlexOSFormField
            label="Name"
            required
            error={nameError}
            hint="Shown on every card and report that references this account."
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Equity Bank"
              />
            )}
          </AlexOSFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AlexOSFormField label="Who owns this money?" required>
              {({ id, describedBy }) => (
                <Select value={scope} onValueChange={(v) => setScope(v as FinancialScope)}>
                  <SelectTrigger id={id} aria-describedby={describedBy}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </AlexOSFormField>

            <AlexOSFormField label="Type" required>
              {({ id, describedBy }) => (
                <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
                  <SelectTrigger id={id} aria-describedby={describedBy}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AlexOSFormField>
          </div>

          {scope === "business" ? (
            <AlexOSFormField
              label="Business"
              required
              error={businessError}
              hint="Business-scoped money is reported separately from personal money."
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. CarBar Motion"
                />
              )}
            </AlexOSFormField>
          ) : null}

          <fieldset className="alexos-field">
            <legend className="alexos-label">Icon</legend>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {ACCOUNT_ICON_OPTIONS.map((key) => {
                const Icon = ACCOUNT_ICONS[key];
                const selected = icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    aria-pressed={selected}
                    aria-label={key}
                    className={cn(
                      "alexos-focusable grid size-10 place-items-center rounded-lg border transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <AlexOSFormField label="Currency" required>
              {({ id, describedBy }) => (
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id={id} aria-describedby={describedBy}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AlexOSFormField>

            <AlexOSFormField
              label="Opening balance"
              required
              hint={
                account
                  ? "Locked after creation to keep history accurate."
                  : "The balance before your first recorded transaction."
              }
            >
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="alexos-num"
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  disabled={!!account}
                />
              )}
            </AlexOSFormField>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                save.isPending || !name.trim() || (scope === "business" && !businessName.trim())
              }
            >
              {save.isPending ? "Saving…" : account ? "Save account" : "Create account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
