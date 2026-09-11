export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
}

export interface Challan {
  _id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  items: ChallanItem[];
  totalQuantity: number;
  createdBy: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallanItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateChallanPayload {
  customerId: string;
  items: ChallanItemPayload[];
}

export interface UpdateChallanPayload {
  items: ChallanItemPayload[];
}

