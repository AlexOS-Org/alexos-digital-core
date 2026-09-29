import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlexOSFormField } from "@/components/alexos/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPECTED_SOURCES } from "@/lib/money/constants";
import { useBusinesses, useSaveExpected, type Expected } from "@/lib/money/api";
import type { ExpectedMoneyScope } from "@/lib/money/expected-money";
import { Slider } from "@/components/ui/slider";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Expected | null;
}

export function ExpectedFormDialog({ open, onOpenChange, editing }: Props) {
  const save = useSaveExpected();
  const { data: businesses = [] } = useBusinesses();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<string>(EXPECTED_SOURCES[0]);
  const [amount, setAmount] = useState("");
  const [probability, setProbability] = useState(80);
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<ExpectedMoneyScope>("personal");
  const [businessId, setBusinessId] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmountError(null);
    if (editing) {
      setDate(editing.expected_date);
      setSource(editing.source);
      setAmount(String(editing.amount));
      setProbability(editing.probability);
      setDescription(editing.description ?? "");
      setScope(editing.financial_scope ?? "personal");
      setBusinessId(editing.business_id ?? "");
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setSource(EXPECTED_SOURCES[0]);
      setAmount("");
      setProbability(80);
      setDescription("");
      setScope("personal");
      setBusinessId("");
    }
  }, [open, editing]);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setAmountError("Enter an amount greater than zero.");
      return;
    }
    if (scope === "business" && !businessId) return;
    setAmountError(null);
    await save.mutateAsync({
      id: editing?.id,
      expected_date: date,
      source,
      amount: amt,
      probability,
      description: description || null,
      financial_scope: scope,
      business_id: scope === "business" ? businessId : null,
      business_name:
        scope === "business"
          ? (businesses.find((business) => business.id === businessId)?.name ?? null)
          : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit expected money" : "Add expected money"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AlexOSFormField label="Expected date" required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              )}
            </AlexOSFormField>
            <AlexOSFormField
              label="Amount"
              required
              error={amountError}
              hint="The full value you expect to receive."
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="alexos-num"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              )}
            </AlexOSFormField>
          </div>

          <AlexOSFormField label="Source" required>
            {({ id, describedBy }) => (
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id={id} aria-describedby={describedBy}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPECTED_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </AlexOSFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AlexOSFormField
              label="Financial scope"
              required
              hint={
                editing
                  ? "Scope cannot be changed once an item exists."
                  : "Keep expected money aligned with personal or business activity."
              }
            >
              {({ id, describedBy }) => (
                <Select
                  value={scope}
                  onValueChange={(value) => setScope(value as ExpectedMoneyScope)}
                  disabled={!!editing}
                >
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

            {scope === "business" ? (
              <AlexOSFormField
                label="Business"
                required
                error={!businessId ? "Choose a business." : undefined}
              >
                {({ id, describedBy, invalid }) => (
                  <Select value={businessId} onValueChange={setBusinessId} disabled={!!editing}>
                    <SelectTrigger id={id} aria-describedby={describedBy} aria-invalid={invalid}>
                      <SelectValue placeholder="Choose business" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </AlexOSFormField>
            ) : null}
          </div>

          <div className="alexos-field">
            <div className="flex items-center justify-between">
              <span className="alexos-label" id="probability-label">
                Probability
              </span>
              <span className="alexos-amount text-sm text-primary">{probability}%</span>
            </div>
            <Slider
              aria-labelledby="probability-label"
              value={[probability]}
              onValueChange={([v]) => setProbability(v)}
              max={100}
              step={5}
            />
            <p className="alexos-hint">
              Used to weight the expected total. 100% means certain, 50% means a coin flip.
            </p>
          </div>

          <AlexOSFormField label="Description">
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional note"
              />
            )}
          </AlexOSFormField>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Save changes" : "Add expected money"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
