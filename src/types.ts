export type Product = {
  id: string;
  user_id: string;
  name: string;
  price_pen: number;
  product_type: string;
  webhook_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Sale = {
  id: string;
  user_id: string;
  product_id: string;
  plan: string;
  amount_pen: number;
  exchange_rate: number;
  amount_brl: number;
  sale_date: string;
  status: "aprovado" | "reembolsado";
  notes?: string;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  expense_type: string;
  amount_brl: number;
  expense_date: string;
  notes?: string;
  created_at: string;
};

export type WebhookLog = {
  id: string;
  user_id: string;
  sale_id?: string;
  product_id?: string;
  target_url: string;
  payload: any;
  status: "sent" | "error";
  response_code?: number;
  response_body?: string;
  created_at: string;
};

export type QuickButton = {
  id: string;
  isActive: boolean;
  name: string;
  productId: string;
};
