export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  type: CustomerType;
  address?: string;
  status: CustomerStatus;
  followUpDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCustomerPayload = Omit<Customer, '_id' | 'createdBy' | 'createdAt' | 'updatedAt'>;
export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;
