import { Product, Sale, Expense, WebhookLog, QuickButton } from "../types";

// Helper for local mock storage
const lS = {
  get: <T>(key: string, def: T): T => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set: (key: string, val: any) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
}

export const api = {
  products: {
    list: async (): Promise<Product[]> => {
      return lS.get("local_products", []);
    },
    create: async (product: Partial<Product>) => {
      const curr = lS.get<Product[]>("local_products", []);
      const next = { ...product, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Product;
      lS.set("local_products", [next, ...curr]);
      return next;
    },
    update: async (id: string, updates: Partial<Product>) => {
      const curr = lS.get<Product[]>("local_products", []);
      const next = curr.map(p => p.id === id ? { ...p, ...updates } : p);
      lS.set("local_products", next);
      return next.find(p => p.id === id)!;
    },
    delete: async (id: string) => {
      const curr = lS.get<Product[]>("local_products", []);
      lS.set("local_products", curr.filter(p => p.id !== id));
      return true;
    }
  },
  sales: {
    list: async (): Promise<Sale[]> => {
      return lS.get("local_sales", []);
    },
    create: async (sale: Partial<Sale>) => {
      const curr = lS.get<Sale[]>("local_sales", []);
      const next = { ...sale, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Sale;
      lS.set("local_sales", [next, ...curr]);
      return next;
    },
    update: async (id: string, updates: Partial<Sale>) => {
      const curr = lS.get<Sale[]>("local_sales", []);
      const next = curr.map(s => s.id === id ? { ...s, ...updates } : s);
      lS.set("local_sales", next);
      return next.find(s => s.id === id)!;
    },
    delete: async (id: string) => {
       const curr = lS.get<Sale[]>("local_sales", []);
       lS.set("local_sales", curr.filter(s => s.id !== id));
       return true;
    }
  },
  expenses: {
    list: async (): Promise<Expense[]> => {
      return lS.get("local_expenses", []);
    },
    create: async (expense: Partial<Expense>) => {
      const curr = lS.get<Expense[]>("local_expenses", []);
      const next = { ...expense, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Expense;
      lS.set("local_expenses", [next, ...curr]);
      return next;
    },
    delete: async (id: string) => {
      const curr = lS.get<Expense[]>("local_expenses", []);
      lS.set("local_expenses", curr.filter(s => s.id !== id));
      return true;
    }
  },
  exchangeRate: {
    getBrlRate: async (): Promise<number> => {
      // First try to fetch from public API directly
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/PEN");
        if (res.ok) {
          const data = await res.json();
          // Save valid automatic rate to local config as fallback
          if (data && data.rates && data.rates.BRL) {
             const rate = data.rates.BRL;
             const settings = lS.get("local_settings", { manualRate: 1.45, useManual: false });
             lS.set("local_settings", { ...settings, lastAutoRate: rate });
             if (!settings.useManual) return rate;
          }
        }
      } catch (e) {
        console.error("Exchange rate fetch error, falling back locally:", e);
      }
      
      // Fallback
      const settings = lS.get("local_settings", { manualRate: 1.45, useManual: false, lastAutoRate: 1.45 });
      return settings.useManual ? settings.manualRate : (settings.lastAutoRate || 1.45);
    },
    getSettings: async () => {
       return lS.get("local_settings", { manualRate: 1.45, useManual: false, lastAutoRate: null });
    },
    saveSettings: async (settings: any) => {
       const curr = lS.get("local_settings", {});
       lS.set("local_settings", { ...curr, ...settings });
    }
  },
  quickButtons: {
    get: async (): Promise<QuickButton[]> => {
      return lS.get("local_quick_buttons", [
        { id: "1", isActive: false, name: "Botão 1", productId: "" },
        { id: "2", isActive: false, name: "Botão 2", productId: "" }
      ]);
    },
    save: async (buttons: QuickButton[]) => {
      lS.set("local_quick_buttons", buttons);
    }
  },
  webhooks: {
    trigger: async (url: string, payload: any) => {
      // Log webhook locally
      const logWebhook = (status: "sent" | "error", code?: number, errorBody?: string) => {
          const logs = lS.get<WebhookLog[]>("local_webhook_logs", []);
          lS.set("local_webhook_logs", [{
             id: crypto.randomUUID(), user_id: 'local', target_url: url, payload,
             status, response_code: code, response_body: errorBody, created_at: new Date().toISOString()
          }, ...logs]);
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          mode: "no-cors" // Allow non-CORS webhooks to be sent (response will be opaque)
        });
        
        // Since we use no-cors, we won't get a true ok/status. But we log it as sent.
        logWebhook("sent", res.status || 200, "Opaque response (no-cors)");
        return { success: true };
      } catch (e: any) {
        logWebhook("error", 500, e.message);
        return { success: false };
      }
    },
    listLogs: async (): Promise<WebhookLog[]> => {
      return lS.get("local_webhook_logs", []);
    }
  }
};
