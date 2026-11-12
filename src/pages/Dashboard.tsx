import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, CalendarDays, Wallet, ArrowRight } from 'lucide-react';
import type { Appointment, Client, Order, Payment } from '../types';
import { listRows } from '../lib/db';
import { Card, money } from '../components/ui';
import { quoteLabels, serviceLabels } from './OrdersPage';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
        setOrders(o); setClients(c); setAppointments(a); setPayments(p);
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    })();
  }, []);

  const openQuotes = orders.filter(o => o.quote_status === 'rascunho' || o.quote_status === 'enviado');
  const approved = orders.filter(o => o.quote_status === 'aprovado');
  const running = orders.filter(o => o.service_status === 'em_andamento' || o.service_status === 'agendado');
  const receivables = payments.filter(p => p.kind === 'receita' && p.status === 'pendente').reduce((s, p) => s + Number(p.amount), 0);
  const upcoming = appointments.filter(a => new Date(a.start_at) >= new Date()).sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at)).slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="text-slate-600">Visão geral de orçamentos, serviços, agenda e financeiro.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Stat icon={FileText} label="Orçamentos em aberto" value={String(openQuotes.length)} hint={`${orders.length} no total`} />
        <Stat icon={Users} label="Clientes" value={String(clients.length)} hint="cadastrados" />
        <Stat icon={CalendarDays} label="Serviços ativos" value={String(running.length)} hint={`${approved.length} aprovados`} />
        <Stat icon={Wallet} label="A receber" value={money(receivables)} hint="pagamentos pendentes" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Orçamentos recentes</h2>
            <Link to="/ordens" className="text-sm text-emerald-700 inline-flex items-center gap-1">Ver todos <ArrowRight size={14} /></Link>
          </div>
          {loading ? <p className="text-sm text-slate-500">Carregando…</p> : orders.length === 0 ? <p className="text-sm text-slate-500">Nenhum orçamento ainda.</p> : (
            <table className="w-full text-sm">
              <tbody>
                {orders.slice(0, 6).map(o => {
                  const cli = clients.find(c => c.id === o.client_id);
                  return (
                    <tr key={o.id} className="border-t">
                      <td className="py-2 text-slate-500">#{o.number ?? '—'}</td>
                      <td className="py-2 font-medium">{cli?.trade_name || cli?.company_name || '—'}</td>
                      <td className="py-2">{o.title || '—'}</td>
                      <td className="py-2 text-right text-xs">{quoteLabels[o.quote_status]} · {serviceLabels[o.service_status]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Próximos agendamentos</h2>
            <Link to="/agenda" className="text-sm text-emerald-700 inline-flex items-center gap-1">Agenda <ArrowRight size={14} /></Link>
          </div>
          {upcoming.length === 0 ? <p className="text-sm text-slate-500">Nada agendado.</p> : (
            <div className="space-y-2">
              {upcoming.map(a => (
                <div key={a.id} className="border-l-2 border-emerald-500 pl-3 py-1">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-slate-500">{new Date(a.start_at).toLocaleString('pt-BR')}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs"><Icon size={16} /> {label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </Card>
  );
}
