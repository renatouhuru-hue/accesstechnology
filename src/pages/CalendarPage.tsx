import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, Client, Order } from '../types';
import { listRows, insertRow, updateRow, deleteRow } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import { Card, PageHeader, Button, Field, TextArea, Select, Empty, ErrorBox } from '../components/ui';

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};
const statusColors: Record<string, string> = {
  agendado: 'bg-amber-50 text-amber-700',
  confirmado: 'bg-teal-50 text-teal-700',
  em_andamento: 'bg-teal-100 text-teal-800',
  concluido: 'bg-emerald-50 text-emerald-700',
  cancelado: 'bg-slate-200 text-slate-500',
};

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function CalendarPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Appointment> | null>(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [a, c, o] = await Promise.all([
        listRows<Appointment>('appointments', 'start_at', true),
        listRows<Client>('clients', 'company_name', true),
        listRows<Order>('orders', 'created_at', false),
      ]);
      setItems(a); setClients(c); setOrders(o);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const firstWeekday = monthStart.getDay();

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of items) {
      const d = new Date(a.start_at);
      if (d >= monthStart && d < monthEnd) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        (map[key] ||= []).push(a);
      }
    }
    return map;
  }, [items, monthStart.getTime(), monthEnd.getTime()]);

  const openNew = (date?: Date) => {
    const base = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0) : new Date();
    setEditing({
      title: '',
      description: '',
      start_at: new Date(base.getTime() - base.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      end_at: '',
      status: 'agendado',
      client_id: '',
      order_id: '',
      location: '',
    });
  };

  const save = async () => {
    if (!editing?.title?.trim()) return alert('Título é obrigatório');
    if (!editing?.start_at) return alert('Informe a data/hora');
    try {
      const payload: any = {
        title: editing.title,
        description: editing.description || null,
        start_at: new Date(editing.start_at).toISOString(),
        end_at: editing.end_at ? new Date(editing.end_at).toISOString() : null,
        status: editing.status || 'agendado',
        client_id: editing.client_id || null,
        order_id: editing.order_id || null,
        location: editing.location || null,
      };
      if (editing.id) await updateRow('appointments', editing.id, payload);
      else await insertRow('appointments', payload);
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar agendamento');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este agendamento?')) return;
    try { await deleteRow('appointments', id); await load(); } catch (e: any) { alert(e?.message || 'Erro ao excluir'); }
  };

  if (!isSupabaseConfigured) return <ErrorBox message="Supabase não configurado." />;

  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const upcoming = items
    .filter(a => new Date(a.start_at) >= new Date())
    .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <PageHeader title="Agenda" eyebrow="Operação" subtitle="Agendamento dos serviços." action={<Button onClick={() => openNew()}><Plus size={18} /> Novo agendamento</Button>} />
      {error && <ErrorBox message={error} />}

      {editing && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Título" required value={editing.title || ''} onChange={v => setEditing({ ...editing, title: v })} />
            <Select label="Status" value={editing.status || 'agendado'} onChange={v => setEditing({ ...editing, status: v as any })} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
            <Field label="Início" type="datetime-local" value={editing.start_at || ''} onChange={v => setEditing({ ...editing, start_at: v })} />
            <Field label="Fim" type="datetime-local" value={editing.end_at || ''} onChange={v => setEditing({ ...editing, end_at: v })} />
            <Select label="Cliente" value={editing.client_id || ''} onChange={v => setEditing({ ...editing, client_id: v })} options={[{ value: '', label: '—' }, ...clients.map(c => ({ value: c.id, label: c.trade_name || c.company_name }))]} />
            <Select label="Orçamento/OS" value={editing.order_id || ''} onChange={v => setEditing({ ...editing, order_id: v })} options={[{ value: '', label: '—' }, ...orders.map(o => ({ value: o.id, label: `#${o.number ?? '-'} ${o.title || ''}` }))]} />
            <Field label="Local" value={editing.location || ''} onChange={v => setEditing({ ...editing, location: v })} />
            <TextArea label="Descrição" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save}><Save size={16} /> Salvar</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}><X size={16} /> Cancelar</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded hover:bg-slate-100"><ChevronLeft size={18} /></button>
            <div className="font-semibold capitalize">{monthLabel}</div>
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded hover:bg-slate-100"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 text-xs text-slate-500 mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="text-center py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
              const key = `${date.getFullYear()}-${date.getMonth()}-${day}`;
              const list = byDay[key] || [];
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <button key={day} onClick={() => openNew(date)} className={`min-h-[76px] border rounded-lg p-1 text-left align-top hover:bg-slate-50 ${isToday ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200'}`}>
                  <div className={`text-xs ${isToday ? 'font-bold text-emerald-700' : 'text-slate-500'}`}>{day}</div>
                  {list.slice(0, 2).map(a => (
                    <div key={a.id} className="text-[10px] truncate mt-0.5 px-1 rounded bg-slate-100">{a.title}</div>
                  ))}
                  {list.length > 2 && <div className="text-[10px] text-slate-500 mt-0.5">+{list.length - 2}</div>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-semibold mb-2">Próximos</div>
          {loading ? <Empty message="Carregando…" /> : upcoming.length === 0 ? <Empty message="Nenhum agendamento futuro." /> : (
            <div className="space-y-2">
              {upcoming.map(a => (
                <div key={a.id} className="border rounded-lg p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{a.title}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
                  </div>
                  <div className="text-xs text-slate-500">{new Date(a.start_at).toLocaleString('pt-BR')}</div>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button onClick={() => setEditing({ ...a, start_at: toLocalInput(a.start_at), end_at: toLocalInput(a.end_at) })} className="p-1 rounded hover:bg-slate-100"><Pencil size={14} /></button>
                    <button onClick={() => remove(a.id)} className="p-1 rounded hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-3 font-semibold border-b">Todos os agendamentos</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="text-left p-3">Título</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Início</th><th className="text-left p-3">Status</th><th className="p-3 w-24"></th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5}><Empty message="Carregando…" /></td></tr> : items.length === 0 ? <tr><td colSpan={5}><Empty message="Nenhum agendamento." /></td></tr> : items.map(a => (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-medium">{a.title}</td>
                <td className="p-3">{clients.find(c => c.id === a.client_id)?.trade_name || clients.find(c => c.id === a.client_id)?.company_name || '—'}</td>
                <td className="p-3 text-slate-500">{new Date(a.start_at).toLocaleString('pt-BR')}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{statusLabels[a.status]}</span></td>
                <td className="p-3"><div className="flex gap-1 justify-end">
                  <button onClick={() => setEditing({ ...a, start_at: toLocalInput(a.start_at), end_at: toLocalInput(a.end_at) })} className="p-1.5 rounded hover:bg-slate-100"><Pencil size={16} /></button>
                  <button onClick={() => remove(a.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
