import React, { useEffect, useState } from "react";
import { PageTransition } from "../components/layout/PageTransition";
import { Header, Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Forms";
import { api } from "../lib/api";
import { Save, Zap } from "lucide-react";
import { Product, QuickButton } from "../types";

export default function Settings() {
  const [manualRate, setManualRate] = useState("1.45");
  const [useManual, setUseManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastAutoRate, setLastAutoRate] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [quickButtons, setQuickButtons] = useState<QuickButton[]>([
    { id: "1", isActive: false, name: "Botão 1", productId: "" },
    { id: "2", isActive: false, name: "Botão 2", productId: "" }
  ]);

  useEffect(() => {
    api.exchangeRate.getSettings().then(settings => {
       setManualRate(settings.manualRate.toString());
       setUseManual(settings.useManual);
       setLastAutoRate(settings.lastAutoRate);
    });
    api.products.list().then(setProducts);
    api.quickButtons.get().then(setQuickButtons);
  }, []);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await api.exchangeRate.saveSettings({
       manualRate: parseFloat(manualRate),
       useManual
    });
    setSaving(false);
    alert("Cotação atualizada com sucesso!");
  };

  const handleSaveButtons = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await api.quickButtons.save(quickButtons);
    setSaving(false);
    alert("Botões de atalho atualizados com sucesso!");
  };

  const updateButton = (id: string, updates: Partial<QuickButton>) => {
    setQuickButtons(prev => prev.map(btn => btn.id === id ? { ...btn, ...updates } : btn));
  };

  return (
    <PageTransition>
      <Header title="Ajustes" subtitle="Configurações do sistema" />
      
      <div className="p-4 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">
        
        <Card className="max-w-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-1">Cotação PEN ➔ BRL</h3>
            <p className="text-sm text-zinc-400">Configure como o sistema converte Sol Peruano para Real.</p>
          </div>
          
          <form onSubmit={handleSaveRate} className="flex flex-col gap-5">
            <Select 
              label="Modo de Cotação" 
              value={useManual ? "manual" : "auto"} 
              onChange={e => setUseManual(e.target.value === "manual")}
            >
              <option value="auto">Automático (API em tempo real)</option>
              <option value="manual">Manual (Cotação Fixa)</option>
            </Select>

            {useManual && (
              <Input 
                label="Cotação Manual (Em R$)" 
                type="number" 
                step="0.0001" 
                required 
                value={manualRate} 
                onChange={e => setManualRate(e.target.value)} 
                helper="Quantos Reais (BRL) equivalem a 1 Sol (PEN)? Ex: 1.45"
              />
            )}

            {!useManual && lastAutoRate !== null && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-300">
                Última cotação automática salva: <strong className="text-white">R$ {lastAutoRate.toFixed(4)}</strong>
              </div>
            )}
            
            <div className="pt-2">
              <Button isLoading={saving} type="submit" className="w-full sm:w-auto">
                <Save size={16} className="mr-2" /> Salvar Cotação
              </Button>
            </div>
          </form>
        </Card>

        <Card className="max-w-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
              <Zap className="text-primary w-5 h-5" /> 
              Botões de Venda Rápida
            </h3>
            <p className="text-sm text-zinc-400">Configure os atalhos no dashboard para registrar vendas rapidamente.</p>
          </div>

          <form onSubmit={handleSaveButtons} className="flex flex-col gap-6">
            {quickButtons.map((btn, idx) => (
              <div key={btn.id} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Botão {idx + 1}</h4>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-700 bg-zinc-900 text-primary"
                      checked={btn.isActive}
                      onChange={(e) => updateButton(btn.id, { isActive: e.target.checked })}
                    />
                    <span className={btn.isActive ? "text-white" : "text-zinc-500"}>Ativo no Dashboard</span>
                  </label>
                </div>
                
                {btn.isActive && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Nome do Atalho" 
                      value={btn.name} 
                      onChange={(e) => updateButton(btn.id, { name: e.target.value })}
                      placeholder="Ex: Venda Dia dos Pais"
                      required={btn.isActive}
                    />
                    <Select
                      label="Produto Vinculado"
                      value={btn.productId}
                      onChange={(e) => updateButton(btn.id, { productId: e.target.value })}
                      required={btn.isActive}
                    >
                      <option value="">Selecione um produto...</option>
                      {products.filter(p => p.is_active).map(p => (
                        <option key={p.id} value={p.id}>{p.name} (S/ {p.price_pen})</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            ))}
            <div className="pt-2">
              <Button isLoading={saving} type="submit" className="w-full sm:w-auto">
                <Save size={16} className="mr-2" /> Salvar Botões
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </PageTransition>
  );
}
