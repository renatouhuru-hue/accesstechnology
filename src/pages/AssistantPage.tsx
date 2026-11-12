import { useEffect, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { listRows } from '../lib/db';
import { GROQ_API_KEY, isGroqAvailable } from '../config/runtime';
import type { Client, Order } from '../types';
import { Card, PageHeader, Button, ErrorBox, money } from '../components/ui';

const MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

async function callGroq(prompt: string): Promise<string> {
  let lastErr = '';
  for (const model of MODELS) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Você é um assistente de uma empresa de TI (Accesstechnology). Responda em português do Brasil, de forma clara e objetiva. Quando gerar relatório, use markdown com tabelas quando fizer sentido.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 2500,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    }
    lastErr = `${model}: HTTP ${res.status}`;
  }
  throw new Error(lastErr || 'Falha na IA');
}

const samples = [
  'Gere um relatório resumido dos orçamentos e serviços, com totais por status.',
  'Analise os clientes cadastrados e sugira ações comerciais para os próximos 30 dias.',
  'Escreva um e-mail profissional cobrando a aprovação de orçamentos enviados.',
];

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [useContext, setUseContext] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, c] = await Promise.all([
          listRows<Order>('orders', 'created_at', false),
          listRows<Client>('clients', 'company_name', true),
        ]);
        setOrders(o);
        setClients(c);
      } catch { /* silencioso */ }
    })();
  }, []);

  const run = async (prompt: string) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setOutput('');
    try {
      let context = '';
      if (useContext) {
        const lines = orders.slice(0, 50).map(o => {
          const cli = clients.find(c => c.id === o.client_id);
          return `#${o.number ?? '-'} | ${cli?.trade_name || cli?.company_name || '-'} | orçamento: ${o.quote_status} | serviço: ${o.service_status} | data: ${o.issue_date || '-'} | desconto: ${money(Number(o.discount))}`;
        });
        context = `\n\nDados atuais do sistema (${orders.length} orçamentos, ${clients.length} clientes):\n${lines.join('\n')}`;
      }
      setOutput(await callGroq(prompt + context));
    } catch (e: any) {
      setError(e?.message || 'Erro ao consultar a IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Assistente IA" subtitle="Gere relatórios, textos e análises com base nos seus dados." />

      {!isGroqAvailable && <ErrorBox message="Groq não configurada. Defina VITE_GROQ_API_KEY no .env.local (ou na Vercel)." />}

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {samples.map(s => (
            <button key={s} onClick={() => { setInput(s); run(s); }} className="text-xs px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50">
              {s.length > 60 ? s.slice(0, 57) + '…' : s}
            </button>
          ))}
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={4}
          placeholder="Peça um relatório, um e-mail, uma análise…"
          className="w-full border border-slate-300 rounded-lg p-3 text-sm"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={useContext} onChange={e => setUseContext(e.target.checked)} />
            Incluir dados atuais (clientes/orçamentos)
          </label>
          <Button onClick={() => run(input)} disabled={loading || !isGroqAvailable}>
            <Send size={16} /> {loading ? 'Gerando…' : 'Enviar'}
          </Button>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      {output && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2"><Sparkles size={16} /> Resultado</div>
          <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {output}
          </div>
          <div className="mt-4 flex gap-2 print:hidden">
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(output)}>Copiar</Button>
            <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
