"use client";

import { Money } from "@/components/Money";
import { Modal } from "@/components/Modal";
import { formatDateTime } from "@/lib/format";
import { PAYMENT_METHODS, type Sale } from "@/lib/types";

type ReceiptModalProps = {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  shopName?: string;
  shopPhone?: string;
  footer?: string;
};

export function ReceiptModal({
  open,
  onClose,
  sale,
  shopName = "Blessing Mall Supermarket",
  shopPhone,
  footer = "Thank you for shopping at Blessing Mall.",
}: ReceiptModalProps) {
  if (!sale) return null;

  const method =
    PAYMENT_METHODS.find((m) => m.value === sale.paymentMethod)?.label ??
    sale.paymentMethod;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customer receipt"
      footer={
        <div className="no-print flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-charcoal hover:bg-mint"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark"
          >
            Print receipt
          </button>
        </div>
      }
    >
      <div className="receipt-print mx-auto max-w-sm font-sans text-sm text-charcoal">
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-forest">
            {shopName}
          </p>
          {shopPhone ? <p className="mt-1 text-muted">{shopPhone}</p> : null}
          <p className="mt-3 text-xs uppercase tracking-wider text-muted">
            Sales receipt
          </p>
        </div>

        <div className="mt-4 space-y-1 border-y border-dashed border-border py-3 text-xs">
          <div className="flex justify-between gap-3">
            <span className="text-muted">Receipt</span>
            <span className="font-medium">{sale.receiptNo}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Date</span>
            <span>{formatDateTime(sale.createdAt)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Cashier</span>
            <span>{sale.user?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Payment</span>
            <span>{method}</span>
          </div>
          {sale.customerName ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Customer</span>
              <span>{sale.customerName}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          {(sale.items ?? []).map((item, idx) => (
            <div key={item.id ?? `${item.productId}-${idx}`} className="flex gap-2">
              <div className="flex-1">
                <p className="font-medium">
                  {item.product?.name ?? "Item"}
                </p>
                <p className="text-xs text-muted">
                  {item.qty} × <Money amount={item.unitPrice} />
                </p>
              </div>
              <Money amount={item.lineTotal} className="font-medium" />
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 border-t border-border pt-3">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <Money amount={sale.subtotal} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted">VAT</span>
            <Money amount={sale.vatAmount} />
          </div>
          <div className="flex justify-between font-display text-base font-semibold">
            <span>Total</span>
            <Money amount={sale.total} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Paid</span>
            <Money amount={sale.paidAmount} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Change</span>
            <Money amount={sale.changeAmount} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">{footer}</p>
      </div>
    </Modal>
  );
}
