export type StockMovementType = 'IN' | 'OUT';

export interface StockMovement {
  _id: string;
  productId: string;
  quantity: number;
  type: StockMovementType;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockMovementPayload {
  productId: string;
  quantity: number;
  type: StockMovementType;
  reason: string;
}
