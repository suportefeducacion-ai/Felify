import React, { useEffect, useState } from "react";
import { PageTransition } from "../components/layout/PageTransition";
import { Card } from "../components/ui/Card";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/utils";
import { Sale, Expense, QuickButton, Product } from "../types";
import { Activity, Target, Presentation, ShoppingCart, Zap, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quickButtons, setQuickButtons] = useState<QuickButton[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([
      api.sales.list(), 
      api.expenses.list(),
      api.quickButtons.get(),
      api.products.list()
    ]).then(([s, e, qb, p]) => {
      setSales(s);
      setExpenses(e);
      setQuickButtons(qb);
      setProducts(p);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickSale = async (btn: QuickButton) => {
    if (processingId) return;
    const product = products.find(p => p.id === btn.productId);
    if (!product) return alert("Produto não encontrado.");

    setProcessingId(btn.id);
    
    try {
      const exchangeRate = await api.exchangeRate.getBrlRate();
      const amountBrl = product.price_pen * exchangeRate;

      const saleData: Partial<Sale> = {
        user_id: product.user_id,
        product_id: product.id,
        plan: "único",
        amount_pen: product.price_pen,
        exchange_rate: exchangeRate,
        amount_brl: amountBrl,
        sale_date: new Date().toISOString(),
        status: "aprovado",
        notes: `Atalho via Botão Rápido: ${btn.name}`
      };

      const created = await api.sales.create(saleData);

      if (product.webhook_url) {
        const payload = {
          event: "purchase_approved",
          product: product.name,
          value_pen: product.price_pen,
          value_brl: amountBrl,
          date: created.sale_date
        };
        api.webhooks.trigger(product.webhook_url, payload);
      }

      setProcessingId(null);
      setSuccessId(btn.id);
      
      // Reload chart
      loadData();

      setTimeout(() => setSuccessId(null), 2000);
    } catch (e) {
      console.error(e);
      setProcessingId(null);
      alert("Erro ao registrar venda.");
    }
  };

  if (loading) return null;

  const totalSalesBrl = sales.filter(s => s.status === 'aprovado').reduce((acc, curr) => acc + curr.amount_brl, 0);
  const totalExpensesBrl = expenses.reduce((acc, curr) => acc + curr.amount_brl, 0);
  const adExpensesBrl = expenses.filter(e => e.expense_type === 'anuncios').reduce((acc, curr) => acc + curr.amount_brl, 0);
  
  const netProfit = totalSalesBrl - totalExpensesBrl;
  const roas = adExpensesBrl > 0 ? (totalSalesBrl / adExpensesBrl).toFixed(1) : "0";
  
  const today = new Date().toDateString();
  const salesTodayCount = sales.filter(s => s.status === 'aprovado' && new Date(s.sale_date).toDateString() === today).length;
  
  // Real chart data based on last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const daySales = sales.filter(s => s.status === 'aprovado' && new Date(s.sale_date).toDateString() === d.toDateString());
    return {
      date: format(d, "dd MMM", { locale: ptBR }),
      revenue: daySales.reduce((acc, curr) => acc + curr.amount_brl, 0),
    };
  });

  const activeQuickButtons = quickButtons.filter(btn => btn.isActive && btn.productId && products.some(p => p.id === btn.productId));

  return (
    <PageTransition>
      {/* Mobile Premium Header */}
      <div className="flex lg:hidden items-center justify-center px-2 pt-6 pb-2">
        <div className="flex items-center gap-0">
          <img src="https://i.imgur.com/sLdpnD6.png" alt="FELIFY" referrerPolicy="no-referrer" className="h-28 w-auto object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block mb-8 px-8 mt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Visão Geral</h1>
        <p className="text-sm text-zinc-400 mt-1">Métricas financeiras em tempo real</p>
      </div>

      <div className="p-4 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">

        {/* Botões de Venda Rápida */}
        {activeQuickButtons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQuickButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleQuickSale(btn)}
                disabled={processingId !== null}
                className={`
                  relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border
                  transition-all duration-300 transform active:scale-[0.98]
                  ${successId === btn.id 
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] glow-effect'
                  }
                `}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${successId === btn.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/10 text-primary'}
                  `}>
                    {successId === btn.id ? <CheckCircle2 size={24} className="animate-pulse" /> : <Zap size={24} />}
                  </div>
                  <div className="text-left flex flex-col justify-center">
                    <span className="font-semibold text-white tracking-tight">{btn.name}</span>
                    <span className="text-xs text-zinc-400">1-clique para registrar venda</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Target size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">ROAS</span>
            </div>
            <span className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
              {roas}x
            </span>
            <div className="flex items-center text-xs text-zinc-500 mt-1">
              <span>Retorno sobre investimento</span>
            </div>
          </Card>

          <Card className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Activity size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Lucro Líquido</span>
            </div>
            <span className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
              {formatCurrency(netProfit)}
            </span>
            <div className="flex items-center text-xs text-zinc-500 mt-1">
              <span>Total acumulado</span>
            </div>
          </Card>
          
          <Card className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Presentation size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Gasto com Anúncios</span>
            </div>
            <span className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
              {formatCurrency(adExpensesBrl)}
            </span>
            <div className="flex items-center text-xs text-zinc-500 mt-1">
              <span>Valor investido</span>
            </div>
          </Card>

          <Card className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <ShoppingCart size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Vendas Hoje</span>
            </div>
            <span className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
              {salesTodayCount} {salesTodayCount === 1 ? 'venda' : 'vendas'}
            </span>
            <div className="flex items-center text-xs text-zinc-500 mt-1">
              <span>Pedidos aprovados hoje</span>
            </div>
          </Card>
        </div>

        {/* Chart */}
        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400">Faturamento</h3>
            <p className="text-xl text-white font-semibold mt-1">Últimos 7 Dias</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis hide={true} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </PageTransition>
  );
}
