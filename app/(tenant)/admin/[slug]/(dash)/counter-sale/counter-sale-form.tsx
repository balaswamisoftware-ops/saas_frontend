"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Gift, UserRound, Receipt, Check, Search } from "lucide-react";
import {
  Button,
  Card,
  PageHeader,
  SectionCard,
  SelectField,
  FormField,
  CheckOption,
  NumberField,
  Chip,
  toast,
  cn,
} from "@/components/ui";
import { useTenant, useApi } from "@/hooks";
import type { Devotee, Seva } from "@/types";
import { formatCurrency } from "@/lib/format";
import { printReceipt, resolveDesign, receiptFromBooking } from "@/lib/receipt";
import {
  printToNetwork,
  buildBridgeReceipt,
  isNetworkPrinter,
  layoutWidth,
} from "@/lib/print-bridge";

const PAYMENT_MODES = [
  { id: "cash", label: "Cash" },
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
  { id: "other", label: "Other" },
] as const;

type PaymentMode = (typeof PAYMENT_MODES)[number]["id"];

/**
 * Counter-sale point-of-sale: pick the ongoing event and seva, capture the
 * devotee, take payment and confirm. Standalone quick-action page.
 */
export function CounterSaleForm() {
  const { api } = useTenant();
  const allEvents = useApi(() => api.events.list(), []).data?.items ?? [];
  const seedSevas = useApi(() => api.sevas.list(), []).data?.items ?? [];
  // Org details + receipt designs + printers — used to print the token.
  const settings = useApi(() => api.settings.get(), []).data;
  const printers = useApi(() => api.printers.list(), []).data?.items ?? [];
  // Counter staff issue tickets only for events that are happening now.
  const ongoingEvents = allEvents.filter((e) => e.status === "ongoing");
  const [eventId, setEventId] = useState<string | null>(null);
  const [sevaId, setSevaId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gotra, setGotra] = useState("");
  const [nakshatra, setNakshatra] = useState("");
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState<PaymentMode>("cash");
  const [anonymous, setAnonymous] = useState(false);

  // Devotee lookup by phone — the unique identity within a tenant.
  const [devoteeId, setDevoteeId] = useState<string | null>(null);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Debounce the phone input before hitting the search endpoint.
  useEffect(() => {
    const t = setTimeout(() => setPhoneSearch(mobile.trim()), 250);
    return () => clearTimeout(t);
  }, [mobile]);

  const searchEnabled = !devoteeId && !anonymous && phoneSearch.length >= 3;
  const { data: matchData, loading: searching } = useApi(
    () => api.devotees.list({ search: phoneSearch, limit: 8 }),
    [phoneSearch, devoteeId],
    searchEnabled
  );
  const matches: Devotee[] = searchEnabled ? matchData?.items ?? [] : [];

  function onPhoneChange(value: string) {
    // Keep digits only, max 10 (Indian mobile number).
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    setShowResults(true);
    // Editing the phone breaks the link to a previously selected devotee.
    if (devoteeId) {
      setDevoteeId(null);
      setName("");
      setGotra("");
      setNakshatra("");
    }
  }

  /** Toggle anonymous — clears the devotee identity fields when turned on. */
  function toggleAnonymous(v: boolean) {
    setAnonymous(v);
    if (v) {
      setDevoteeId(null);
      setMobile("");
      setPhoneSearch("");
      setShowResults(false);
      setName("");
      setGotra("");
      setNakshatra("");
    }
  }

  function selectDevotee(d: Devotee) {
    setDevoteeId(d.id);
    // Stored phones may include the +91 country code; the field holds the
    // 10-digit local number (the submit button is gated on exactly 10 digits).
    setMobile((d.phone ?? "").replace(/\D/g, "").slice(-10));
    setName(d.name ?? "");
    setGotra(d.gotra ?? "");
    setNakshatra(d.nakshatra ?? "");
    setShowResults(false);
  }

  const selectedEvent = ongoingEvents.find((e) => e.id === eventId) ?? null;

  // Sevas offered at the chosen event, resolved against the seva catalogue.
  const eventSevas: Seva[] = useMemo(() => {
    if (!selectedEvent?.sevas?.length) return [];
    return selectedEvent.sevas
      .map((sevaName) => seedSevas.find((s) => s.name === sevaName && s.active))
      .filter((s): s is Seva => Boolean(s));
  }, [selectedEvent, seedSevas]);

  const selectedSeva = eventSevas.find((s) => s.id === sevaId) ?? null;
  const unitPrice = selectedSeva?.price ?? 0;
  const total = unitPrice * qty;

  function chooseEvent(id: string | null) {
    setEventId(id);
    setSevaId(null); // sevas differ per event
  }

  async function checkout() {
    if (!selectedEvent) return toast.danger("Select an ongoing event");
    if (!selectedSeva) return toast.danger("Select a seva");
    if (!anonymous && mobile.length !== 10) {
      return toast.danger("Enter a valid 10-digit phone number");
    }

    const receiptNo = `RC-${Date.now().toString().slice(-6)}`;
    const soldAt = new Date().toISOString();
    try {
      let devoteeName = "Anonymous";
      if (!anonymous) {
        // Resolve the devotee by phone — reuse the existing record or register a
        // new one (phone is unique per tenant; the name may repeat across people).
        const { devotee, created } = await api.devotees.findOrCreate({
          phone: `+91${mobile.trim()}`,
          name: name.trim() || undefined,
          gotra: gotra.trim() || undefined,
          nakshatra: nakshatra.trim() || undefined,
        });
        if (created) toast.success(`New devotee registered: ${devotee.name}`);
        devoteeName = devotee.name;
      }

      await api.bookings.create({
        receiptNo,
        eventName: selectedEvent.title,
        sevaName: selectedSeva.name,
        devoteeName,
        qty,
        amount: total,
        currency: selectedSeva.currency,
        payment,
        soldAt,
        status: "confirmed",
      });

      // Print the token to the event's assigned printer. A network (IP) printer
      // goes through the local print bridge; otherwise fall back to the browser
      // print dialog (which also covers OS-installed USB/WiFi printers).
      const printer = printers.find((p) => p.id === selectedEvent.printerId) ?? null;
      const paymentLabel = PAYMENT_MODES.find((m) => m.id === payment)?.label;
      const dialogFallback = () => {
        const layout = printer?.layout ?? "80mm";
        printReceipt(
          layout,
          resolveDesign(layout, settings?.receiptLayouts),
          receiptFromBooking(settings ?? {}, {
            receiptNo,
            soldAt,
            devoteeName,
            payment,
            sevaName: selectedSeva.name,
            qty,
            amount: total,
          }),
        );
      };
      if (isNetworkPrinter(printer)) {
        try {
          await printToNetwork(
            printer.ipAddress,
            buildBridgeReceipt(
              settings,
              {
                receiptNo,
                soldAt,
                devoteeName,
                sevaName: selectedSeva.name,
                qty,
                amount: total,
                currency: selectedSeva.currency,
                paymentLabel,
              },
              layoutWidth(printer.layout),
            ),
          );
        } catch (e) {
          toast.danger((e as { message?: string }).message ?? "Printer error — opening print dialog");
          dialogFallback();
        }
      } else {
        dialogFallback();
      }
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Failed to record booking");
      throw err;
    }
    toast.success(`${receiptNo} · ${formatCurrency(total)} collected — token issued for ${selectedSeva.name}`);
    // Stay on the page for the next person in the queue. Keep the event and
    // seva selection sticky; only clear the per-devotee fields.
    resetForNext();
  }

  /** Clear the devotee/payment fields for the next token; keep event + seva. */
  function resetForNext() {
    setDevoteeId(null);
    setMobile("");
    setPhoneSearch("");
    setShowResults(false);
    setName("");
    setGotra("");
    setNakshatra("");
    setQty(1);
    setPayment("cash");
    setAnonymous(false);
  }

  return (
    <div>
      <PageHeader
        title="Counter Sale"
        description="Issue a seva ticket at the counter — pick the ongoing event and seva, take payment and confirm the booking."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: event + seva selection */}
        <div className="space-y-4 lg:col-span-7">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <CalendarCheck className="size-4" /> 1. Select Ongoing Event
              </span>
            }
          >
            {ongoingEvents.length ? (
              <SelectField
                aria-label="Ongoing event"
                placeholder="Choose event"
                options={ongoingEvents.map((e) => ({ id: e.id, label: `${e.title} · ${e.venue}` }))}
                selectedKey={eventId}
                onSelectionChange={(k) => chooseEvent(k ? String(k) : null)}
              />
            ) : (
              <p className="text-foreground/55 py-6 text-center text-sm">No ongoing events right now.</p>
            )}
          </SectionCard>

          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <Gift className="size-4" /> 2. Select Seva
              </span>
            }
          >
            {!selectedEvent ? (
              <p className="text-foreground/55 py-8 text-center text-sm">Pick an event first.</p>
            ) : eventSevas.length === 0 ? (
              <p className="text-foreground/55 py-8 text-center text-sm">No sevas configured for this event.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {eventSevas.map((s) => {
                  const active = s.id === sevaId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSevaId(s.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition",
                        active
                          ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                          : "border-default-200 hover:border-default-300 hover:bg-default-50",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        {s.category ? (
                          <p className="text-foreground/50 text-xs">{s.category}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold">{formatCurrency(s.price)}</span>
                        {active ? (
                          <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full">
                            <Check className="size-3.5" />
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: devotee details + summary */}
        <div className="lg:col-span-5">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <UserRound className="size-4" /> 3. Devotee Details
              </span>
            }
          >
            <div className="space-y-4">
              <CheckOption
                label="Anonymous devotee"
                description="Record the booking without capturing devotee details."
                isSelected={anonymous}
                onChange={toggleAnonymous}
              />

              <div className="relative">
                <label className="text-sm font-medium">
                  Phone number {!anonymous ? <span className="text-danger">*</span> : null}
                </label>
                <div
                  className={cn(
                    "mt-1.5 flex items-stretch overflow-hidden rounded-xl border bg-background transition",
                    anonymous
                      ? "border-default-200 opacity-50"
                      : "border-default-300 focus-within:border-primary",
                  )}
                >
                  <span className="bg-default-100 text-foreground/60 border-default-200 grid place-items-center border-r px-3 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    disabled={anonymous}
                    value={mobile}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="10-digit number"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none disabled:cursor-not-allowed"
                  />
                </div>
                {anonymous ? null : devoteeId ? (
                  <p className="text-success mt-1 text-xs">Existing devotee selected.</p>
                ) : (
                  <p className="text-foreground/45 mt-1 text-xs">
                    Type a phone number to find a devotee, or enter a new one to register.
                  </p>
                )}

                {showResults && searchEnabled && (matches.length > 0 || searching) ? (
                  <ul className="border-default-200 bg-background absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border shadow-lg">
                    {searching && matches.length === 0 ? (
                      <li className="text-foreground/50 flex items-center gap-2 px-3 py-2 text-sm">
                        <Search className="size-4" /> Searching…
                      </li>
                    ) : null}
                    {matches.map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => selectDevotee(d)}
                          className="hover:bg-default-100 flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{d.phone}</span>
                            <span className="text-foreground/55 block truncate text-xs">
                              {d.name}
                              {d.city ? ` · ${d.city}` : ""}
                            </span>
                          </span>
                          <UserRound className="text-foreground/40 size-4 shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <FormField
                label="Devotee Name (optional)"
                placeholder="Full name"
                value={name}
                onChange={setName}
                isDisabled={anonymous}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Gotra" placeholder="e.g. Kashyapa" value={gotra} onChange={setGotra} isDisabled={anonymous} />
                <FormField label="Nakshatra" placeholder="e.g. Rohini" value={nakshatra} onChange={setNakshatra} isDisabled={anonymous} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  Quantity <span className="text-danger">*</span>
                </label>
                <NumberField
                  aria-label="Quantity"
                  value={qty}
                  onChange={(v) => setQty(Number.isNaN(v) ? 1 : v)}
                  minValue={1}
                >
                  <NumberField.Group>
                    <NumberField.Input />
                    <NumberField.DecrementButton />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </NumberField>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PAYMENT_MODES.map((m) => (
                    <Button
                      key={m.id}
                      variant={payment === m.id ? "primary" : "outline"}
                      size="sm"
                      onPress={() => setPayment(m.id)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="bg-default-50 space-y-2 p-4">
                <div className="text-foreground/60 flex items-center justify-between text-sm">
                  <span>Unit Price</span>
                  <span>{selectedSeva ? formatCurrency(unitPrice) : "—"}</span>
                </div>
                <div className="text-foreground/60 flex items-center justify-between text-sm">
                  <span>Quantity</span>
                  <span>{qty}</span>
                </div>
                <div className="border-default-200/60 flex items-center justify-between border-t pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </Card>

              <Button
                variant="primary"
                className="w-full"
                isDisabled={!selectedSeva || (!anonymous && mobile.length !== 10)}
                onPress={checkout}
              >
                <Receipt className="size-4" />
                Collect {formatCurrency(total)} & confirm booking
              </Button>

              {selectedEvent ? (
                <p className="text-foreground/50 text-center text-xs">
                  Booking for{" "}
                  <Chip size="sm" variant="soft" color="default">
                    {selectedEvent.title}
                  </Chip>
                </p>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
