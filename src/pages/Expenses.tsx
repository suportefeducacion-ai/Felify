import React, { useEffect, useState } from "react";
import { PageTransition } from "../components/layout/PageTransition";
import { Header, Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Forms";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/utils";
import { Expense } from "../types";
import { Plus, Wallet, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [expenseType, setExpenseType] = useState("anuncios");
  const [amountBrl, setAmountBrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.expenses.list().then(data => {
      setExpenses(data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const newExpense = await api.expenses.create({
        user_id: user?.id || "local",
        expense_type: expenseType,
        amount_brl: parseFloat(amountBrl),
        expense_date: new Date().toISOString(),
        notes,
      });

      setExpenses([newExpense, ...expenses]);
      setIsCreating(false);
      setAmountBrl(""); setNotes("");
    } catch (err) {
      console.error(err);
      alert("Falha ao registrar gasto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
     if (!confirm("Excluir este gasto do registro?")) return;
     await api.expenses.delete(id);
     setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <PageTransition>
      <Header 
        title="Gastos e Custos" 
        subtitle="Controle de anúncios, impostos e taxas" 
        action={
          !isCreating && (
            <Button size="sm" onClick={() => setIsCreating(true)} variant="secondary">
              <Plus size={16} className="mr-2" /> Novo Gasto
            </Button>
          )
        }
      />
      
      <div className="p-4 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">
        
        {isCreating && (
          <Card className="border-danger/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <div className="mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-danger/10 flex flex-col items-center justify-center text-danger">
                <Wallet size={16} />
              </div>
              <h3 className="text-lg font-medium text-white">Registrar Gasto</h3>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Categoria" value={expenseType} onChange={e=>setExpenseType(e.target.value)}>
                  <option value="anuncios">Anúncios (Facebook, Google)</option>
                  <option value="impostos">Impostos</option>
                  <option value="taxas">Taxas de Gateway</option>
                  <option value="outros">Outros Custos</option>
                </Select>
                <Input label="Valor em Reais (BRL)" type="number" step="0.01" required value={amountBrl} onChange={e=>setAmountBrl(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Input label="Observações" placeholder="Campanha CBO 01..." value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>Cancelar</Button>
                <Button isLoading={saving} type="submit" variant="danger">Descontar do Caixa</Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="p-0 overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/5 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">Observações</th>
                  <th className="px-6 py-4 font-medium">Valor (BRL)</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-zinc-400">
                      {format(new Date(exp.expense_date), "dd MMM yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 capitalize">{exp.expense_type}</td>
                    <td className="px-6 py-4 text-zinc-500 max-w-[200px] truncate">{exp.notes || "-"}</td>
                    <td className="px-6 py-4 font-mono font-medium text-danger">
                      - {formatCurrency(exp.amount_brl)}
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                       <button onClick={() => handleDelete(exp.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir Gasto"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && !loading && (
              <div className="text-center py-12 text-zinc-500">Nenhum gasto registrado.</div>
            )}
          </div>
        </Card>

      </div>
    </PageTransition>
  );
}
