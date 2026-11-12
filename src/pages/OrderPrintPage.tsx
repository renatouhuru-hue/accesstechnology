import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Client, CompanySettings, Order, OrderItem } from '../types';
import { supabase } from '../lib/supabase';
import { money } from '../components/ui';
import {
  DocBody,
  DocFooter,
  DocHeader,
  DocPage,
  InfoCard,
  InfoRow,
  ItemsTable,
  Signatures,
  Totals,
} from '../components/document';
import { quoteLabels } from './OrdersPage';

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR');
}

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

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!order) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Carregando documento…
      </div>
    );
  }

  const documentKind = order.quote_status === 'aprovado' ? 'Ordem de serviço' : 'Proposta comercial';
  const clientName = client?.trade_name || client?.company_name || '—';
  const fullName = client?.trade_name && client?.company_name ? client.company_name : '';

  return (
    <DocPage backTo="/ordens">
      <DocHeader
        company={company}
        kind={documentKind}
        number={order.number}
        date={formatDate(order.issue_date)}
        status={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-emerald-200 ring-1 ring-inset ring-emerald-400/20">
            {quoteLabels[order.quote_status]}
          </span>
        }
      />

      <DocBody>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5">
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Objetivo</div>
          <div className="mt-1 text-[15px] font-semibold leading-snug text-slate-800">
            {order.title || 'Serviços de tecnologia'}
          </div>
          {order.scope && (
            <div className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
              <span className="font-medium text-slate-500">Contemplação: </span>
              {order.scope}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-5">
          <InfoCard title="Cliente" className="sm:col-span-3">
            <div className="mb-2">
              <div className="text-[14px] font-semibold leading-tight text-slate-800">{clientName}</div>
              {fullName && <div className="mt-0.5 text-[10.5px] text-slate-400">{fullName}</div>}
            </div>
            <InfoRow label="CNPJ">{client?.cnpj || 'Não informado'}</InfoRow>
            {client?.address && <InfoRow label="Endereço">{client.address}</InfoRow>}
            <InfoRow label="Cidade">
              {[client?.city, client?.state].filter(Boolean).join('/') || '—'}
              {client?.zip ? ` · CEP ${client.zip}` : ''}
            </InfoRow>
            {client?.contact_name && <InfoRow label="Contato">{client.contact_name}</InfoRow>}
            {client?.phone && <InfoRow label="Telefone">{client.phone}</InfoRow>}
            {client?.email && <InfoRow label="E-mail">{client.email}</InfoRow>}
          </InfoCard>

          <InfoCard title="Condições" className="sm:col-span-2">
            <InfoRow label="Emissão">{formatDate(order.issue_date) || '—'}</InfoRow>
            <InfoRow label="Validade">{formatDate(order.valid_until) || '—'}</InfoRow>
            <InfoRow label="Pagamento">{order.payment_terms || 'A combinar'}</InfoRow>
            <InfoRow label="Itens">{items.length}</InfoRow>
            <InfoRow label="Situação">
              <span className="font-medium text-emerald-700">{quoteLabels[order.quote_status]}</span>
            </InfoRow>
          </InfoCard>
        </div>

        <ItemsTable title="Materiais" items={materials} />
        <ItemsTable title="Serviços" items={services} tone="violet" />

        <Totals material={totalMaterial} service={totalService} discount={discount} total={total} />

        {order.notes && (
          <div className="break-avoid rounded-xl border-l-[3px] border-emerald-500 bg-slate-50 px-4 py-3">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">Observações</div>
            <div className="mt-1 whitespace-pre-line text-[11.5px] leading-relaxed text-slate-600">{order.notes}</div>
          </div>
        )}

        {company?.bank_info && (
          <div className="break-avoid flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[11.5px]">
            <div>
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">Dados para pagamento</div>
              <div className="mt-0.5 font-medium text-slate-700">{company.bank_info}</div>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              Valor total
              <div className="text-[13px] font-semibold tabular-nums text-slate-800">{money(total)}</div>
            </div>
          </div>
        )}

        <Signatures city={company?.city} companyName={company?.trade_name} clientName={clientName} />
      </DocBody>

      <DocFooter company={company} />
    </DocPage>
  );
}
