import React, { useEffect, useState } from "react";
import { PageTransition } from "../components/layout/PageTransition";
import { Header, Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Forms";
import { api } from "../lib/api";
import { Product } from "../types";
import { Plus, Check, Link as LinkIcon, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form
  const [name, setName] = useState("");
  const [pricePen, setPricePen] = useState("");
  const [type, setType] = useState("InfoProduto");
  const [webhook, setWebhook] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.products.list().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const openForm = (product?: Product) => {
    if (product) {
       setEditingProduct(product);
       setName(product.name);
       setPricePen(product.price_pen.toString());
       setType(product.product_type);
       setWebhook(product.webhook_url || "");
    } else {
       setEditingProduct(null);
       setName("");
       setPricePen("");
       setType("InfoProduto");
       setWebhook("");
    }
    setIsCreating(true);
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
         const updated = await api.products.update(editingProduct.id, {
            name,
            price_pen: parseFloat(pricePen),
            product_type: type,
            webhook_url: webhook
         });
         setProducts(products.map(p => p.id === updated.id ? updated : p));
      } else {
         const newProduct = await api.products.create({
            user_id: user?.id || "local",
            name,
            price_pen: parseFloat(pricePen),
            product_type: type,
            webhook_url: webhook,
            is_active: true
         });
         setProducts([newProduct, ...products]);
      }
      setIsCreating(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if (!confirm("Tem certeza que deseja excluir este produto?")) return;
     await api.products.delete(id);
     setProducts(products.filter(p => p.id !== id));
  };

  return (
    <PageTransition>
      <Header 
        title="Produtos" 
        subtitle="Gerencie seus infoprodutos" 
        action={
          !isCreating && (
            <Button size="sm" onClick={() => openForm()}>
              <Plus size={16} className="mr-2" /> Novo
            </Button>
          )
        }
      />
      
      <div className="p-4 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">
        
        {isCreating && (
          <Card className="border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">{editingProduct ? "Editar Produto" : "Criar Novo Produto"}</h3>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nome do Produto" required value={name} onChange={e=>setName(e.target.value)} />
                <Input label="Preço (PEN)" type="number" step="0.01" required value={pricePen} onChange={e=>setPricePen(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Tipo" value={type} onChange={e=>setType(e.target.value)}>
                  <option value="InfoProduto">InfoProduto</option>
                  <option value="Mentoria">Mentoria</option>
                  <option value="Ebook">E-book</option>
                </Select>
                <Input label="Webhook URL (Opcional)" type="url" placeholder="https://" value={webhook} onChange={e=>setWebhook(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>Cancelar</Button>
                <Button isLoading={saving} type="submit">{editingProduct ? "Salvar" : "Criar Produto"}</Button>
              </div>
            </form>
          </Card>
        )}

        {products.length === 0 && !loading && !isCreating ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 border-dashed">
            <p className="text-zinc-500 mb-4">Nenhum produto cadastrado.</p>
            <Button variant="secondary" onClick={() => openForm()}>Criar meu primeiro produto</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id}>
                <Card className="flex flex-col h-full cursor-pointer hover:border-zinc-700 transition" >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-white truncate pr-4">{p.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openForm(p); }} className="text-zinc-400 hover:text-white transition" title="Editar"><Edit size={16} /></button>
                      <button onClick={(e) => handleDelete(p.id, e)} className="text-red-400/70 hover:text-red-300 transition" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="bg-white/10 text-white text-xs px-2 py-1 rounded-md inline-block w-fit mb-4">{p.product_type}</div>
                  <p className="text-xl text-zinc-300 mb-6 font-mono">S/ {p.price_pen.toFixed(2)}</p>
                  <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center text-xs text-zinc-500">
                      {p.webhook_url ? <><LinkIcon size={12} className="mr-1 text-primary"/> Webhook ativado</> : "Sem webhook"}
                    </div>
                    <div className="text-xs flex items-center text-success">
                      <Check size={14} className="mr-1" /> Ativo
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

      </div>
    </PageTransition>
  );
}
