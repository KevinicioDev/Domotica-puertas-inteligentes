"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await authClient.signIn.email({
            email,
            password,
        });

        if (data) {
            router.push("/"); // Redirige al dashboard si el login es exitoso
        } else {
            alert("Error: " + error?.message);
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-neutral-200 font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

            <form onSubmit={handleLogin} className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]">
                <h1 className="text-xl font-semibold tracking-widest text-white uppercase text-center mb-8">
                    Acceso Restringido
                </h1>

                <div className="space-y-4 mb-8">
                    <input
                        type="email"
                        placeholder="CORREO ELECTRÓNICO"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                        required
                    />
                    <input
                        type="password"
                        placeholder="CONTRASEÑA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] disabled:opacity-50 transition-all duration-300 uppercase text-sm tracking-wider"
                >
                    {loading ? "Verificando..." : "Iniciar Sesión"}
                </button>
            </form>
        </main>
    );
}