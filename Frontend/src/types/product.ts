export interface Product {
  _id: string;
  name: string;
  sku: string;
  category?: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductPayload = Omit<Product, '_id' | 'currentStock' | 'createdBy' | 'createdAt' | 'updatedAt'>;
export type UpdateProductPayload = Partial<CreateProductPayload>;
