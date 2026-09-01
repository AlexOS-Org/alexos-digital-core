import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PremiumListKind = "content" | "spec" | "faq";

interface PremiumListEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind: PremiumListKind;
  firstPlaceholder: string;
  secondPlaceholder: string;
  addLabel: string;
  hint?: string;
}

interface Row {
  first: string;
  second: string;
}

function parseRows(value: string): Row[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, ...rest] = line.split("|").map((part) => part.trim());
      return { first: first ?? "", second: rest.join("|").trim() };
    });
}

function serializeRows(rows: Row[]): string {
  return rows
    .map((row) => {
      const first = row.first.trim();
      const second = row.second.trim();
      if (!first && !second) return "";
      return `${first}|${second}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function PremiumListEditor({
  label,
  value,
  onChange,
  kind,
  firstPlaceholder,
  secondPlaceholder,
  addLabel,
  hint,
}: PremiumListEditorProps) {
  const rows = parseRows(value);

  function update(next: Row[]) {
    onChange(serializeRows(next));
  }

  function setRow(index: number, patch: Partial<Row>) {
    update(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    update(rows.filter((_, i) => i !== index));
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  function addRow() {
    update([...rows, { first: "", second: "" }]);
  }

  const ariaFirst = `${label} ${kind === "spec" ? "label" : kind === "faq" ? "question" : "title"}`;
  const ariaSecond = `${label} ${kind === "spec" ? "value" : kind === "faq" ? "answer" : "description"}`;
  const editingLabel = kind === "spec" ? "Specification" : kind === "faq" ? "FAQ" : "Record";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
          No {editingLabel.toLowerCase()} yet. Add one to start building the premium presentation.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={`${index}-${row.first}-${row.second}`}
              className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-2"
            >
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1.4fr]">
                <Input
                  value={row.first}
                  onChange={(event) => setRow(index, { first: event.target.value })}
                  placeholder={firstPlaceholder}
                  aria-label={`${ariaFirst} ${index + 1}`}
                />
                <Input
                  value={row.second}
                  onChange={(event) => setRow(index, { second: event.target.value })}
                  placeholder={secondPlaceholder}
                  aria-label={`${ariaSecond} ${index + 1}`}
                />
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${editingLabel} up`}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Move ${editingLabel} down`}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove ${editingLabel}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
