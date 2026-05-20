import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Forms";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/layout/PageTransition";
import { Card } from "../components/ui/Card";

export default function Login() {
  const { isMock } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Offline / Local only version
    setTimeout(() => {
      navigate("/app");
    }, 800);
  };

  return (
    <PageTransition className="flex items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src="https://i.imgur.com/sLdpnD6.png" alt="FELIFY" referrerPolicy="no-referrer" className="h-52 w-auto mx-auto mb-6 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Bem-vindo(a)</h1>
          <p className="text-zinc-400 text-sm">Insira suas credenciais para acessar a plataforma</p>
        </div>

        <Card className="glass-card">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}
            
            <Input 
              label="Email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            
            <Input 
              label="Senha" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs">
              Modo local. Qualquer credencial funcionará.
            </div>

            <Button type="submit" isLoading={loading} className="w-full mt-2" size="lg">
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
