import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Client, CompanySettings, Receipt } from '../types';
import { supabase } from '../lib/supabase';
import { money } from '../components/ui';
import { valorPorExtenso } from '../lib/extenso';
import { DocBody, DocFooter, DocHeader, DocPage, InfoCard, InfoRow, Signatures } from '../components/document';

export default function ReceiptPrintPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase || !id) return;
        const { data: r, error: e1 } = await supabase.from('receipts').select('*').eq('id', id).single();
        if (e1) throw e1;
        setReceipt(r);
        if (r.client_id) {
          const { data: c } = await supabase.from('clients').select('*').eq('id', r.client_id).single();
          setClient(c);
        }
        const { data: cs } = await supabase.from('company_settings').select('*').eq('id', 1).single();
        setCompany(cs);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar recibo');
      }
    })();
  }, [id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!receipt) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Carregando recibo…</div>;

  const valor = Number(receipt.amount);
  const emissao = receipt.issue_date
    ? new Date(receipt.issue_date + 'T00:00:00').toLocaleDateString('pt-BR')
    : '—';
  const clientName = client?.trade_name || client?.company_name || '—';
  const fullName = client?.trade_name && client?.company_name ? client.company_name : '';

  return (
    <DocPage backTo="/recibos">
      <DocHeader company={company} kind="Recibo de pagamento" number={receipt.number} date={emissao} />

      <DocBody>
        <div className="break-avoid relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 px-5 py-4 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-emerald-400/25 blur-2xl" />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Valor recebido</div>
              <div className="mt-1 text-[28px] font-semibold leading-none tabular-nums">{money(valor)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-slate-200 ring-1 ring-inset ring-white/10">
                {receipt.payment_method || 'Não informado'}
              </span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/20">
                {emissao}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-slate-600">
          Recebi de <strong className="font-semibold text-slate-800">{clientName}</strong>
          {client?.cnpj ? `, inscrito no CNPJ sob o nº ${client.cnpj},` : ''} a importância de{' '}
          <strong className="font-semibold text-slate-800">{valorPorExtenso(valor)}</strong>
          {receipt.description ? (
            <>
              , referente a <span className="text-slate-700">{receipt.description}</span>
            </>
          ) : null}
          , conforme detalhamento abaixo.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard title="Pagador">
            <div className="text-[13px] font-semibold text-slate-800">{clientName}</div>
            {fullName && <div className="text-[10.5px] text-slate-400">{fullName}</div>}
            <div className="mt-2 space-y-1">
              <InfoRow label="CNPJ">{client?.cnpj || 'Não informado'}</InfoRow>
              {client?.address && (
                <InfoRow label="Endereço">
                  {[client.address, client.city, client.state].filter(Boolean).join(', ')}
                </InfoRow>
              )}
              {(client?.contact_name || client?.phone) && (
                <InfoRow label="Contato">{client.contact_name || client.phone}</InfoRow>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Detalhes do pagamento" tone="teal">
            <InfoRow label="Valor">{money(valor)}</InfoRow>
            <InfoRow label="Forma">{receipt.payment_method || '—'}</InfoRow>
            <InfoRow label="Data">{emissao}</InfoRow>
            <InfoRow label="Recibo">Nº {receipt.number ?? '—'}</InfoRow>
            {receipt.notes && <InfoRow label="Notas">{receipt.notes}</InfoRow>}
          </InfoCard>
        </div>

        {company?.bank_info && (
          <div className="break-avoid rounded-xl border border-slate-200 px-4 py-3 text-[11.5px]">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">Dados bancários</div>
            <div className="mt-0.5 font-medium text-slate-700">{company.bank_info}</div>
          </div>
        )}

        <Signatures city={company?.city} companyName={company?.trade_name} clientName={clientName} />
      </DocBody>

      <DocFooter company={company} />
    </DocPage>
  );
}
