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
import { useSaveExpected, type Expected } from "@/lib/money/api";
import { useMoneyCenterScope } from "@/lib/money/scope";
import { Slider } from "@/components/ui/slider";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Expected | null;
}

export function ExpectedFormDialog({ open, onOpenChange, editing }: Props) {
  const save = useSaveExpected();
  const { businessId } = useMoneyCenterScope();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<string>(EXPECTED_SOURCES[0]);
  const [amount, setAmount] = useState("");
  const [probability, setProbability] = useState(80);
  const [description, setDescription] = useState("");
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
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setSource(EXPECTED_SOURCES[0]);
      setAmount("");
      setProbability(80);
      setDescription("");
    }
  }, [open, editing]);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setAmountError("Enter an amount greater than zero.");
      return;
    }
    setAmountError(null);
    await save.mutateAsync({
      id: editing?.id,
      expected_date: date,
      source,
      amount: amt,
      probability,
      description: description || null,
      business_id: businessId ?? null,
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
