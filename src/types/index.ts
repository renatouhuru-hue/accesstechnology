export type QuoteStatus = 'rascunho' | 'enviado' | 'aprovado' | 'reprovado' | 'cancelado';
export type ServiceStatus = 'nao_iniciado' | 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
export type ItemKind = 'material' | 'service';

export interface Client {
  id: string;
  company_name: string;
  trade_name?: string | null;
  cnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  contact_name?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogItem {
  id: string;
  kind: ItemKind;
  name: string;
  description?: string | null;
  unit?: string | null;
  unit_price: number;
  cost_price?: number | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  catalog_item_id?: string | null;
  kind: ItemKind;
  description: string;
  quantity: number;
  unit?: string | null;
  unit_cost?: number | null;
  markup_percent?: number | null;
  unit_price: number;
  total_price?: number;
  sort_order: number;
}

export interface Order {
  id: string;
  number?: number;
  client_id?: string | null;
  title?: string | null;
  scope?: string | null;
  quote_status: QuoteStatus;
  service_status: ServiceStatus;
  issue_date?: string | null;
  valid_until?: string | null;
  approved_at?: string | null;
  completed_at?: string | null;
  discount: number;
  notes?: string | null;
  payment_terms?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  client?: Client | null;
}

export interface Appointment {
  id: string;
  order_id?: string | null;
  client_id?: string | null;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  location?: string | null;
}

export interface Receipt {
  id: string;
  number?: number;
  order_id?: string | null;
  client_id?: string | null;
  issue_date?: string | null;
  amount: number;
  description?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export interface Payment {
  id: string;
  order_id?: string | null;
  receipt_id?: string | null;
  kind: 'receita' | 'despesa';
  description?: string | null;
  amount: number;
  due_date?: string | null;
  paid_at?: string | null;
  status: 'pendente' | 'pago' | 'cancelado';
  method?: string | null;
}

export interface CompanySettings {
  id: number;
  trade_name?: string | null;
  company_name?: string | null;
  cnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  bank_info?: string | null;
  logo_url?: string | null;
  default_quote_validity_days?: number | null;
}
