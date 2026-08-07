export class SyncInboundDto {
  orderId: string;
  customerName: string;
  productName: string;
  quantity: number;
  weight: number;
  createdAt: string;
  createdBy: string;
  status: string;
}

export class SyncOutboundDto {
  orderId: string;
  customerName: string;
  productName: string;
  quantity: number;
  weight: number;
  batchNo: string;
  createdAt: string;
  status: string;
}

export class SyncReconciliationDto {
  date: string;
  customerName: string;
  outboundAmount: number;
  invoicedAmount: number;
  receivedAmount: number;
  paymentStatus: string;
}

export class SyncInventoryDto {
  items: Array<{
    productName: string;
    material: string;
    currentStock: number;
    unit: string;
    location: string;
    batchNo: string;
    inboundDate: string;
  }>;
}
