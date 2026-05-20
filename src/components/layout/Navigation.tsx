import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Box, Target, Wallet, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

const items = [
  { path: "/app", icon: LayoutDashboard, label: "Home" },
  { path: "/app/sales", icon: ShoppingCart, label: "Vendas" },
  { path: "/app/products", icon: Box, label: "Produtos" },
  { path: "/app/expenses", icon: Wallet, label: "Gastos" },
  { path: "/app/settings", icon: Settings, label: "Ajustes" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="glass rounded-2xl flex items-center justify-around p-2">
          {items.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors",
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bubble"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                <span className="text-[10px] font-medium mt-1 relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-900 z-50 py-8 px-4">
        <div className="flex items-center gap-0 px-2 mb-10">
          <img src="https://i.imgur.com/sLdpnD6.png" alt="FELIFY" referrerPolicy="no-referrer" className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
        </div>
        <nav className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive ? "bg-white/10 text-white font-medium" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background text-foreground lg:pl-64 flex flex-col">
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
