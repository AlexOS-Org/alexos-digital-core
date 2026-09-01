import { ChevronDown, ChevronUp, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parsePremiumUrlLines, serializePremiumUrlLines } from "@/lib/dailygear/premium-content";

export type PremiumListKind = "content" | "spec" | "faq" | "url";

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

function parseRows(value: string, url: boolean): Row[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (url) return { first: line, second: "" };
      const [first, ...rest] = line.split("|").map((part) => part.trim());
      return { first: first ?? "", second: rest.join("|").trim() };
    });
}

function serializeRows(rows: Row[], url: boolean): string {
  return rows
    .map((row) => {
      if (url) {
        const value = row.first.trim();
        return value ? value : "";
      }
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
  const isUrl = kind === "url";
  const rows: Row[] = isUrl
    ? parsePremiumUrlLines(value).map((first) => ({ first, second: "" }))
    : parseRows(value, false);

  function update(next: Row[]) {
    onChange(
      isUrl ? serializePremiumUrlLines(next.map((row) => row.first)) : serializeRows(next, false),
    );
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

  function setPrimary(index: number) {
    if (index === 0) return;
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    update(next);
  }

  const ariaFirst =
    kind === "url"
      ? `${label} URL`
      : `${label} ${kind === "spec" ? "label" : kind === "faq" ? "question" : "title"}`;
  const ariaSecond =
    kind === "spec"
      ? `${label} value`
      : kind === "faq"
        ? `${label} answer`
        : `${label} description`;
  const editingLabel =
    kind === "spec" ? "Specification" : kind === "faq" ? "FAQ" : isUrl ? "Image" : "Record";

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
                {!isUrl ? (
                  <Input
                    value={row.second}
                    onChange={(event) => setRow(index, { second: event.target.value })}
                    placeholder={secondPlaceholder}
                    aria-label={`${ariaSecond} ${index + 1}`}
                  />
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {isUrl && index === 0 ? (
                  <span className="px-1 text-[10px] font-medium uppercase text-primary">
                    Primary
                  </span>
                ) : null}
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
                {isUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPrimary(index)}
                    disabled={index === 0}
                    aria-label={`Set as primary ${editingLabel.toLowerCase()}`}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                ) : null}
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
