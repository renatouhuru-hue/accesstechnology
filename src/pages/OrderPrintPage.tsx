import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Client, CompanySettings, Order, OrderItem } from '../types';
import { supabase } from '../lib/supabase';
import { money } from '../components/ui';
import { quoteLabels } from './OrdersPage';

export default function OrderPrintPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase || !id) return;
        const { data: o, error: e1 } = await supabase.from('orders').select('*').eq('id', id).single();
        if (e1) throw e1;
        const { data: its, error: e2 } = await supabase.from('order_items').select('*').eq('order_id', id).order('sort_order');
        if (e2) throw e2;
        setOrder(o);
        setItems(its || []);
        if (o.client_id) {
          const { data: c } = await supabase.from('clients').select('*').eq('id', o.client_id).single();
          setClient(c);
        }
        const { data: cs } = await supabase.from('company_settings').select('*').eq('id', 1).single();
        setCompany(cs);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar documento');
      }
    })();
  }, [id]);

  const materials = items.filter(i => i.kind === 'material');
  const services = items.filter(i => i.kind === 'service');
  const totalMaterial = materials.reduce((s, i) => s + Number(i.total_price ?? Number(i.quantity) * Number(i.unit_price)), 0);
  const totalService = services.reduce((s, i) => s + Number(i.total_price ?? Number(i.quantity) * Number(i.unit_price)), 0);
  const discount = Number(order?.discount || 0);
  const total = totalMaterial + totalService - discount;

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!order) return <div className="p-8 text-slate-500">Carregando…</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto bg-white p-8 shadow print:shadow-none print:max-w-none">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <div className="text-2xl font-bold">{company?.trade_name || 'Accesstechnology'}</div>
            <div className="text-sm text-slate-600">{company?.company_name}</div>
            <div className="text-sm text-slate-600">CNPJ: {company?.cnpj}</div>
            <div className="text-sm text-slate-600">{company?.address} — {company?.city}/{company?.state} — CEP {company?.zip}</div>
            <div className="text-sm text-slate-600">{company?.phone} · {company?.email}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase">Orçamento / OS</div>
            <div className="text-xl font-semibold">#{order.number ?? '—'}</div>
            <div className="text-sm text-slate-600">{order.issue_date ? new Date(order.issue_date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</div>
            <div className="text-xs mt-1 px-2 py-0.5 inline-block rounded bg-slate-100">{quoteLabels[order.quote_status]}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Cliente</div>
            <div className="font-semibold">{client?.trade_name || client?.company_name}</div>
            {client?.cnpj && <div>CNPJ: {client.cnpj}</div>}
            {client?.address && <div>{client.address}</div>}
            {(client?.city || client?.state) && <div>{client.city}/{client.state} {client.zip ? `— CEP ${client.zip}` : ''}</div>}
            {client?.phone && <div>Tel.: {client.phone}</div>}
            {client?.contact_name && <div>Contato: {client.contact_name}</div>}
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Detalhes</div>
            {order.title && <div><strong>Objetivo:</strong> {order.title}</div>}
            {order.scope && <div><strong>Contemplação:</strong> {order.scope}</div>}
            {order.valid_until && <div><strong>Validade:</strong> {new Date(order.valid_until + 'T00:00:00').toLocaleDateString('pt-BR')}</div>}
            {order.payment_terms && <div><strong>Pagamento:</strong> {order.payment_terms}</div>}
          </div>
        </div>

        <ItemTable title="Materiais" items={materials} />
        <ItemTable title="Serviços" items={services} />

        <div className="flex justify-end mt-4">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between"><span>Materiais</span><span>{money(totalMaterial)}</span></div>
            <div className="flex justify-between"><span>Serviços</span><span>{money(totalService)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span>Desconto</span><span>- {money(discount)}</span></div>}
            <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>{money(total)}</span></div>
          </div>
        </div>

        {order.notes && <div className="mt-4 text-sm"><div className="text-xs uppercase text-slate-500">Observações</div>{order.notes}</div>}

        {company?.bank_info && (
          <div className="mt-6 text-sm border-t pt-3">
            <div className="text-xs uppercase text-slate-500">Dados para pagamento</div>
            <div>{company.bank_info}</div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm text-center">
          <div className="border-t pt-1">{company?.trade_name || 'Accesstechnology'}</div>
          <div className="border-t pt-1">{client?.trade_name || client?.company_name || 'Cliente'}</div>
        </div>

        <div className="mt-6 flex justify-end print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Imprimir / Salvar PDF</button>
        </div>
      </div>
    </div>
  );
}

function ItemTable({ title, items }: { title: string; items: OrderItem[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-5">
      <div className="text-xs uppercase text-slate-500 mb-1">{title}</div>
      <table className="w-full text-sm border">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-2 border-b">Item</th>
            <th className="text-left p-2 border-b">Descrição</th>
            <th className="text-right p-2 border-b w-16">Qtd</th>
            <th className="text-left p-2 border-b w-16">Un.</th>
            <th className="text-right p-2 border-b w-24">Valor unit.</th>
            <th className="text-right p-2 border-b w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id}>
              <td className="p-2 border-b">{idx + 1}</td>
              <td className="p-2 border-b">{it.description}</td>
              <td className="p-2 border-b text-right">{Number(it.quantity)}</td>
              <td className="p-2 border-b">{it.unit}</td>
              <td className="p-2 border-b text-right">{money(Number(it.unit_price))}</td>
              <td className="p-2 border-b text-right">{money(Number(it.total_price ?? Number(it.quantity) * Number(it.unit_price)))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
