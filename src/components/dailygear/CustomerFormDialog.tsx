import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSaveCustomer } from "@/lib/dailygear/api";
import type { Customer } from "@/lib/dailygear/types";

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  notes: "",
};

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer?: Customer | null;
}) {
  const [form, setForm] = useState(EMPTY);
  const save = useSaveCustomer();

  useEffect(() => {
    if (!open) return;
    setForm(
      customer
        ? {
            first_name: customer.first_name,
            last_name: customer.last_name ?? "",
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            city: customer.city ?? "",
            country: customer.country ?? "",
            notes: customer.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, customer]);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalid = !form.first_name.trim();

  async function submit() {
    if (invalid) return;
    await save.mutateAsync({
      ...(customer ? { id: customer.id } : {}),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      notes: form.notes.trim() || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "New customer"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={form.first_name} onChange={(e) => set("first_name")(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={form.last_name} onChange={(e) => set("last_name")(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => set("city")(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => set("country")(e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={invalid || save.isPending}>
            {save.isPending ? "Saving…" : "Save customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
