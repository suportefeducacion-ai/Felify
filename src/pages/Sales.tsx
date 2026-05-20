import React, { useEffect, useState } from "react";
import { PageTransition } from "../components/layout/PageTransition";
import { Header, Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Forms";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/utils";
import { Product, Sale } from "../types";
import { Plus, ArrowRight, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Form State
  const [productId, setProductId] = useState("");
  const [plan, setPlan] = useState("Premium");
  const [status, setStatus] = useState<"aprovado" | "reembolsado">("aprovado");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.sales.list(), api.products.list()]).then(([s, p]) => {
      // Create a map for fast lookup
      const productMap: Record<string, Product> = {};
      p.forEach(prod => productMap[prod.id] = prod);

      // Join product names manually for local state
      const joinedSales = s.map(sale => ({
         ...sale,
         products: { name: productMap[sale.product_id]?.name || "Produto Removido" }
      }));

      setSales(joinedSales);
      setProducts(p);
      if (p.length > 0 && !productId) setProductId(p[0].id);
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
     setIsCreating(false);
     setEditingSale(null);
     setPlan("Premium");
     setStatus("aprovado");
     if (products.length > 0) setProductId(products[0].id);
  }

  const openCreate = () => {
     resetForm();
     setIsCreating(true);
  }

  const openEdit = (sale: Sale) => {
     setEditingSale(sale);
     setProductId(sale.product_id);
     setPlan(sale.plan);
     setStatus(sale.status);
     setIsCreating(true);
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error("Produto inválido");

      let finalSale;
      const amountBrl = editingSale ? editingSale.amount_brl : product.price_pen * (await api.exchangeRate.getBrlRate());

      if (editingSale) {
         // Update existing
         finalSale = await api.sales.update(editingSale.id, {
            product_id: product.id,
            plan,
            status
         });
         
         const updatedList = sales.map(s => s.id === editingSale.id ? { ...finalSale, products: { name: product.name } } as unknown as Sale : s);
         setSales(updatedList);
      } else {
         // Create new
         const rate = await api.exchangeRate.getBrlRate();
         finalSale = await api.sales.create({
            user_id: user?.id || "local",
            product_id: product.id,
            plan,
            amount_pen: product.price_pen,
            exchange_rate: rate,
            amount_brl: amountBrl,
            sale_date: new Date().toISOString(),
            status,
         });

         setSales([{...finalSale, products: { name: product.name }} as unknown as Sale, ...sales]);
      }

      resetForm();

      if (product.webhook_url && status !== editingSale?.status) {
        // Trigger if status changed or it's new
        const eventId = status === "aprovado" ? "purchase_approved" : "purchase_refunded";
        api.webhooks.trigger(product.webhook_url, {
          event: eventId,
          sale_id: finalSale.id,
          product_name: product.name,
          plan,
          amount_pen: product.price_pen,
          amount_brl: amountBrl
        });
      }
      
    } catch (err) {
      console.error(err);
      alert("Falha ao registrar venda.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
     if (!confirm("Tem certeza que deseja excluir esta venda?")) return;
     await api.sales.delete(id);
     setSales(sales.filter(s => s.id !== id));
  };

  return (
    <PageTransition>
      <Header 
        title="Vendas" 
        subtitle="Controle de caixa" 
        action={
          !isCreating && (
            <Button size="sm" onClick={openCreate}>
              <Plus size={16} className="mr-2" /> Nova Venda
            </Button>
          )
        }
      />
      
      <div className="p-4 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">
        
        {isCreating && (
          <Card className="border-success/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">{editingSale ? "Editar Venda" : "Registrar Venda"}</h3>
              {!editingSale && <p className="text-xs text-zinc-400">A cotação BRL será aplicada automaticamente em tempo real.</p>}
            </div>
            {products.length === 0 ? (
              <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm border border-red-500/20">
                Você precisa cadastrar um produto antes de registrar uma venda.
              </div>
            ) : (
              <form onSubmit={handleCreateOrUpdate} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Produto" value={productId} onChange={e=>setProductId(e.target.value)} disabled={!!editingSale}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - S/ {p.price_pen}</option>)}
                  </Select>
                  <Select label="Plano" value={plan} onChange={e=>setPlan(e.target.value)}>
                    <option value="Premium">Premium</option>
                    <option value="Básico">Básico</option>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Status" value={status} onChange={e=>setStatus(e.target.value as any)}>
                    <option value="aprovado">Aprovado</option>
                    <option value="reembolsado">Reembolsado</option>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <Button variant="ghost" type="button" onClick={resetForm}>Cancelar</Button>
                  <Button isLoading={saving} type="submit" className="bg-success text-white hover:bg-success/90">{editingSale ? "Salvar" : "Confirmar Venda"}</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/5 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Valor (PEN)</th>
                  <th className="px-6 py-4 font-medium">Valor Convertido</th>
                  <th className="px-6 py-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      {/* @ts-ignore */}
                      {sale.products?.name || "Produto Removido"}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-zinc-400">{sale.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      {sale.status === 'aprovado' ? (
                        <span className="text-success border border-success/20 bg-success/10 px-2 py-1 rounded-md text-xs">Aprovado</span>
                      ) : (
                        <span className="text-danger border border-danger/20 bg-danger/10 px-2 py-1 rounded-md text-xs">Reembolsado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {format(new Date(sale.sale_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4">S/ {sale.amount_pen?.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono font-medium text-white flex items-center gap-2">
                      <ArrowRight size={14} className="text-zinc-600"/>
                      {formatCurrency(sale.amount_brl)}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                       <button onClick={() => openEdit(sale)} className="text-zinc-400 hover:text-white transition-colors" title="Editar Status"><Edit size={16}/></button>
                       <button onClick={() => handleDelete(sale.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && !loading && (
              <div className="text-center py-12 text-zinc-500">Nenhuma venda registrada asssociada a este filtro.</div>
            )}
          </div>
        </Card>

      </div>
    </PageTransition>
  );
}
