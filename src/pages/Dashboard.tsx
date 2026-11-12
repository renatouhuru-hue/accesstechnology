export default function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Painel</h1>
      <p className="text-slate-600">Visão geral de orçamentos, serviços e financeiro.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">Orçamentos em aberto</div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">Serviços em andamento</div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">Recebimentos do mês</div>
      </div>
    </div>
  );
}
