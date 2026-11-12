import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, CalendarDays, Wallet, ArrowRight, ArrowUpRight, Plus, Receipt, Bot, Sparkles,
} from 'lucide-react';
import type { Appointment, Client, Order, Payment } from '../types';
import { listRows } from '../lib/db';
import { supabase } from '../lib/supabase';
import { Avatar, Badge, Card, money } from '../components/ui';
import type { Tone } from '../components/ui';
import { quoteLabels } from './OrdersPage';

const quoteTones: Record<string, Tone> = {
  rascunho: 'slate',
  enviado: 'blue',
  aprovado: 'emerald',
  reprovado: 'red',
  cancelado: 'slate',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, c, a, p] = await Promise.all([
          listRows<Order>('orders', 'created_at', false),
          listRows<Client>('clients', 'company_name', true),
          listRows<Appointment>('appointments', 'start_at', true),
          listRows<Payment>('payments', 'created_at', false),
        ]);
        setOrders(o);
        setClients(c);
        setAppointments(a);
        setPayments(p);

        if (supabase) {
          const { data: rows } = await supabase.from('order_items').select('order_id,total_price');
          const map: Record<string, number> = {};
          for (const r of rows || []) map[r.order_id] = (map[r.order_id] || 0) + Number(r.total_price || 0);
          setTotals(map);
        }
      } catch {
        /* silencioso */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openQuotes = orders.filter(o => o.quote_status === 'rascunho' || o.quote_status === 'enviado');
  const approved = orders.filter(o => o.quote_status === 'aprovado');
  const running = orders.filter(o => o.service_status === 'em_andamento' || o.service_status === 'agendado');
  const receivables = payments.filter(p => p.kind === 'receita' && p.status === 'pendente').reduce((s, p) => s + Number(p.amount), 0);
  const upcoming = appointments
    .filter(a => new Date(a.start_at) >= new Date())
    .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at))
    .slice(0, 4);

  const openValue = openQuotes.reduce((s, o) => s + (totals[o.id] || 0), 0);
  const approvedValue = approved.reduce((s, o) => s + (totals[o.id] || 0), 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1220] px-6 py-7 text-white shadow-2xl shadow-slate-900/20 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              <Sparkles size={13} /> Painel de controle
            </div>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
              {greeting()}, Renato
            </h1>
            <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-slate-400">
              Você tem <span className="font-medium text-white">{openQuotes.length} propostas em aberto</span> e{' '}
              <span className="font-medium text-white">{running.length} serviços em andamento</span>. Acompanhe tudo
              em um só lugar.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/ordens"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                <Plus size={16} /> Novo orçamento
              </Link>
              <Link
                to="/agenda"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-slate-200 transition hover:bg-white/10"
              >
                <CalendarDays size={16} /> Ver agenda
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Em aberto</div>
              <div className="mt-1 text-[18px] font-semibold tabular-nums">{money(openValue)}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-200/80">Aprovado</div>
              <div className="mt-1 text-[18px] font-semibold tabular-nums text-emerald-100">{money(approvedValue)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} label="Propostas em aberto" value={String(openQuotes.length)} hint={`${orders.length} documentos no total`} tone="blue" />
        <Kpi icon={Users} label="Clientes ativos" value={String(clients.length)} hint="base cadastrada" tone="violet" />
        <Kpi icon={CalendarDays} label="Serviços em curso" value={String(running.length)} hint={`${approved.length} aprovados`} tone="amber" />
        <Kpi icon={Wallet} label="A receber" value={money(receivables)} hint="lançamentos pendentes" tone="emerald" />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Orçamentos recentes</h2>
              <p className="text-[11.5px] text-slate-400">Últimos documentos emitidos</p>
            </div>
            <Link to="/ordens" className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 hover:text-emerald-800">
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-400">Carregando…</div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FileText size={20} />
              </div>
              <div className="text-sm font-medium text-slate-700">Nenhum orçamento ainda</div>
              <div className="text-xs text-slate-400">Crie sua primeira proposta para começar.</div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {orders.slice(0, 6).map(o => {
                const cli = clients.find(c => c.id === o.client_id);
                const name = cli?.trade_name || cli?.company_name || '—';
                return (
                  <li key={o.id}>
                    <Link to={`/ordens/${o.id}/imprimir`} target="_blank" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/70">
                      <Avatar name={name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium text-slate-800">{name}</span>
                          <span className="text-[10.5px] tabular-nums text-slate-400">#{String(o.number ?? '—').padStart(2, '0')}</span>
                        </div>
                        <div className="truncate text-[11.5px] text-slate-400">{o.title || 'Sem título'}</div>
                      </div>
                      <div className="hidden sm:block">
                        <Badge tone={quoteTones[o.quote_status]} dot>{quoteLabels[o.quote_status]}</Badge>
                      </div>
                      <div className="w-24 text-right text-[12.5px] font-semibold tabular-nums text-slate-900">
                        {totals[o.id] ? money(totals[o.id]) : '—'}
                      </div>
                      <ArrowUpRight size={14} className="text-slate-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Próximos serviços</h2>
                <p className="text-[11.5px] text-slate-400">Agenda da semana</p>
              </div>
              <Link to="/agenda" className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 hover:text-emerald-800">
                Agenda <ArrowRight size={13} />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-6 text-center text-[12.5px] text-slate-400">Nada agendado por enquanto.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map(a => {
                  const d = new Date(a.start_at);
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                        <span className="text-[13px] font-semibold leading-none">{d.getDate()}</span>
                        <span className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-400">
                          {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium text-slate-800">{a.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {a.location || 'Aracaju'}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Ações rápidas</div>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink to="/ordens" icon={FileText} label="Orçamento" />
              <QuickLink to="/clientes" icon={Users} label="Cliente" />
              <QuickLink to="/recibos" icon={Receipt} label="Recibo" />
              <QuickLink to="/assistente" icon={Bot} label="Assistente" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const kpiTones = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
} as const;

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  tone: keyof typeof kpiTones;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="text-[11.5px] font-medium text-slate-500">{label}</div>
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${kpiTones[tone]}`}>
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-2 text-[24px] font-semibold leading-none tabular-nums text-slate-900">{value}</div>
      {hint && <div className="mt-1.5 text-[11px] text-slate-400">{hint}</div>}
    </Card>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-800"
    >
      <Icon size={15} className="text-slate-400" />
      {label}
    </Link>
  );
}
