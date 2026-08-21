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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateOrderDetails } from "@/lib/dailygear/api";
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/dailygear/constants";
import type { Customer, Order } from "@/lib/dailygear/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  customer: Customer | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  county: string;
  town: string;
  deliveryDetails: string;
  customerNotes: string;
  status: Order["status"];
  paymentStatus: Order["payment_status"];
  paymentMethod: string;
  shippingMethod: string;
  shippingAddress: string;
  shippingCountry: string;
  shippingCounty: string;
  shippingTown: string;
  shippingAddressDetails: string;
  shippingZone: string;
  trackingNumber: string;
  notes: string;
  internalNotes: string;
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Kenya",
  county: "",
  town: "",
  deliveryDetails: "",
  customerNotes: "",
  status: "new",
  paymentStatus: "unpaid",
  paymentMethod: "",
  shippingMethod: "Delivery",
  shippingAddress: "",
  shippingCountry: "Kenya",
  shippingCounty: "",
  shippingTown: "",
  shippingAddressDetails: "",
  shippingZone: "",
  trackingNumber: "",
  notes: "",
  internalNotes: "",
};

function clean(value: string) {
  return value.trim() || null;
}

export function OrderEditDialog({ open, onOpenChange, order, customer }: Props) {
  const save = useUpdateOrderDetails();
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!open || !order) return;
    setForm({
      firstName: customer?.first_name ?? "",
      lastName: customer?.last_name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      country: customer?.country ?? "Kenya",
      county: customer?.county ?? order.shipping_county ?? "",
      town: customer?.town ?? order.shipping_town ?? "",
      deliveryDetails: customer?.delivery_details ?? order.shipping_address_details ?? "",
      customerNotes: customer?.notes ?? "",
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method ?? "",
      shippingMethod: order.shipping_method ?? "Delivery",
      shippingAddress: order.shipping_address ?? "",
      shippingCountry: order.shipping_country ?? "Kenya",
      shippingCounty: order.shipping_county ?? "",
      shippingTown: order.shipping_town ?? "",
      shippingAddressDetails: order.shipping_address_details ?? "",
      shippingZone: order.shipping_zone ?? "",
      trackingNumber: order.tracking_number ?? "",
      notes: order.notes ?? "",
      internalNotes: order.internal_notes ?? "",
    });
  }, [customer, open, order]);

  function set(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!order) return;
    await save.mutateAsync({
      orderId: order.id,
      status: form.status,
      paymentStatus: form.paymentStatus,
      paymentMethod: clean(form.paymentMethod),
      shippingMethod: clean(form.shippingMethod),
      shippingAddress: clean(form.shippingAddress),
      shippingCountry: clean(form.shippingCountry),
      shippingCounty: clean(form.shippingCounty),
      shippingTown: clean(form.shippingTown),
      shippingAddressDetails: clean(form.shippingAddressDetails),
      shippingZone: clean(form.shippingZone),
      trackingNumber: clean(form.trackingNumber),
      notes: clean(form.notes),
      internalNotes: clean(form.internalNotes),
      customer: customer
        ? {
            first_name: form.firstName.trim(),
            last_name: clean(form.lastName),
            email: clean(form.email),
            phone: clean(form.phone),
            address: clean(form.address),
            city: clean(form.city),
            country: clean(form.country),
            county: clean(form.county),
            town: clean(form.town),
            delivery_details: clean(form.deliveryDetails),
            notes: clean(form.customerNotes),
          }
        : null,
    });
    onOpenChange(false);
  }

  const statusOptions = Object.keys(ORDER_STATUS_META) as Order["status"][];
  const paymentOptions = Object.keys(PAYMENT_STATUS_META) as Order["payment_status"][];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {order?.order_number ?? "order"}</DialogTitle>
        </DialogHeader>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          Customer, delivery, payment, fulfilment and notes can be corrected here. Line items, order
          totals, stock movements and the original order number are preserved to prevent duplicate
          reservation or false financial history.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Order status</Label>
            <Select value={form.status} onValueChange={(value) => set("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ORDER_STATUS_META[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment status</Label>
            <Select
              value={form.paymentStatus}
              onValueChange={(value) => set("paymentStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PAYMENT_STATUS_META[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Input
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Shipping method</Label>
            <Input
              value={form.shippingMethod}
              onChange={(e) => set("shippingMethod", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>County</Label>
            <Input
              value={form.shippingCounty}
              onChange={(e) => set("shippingCounty", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Town or area</Label>
            <Input
              value={form.shippingTown}
              onChange={(e) => set("shippingTown", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Street, building, house or shop number</Label>
            <Input
              value={form.shippingAddress}
              onChange={(e) => set("shippingAddress", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Estate, landmark or delivery details</Label>
            <Textarea
              rows={3}
              value={form.shippingAddressDetails}
              onChange={(e) => set("shippingAddressDetails", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Shipping zone</Label>
            <Input
              value={form.shippingZone}
              onChange={(e) => set("shippingZone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tracking number</Label>
            <Input
              value={form.trackingNumber}
              onChange={(e) => set("trackingNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Order notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Internal notes</Label>
            <Textarea
              rows={3}
              value={form.internalNotes}
              onChange={(e) => set("internalNotes", e.target.value)}
            />
          </div>
          {!customer ? (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              This order has no linked customer record, so customer identity fields are unavailable
              for editing.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!order || save.isPending}>
            {save.isPending ? "Saving…" : "Save order details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
