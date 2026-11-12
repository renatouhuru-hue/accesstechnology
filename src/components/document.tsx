import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import type { CompanySettings, OrderItem } from '../types';
import { money } from './ui';

export function DocPage({ children, backTo }: { children: ReactNode; backTo: string }) {
  return (
    <div className="min-h-screen bg-slate-200/70 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex w-full max-w-[860px] items-center justify-between px-4 print:hidden">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          <Printer size={16} /> Imprimir / Salvar PDF
        </button>
      </div>

      <div className="mx-auto w-full max-w-[860px] px-4 print:max-w-none print:px-0">
        <div className="doc-sheet overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/10 print:rounded-none print:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DocHeader({
  company,
  kind,
  number,
  date,
  status,
}: {
  company: CompanySettings | null;
  kind: string;
  number?: number | null;
  date?: string | null;
  status?: ReactNode;
}) {
  return (
    <div>
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600" />
      <div className="flex flex-wrap items-start justify-between gap-6 bg-gradient-to-r from-[#0d3260] via-[#0b2b52] to-[#071b33] px-7 py-7 text-white sm:px-9">
        <div className="flex items-start gap-4">
          {company?.logo_url ? (
            <img src={company.logo_url} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1" />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-[15px] font-extrabold tracking-tight shadow-lg shadow-emerald-950/40">
              AT
            </div>
          )}
          <div>
            <div className="text-[19px] font-semibold leading-tight tracking-tight">
              {company?.trade_name || 'Accesstechnology'}
            </div>
            <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Consultoria e serviços de TI
            </div>
            <div className="mt-2 text-[11px] text-blue-100/60">{company?.company_name}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-emerald-200 ring-1 ring-inset ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {kind}
          </div>
          <div className="mt-2.5 text-[32px] font-semibold leading-none tracking-tight tabular-nums">
            #{number ?? '—'}
          </div>
          <div className="mt-1.5 text-[11px] text-blue-100/60">
            {date ? `Emitido em ${date}` : 'Emissão —'}
          </div>
          {status && <div className="mt-2 flex justify-end">{status}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-1 border-b border-slate-200 bg-slate-50 px-7 py-3 text-[10.5px] text-slate-500 sm:grid-cols-3 sm:px-9">
        <span>CNPJ {company?.cnpj || '—'}</span>
        <span>
          {company?.address || '—'}
          {company?.city ? ` — ${company.city}/${company.state}` : ''}
        </span>
        <span className="sm:text-right">
          {company?.phone || '—'}
          {company?.email ? ` · ${company.email}` : ''}
        </span>
      </div>
    </div>
  );
}

export function DocBody({ children }: { children: ReactNode }) {
  return <div className="space-y-6 px-7 py-7 sm:px-9">{children}</div>;
}

export function InfoCard({
  title,
  children,
  className = '',
  tone = 'emerald',
}: {
  title: string;
  children: ReactNode;
  className?: string;
  tone?: 'emerald' | 'teal' | 'slate';
}) {
  const styles = {
    emerald: { border: 'border-t-emerald-400', dot: 'bg-emerald-500', label: 'text-emerald-700/70' },
    teal: { border: 'border-t-teal-400', dot: 'bg-teal-500', label: 'text-teal-700/70' },
    slate: { border: 'border-t-slate-300', dot: 'bg-slate-400', label: 'text-slate-500' },
  }[tone];

  return (
    <div className={`break-avoid rounded-xl border border-slate-200 border-t-2 bg-white p-4 ${styles.border} ${className}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        <span className={`text-[9.5px] font-semibold uppercase tracking-[0.18em] ${styles.label}`}>{title}</span>
      </div>
      <div className="space-y-1 text-[12px] leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[74px_1fr] gap-2">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-[12px] text-slate-700">{children}</span>
    </div>
  );
}

export function ItemsTable({
  title,
  items,
  tone = 'emerald',
}: {
  title: string;
  items: OrderItem[];
  tone?: 'emerald' | 'violet';
}) {
  if (!items.length) return null;
  const styles =
    tone === 'emerald'
      ? {
          dot: 'bg-emerald-500',
          band: 'from-emerald-50 to-white',
          label: 'text-emerald-700',
          foot: 'bg-emerald-50/60',
          footLabel: 'text-emerald-700/60',
          footValue: 'text-emerald-900',
        }
      : {
          dot: 'bg-teal-500',
          band: 'from-teal-50 to-white',
          label: 'text-teal-700',
          foot: 'bg-teal-50/60',
          footLabel: 'text-teal-700/60',
          footValue: 'text-teal-900',
        };

  const subtotal = items.reduce(
    (s, i) => s + Number(i.total_price ?? Number(i.quantity) * Number(i.unit_price)),
    0,
  );

  return (
    <div className="break-avoid overflow-hidden rounded-xl border border-slate-200">
      <div className={`flex items-center justify-between border-b border-slate-200 bg-gradient-to-r px-4 py-2.5 ${styles.band}`}>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.label}`}>{title}</span>
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
            <th className="w-9 px-4 py-2 text-left font-semibold">#</th>
            <th className="px-2 py-2 text-left font-semibold">Descrição</th>
            <th className="w-14 px-2 py-2 text-right font-semibold">Qtd</th>
            <th className="w-14 px-2 py-2 text-left font-semibold">Un.</th>
            <th className="w-24 px-2 py-2 text-right font-semibold">Unitário</th>
            <th className="w-24 px-4 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id} className="border-t border-slate-100">
              <td className="px-4 py-2.5 tabular-nums text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
              <td className="px-2 py-2.5 text-slate-700">{it.description}</td>
              <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">{Number(it.quantity)}</td>
              <td className="px-2 py-2.5 text-slate-500">{it.unit || 'un'}</td>
              <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">{money(Number(it.unit_price))}</td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-800">
                {money(Number(it.total_price ?? Number(it.quantity) * Number(it.unit_price)))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={`border-t border-slate-200 ${styles.foot}`}>
            <td colSpan={5} className={`px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] ${styles.footLabel}`}>
              Subtotal {title.toLowerCase()}
            </td>
            <td className={`px-4 py-2 text-right text-[12px] font-semibold tabular-nums ${styles.footValue}`}>{money(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function Totals({
  material,
  service,
  discount,
  total,
}: {
  material: number;
  service: number;
  discount: number;
  total: number;
}) {
  return (
    <div className="flex justify-end">
      <div className="w-full max-w-[300px]">
        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[12px]">
          <div className="flex justify-between text-slate-500">
            <span>Materiais</span>
            <span className="tabular-nums text-slate-700">{money(material)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Serviços</span>
            <span className="tabular-nums text-slate-700">{money(service)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Desconto</span>
              <span className="tabular-nums text-red-600">- {money(discount)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-white shadow-sm shadow-emerald-600/20">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-50/90">Total geral</span>
            <span className="text-[17px] font-semibold tabular-nums">{money(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Signatures({
  city,
  companyName,
  clientName,
}: {
  city?: string | null;
  companyName?: string | null;
  clientName?: string | null;
}) {
  const place = [city, new Date().toLocaleDateString('pt-BR')].filter(Boolean).join(', ');
  return (
    <div className="break-avoid pt-2">
      <div className="mb-6 text-center text-[11px] text-slate-500">{place}</div>
      <div className="grid grid-cols-2 gap-10 text-center">
        <div>
          <div className="mx-auto mb-1.5 h-px w-full max-w-[240px] bg-slate-300" />
          <div className="text-[11.5px] font-medium text-slate-700">{companyName}</div>
          <div className="text-[9.5px] uppercase tracking-[0.14em] text-slate-400">Prestador de serviços</div>
        </div>
        <div>
          <div className="mx-auto mb-1.5 h-px w-full max-w-[240px] bg-slate-300" />
          <div className="text-[11.5px] font-medium text-slate-700">{clientName}</div>
          <div className="text-[9.5px] uppercase tracking-[0.14em] text-slate-400">Aprovação do cliente</div>
        </div>
      </div>
    </div>
  );
}

export function DocFooter({ company }: { company: CompanySettings | null }) {
  return (
    <div className="flex flex-col gap-1 border-t border-emerald-100 bg-emerald-50/40 px-7 py-4 text-[9.5px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-9">
      <span>
        {company?.trade_name || 'Accesstechnology'} · {company?.company_name}
      </span>
      <span>
        {company?.phone || ''}
        {company?.email ? ` · ${company.email}` : ''}
      </span>
    </div>
  );
}
