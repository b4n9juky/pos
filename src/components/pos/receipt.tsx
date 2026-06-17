"use client"

import { forwardRef } from "react"
import type { CartItem, PaymentMethod } from "@/types"
import { formatCurrency } from "@/lib/format"
import { APP_NAME } from "@/lib/constants"

interface ReceiptProps {
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  amountPaid: number
  change: number
  orderNumber: string
  customerName?: string | null
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  function Receipt({ items, subtotal, tax, discount, total, paymentMethod, amountPaid, change, orderNumber, customerName }, ref) {
    return (
      <div ref={ref} className="w-[280px] bg-white p-4 text-xs text-black print:p-0">
        <div className="text-center border-b pb-2 mb-2">
          <p className="text-sm font-bold">{APP_NAME}</p>
          <p className="text-[10px] text-gray-500">Jl. Example No. 123</p>
          <p className="text-[10px] text-gray-500">Telp: 021-12345678</p>
        </div>

        <div className="border-b pb-1 mb-1">
          <p>Order: {orderNumber}</p>
          <p>Date: {new Date().toLocaleDateString("id-ID")}</p>
          {customerName && <p>Customer: {customerName}</p>}
        </div>

        <div className="border-b pb-1 mb-1">
          <div className="flex justify-between font-medium">
            <span className="flex-1">Item</span>
            <span className="w-12 text-right">Qty</span>
            <span className="w-16 text-right">Total</span>
          </div>
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between">
              <span className="flex-1 truncate">{item.product.name}</span>
              <span className="w-12 text-right">{item.quantity}</span>
              <span className="w-16 text-right">{formatCurrency(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (10%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-0.5">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid ({paymentMethod})</span>
            <span>{formatCurrency(amountPaid)}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}
        </div>

        <div className="text-center border-t pt-2 mt-2 text-[10px] text-gray-500">
          <p>Thank you for your purchase!</p>
        </div>
      </div>
    )
  }
)
