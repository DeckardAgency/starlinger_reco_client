// src/app/core/models/order-history.model.ts

export type HistoryStatus = 'draft' | 'new' | 'in-process' | 'waiting-for-payment' | 'ready-for-shipment' | 'shipped' | 'delivered' | 'canceled' | 'reversal';
export type HistoryType = 'order' | 'manual';

export interface HistoryItem {
  id: string; // Real UUID for routing
  orderId: string; // Display order number
  type: HistoryType;
  dateCreated: string;
  internalReference: string;
  partsOrdered: number;
  amount?: string;
  status: HistoryStatus;
}
