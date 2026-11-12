import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Client, CompanySettings, Receipt } from '../types';
import { supabase } from '../lib/supabase';
import { money } from '../components/ui';

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
      } catch (e: any) { setError(e?.message || 'Erro ao carregar recibo'); }
    })();
  }, [id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!receipt) return <div className="p-8 text-slate-500">Carregando…</div>;

  const valor = Number(receipt.amount);
  const valorExtenso = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto bg-white p-8 shadow print:shadow-none">
        <div className="border-b pb-4">
          <div className="text-2xl font-bold">{company?.trade_name || 'Accesstechnology'}</div>
          <div className="text-sm text-slate-600">{company?.company_name}</div>
          <div className="text-sm text-slate-600">CNPJ: {company?.cnpj} · {company?.phone}</div>
          <div className="text-sm text-slate-600">{company?.address} — {company?.city}/{company?.state}</div>
        </div>

        <div className="text-center my-6">
          <div className="text-xl font-semibold">RECIBO</div>
          <div className="text-sm text-slate-500">Nº {receipt.number ?? '—'}</div>
        </div>

        <div className="text-sm leading-relaxed">
          <p>
            Recebi de <strong>{client?.trade_name || client?.company_name || '—'}</strong>
            {client?.cnpj ? ` (CNPJ ${client.cnpj})` : ''} a importância de <strong>{valorExtenso}</strong>
            {receipt.description ? ` referente a ${receipt.description}` : ''}.
          </p>
          <p className="mt-3">
            Forma de pagamento: <strong>{receipt.payment_method || '—'}</strong> · Data: <strong>{receipt.issue_date ? new Date(receipt.issue_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</strong>
          </p>
          {receipt.notes && <p className="mt-3 text-slate-600">{receipt.notes}</p>}
        </div>

        {company?.bank_info && (
          <div className="mt-6 text-sm border-t pt-3">
            <div className="text-xs uppercase text-slate-500">Dados bancários</div>
            <div>{company.bank_info}</div>
          </div>
        )}

        <div className="mt-12 text-center text-sm">
          <div className="border-t pt-1 inline-block px-10">{company?.city || 'Aracaju'}, {new Date().toLocaleDateString('pt-BR')}</div>
          <div className="mt-10 border-t pt-1 inline-block px-10">{company?.trade_name || 'Accesstechnology'}</div>
        </div>

        <div className="mt-6 flex justify-end print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Imprimir / Salvar PDF</button>
        </div>
      </div>
    </div>
  );
}
