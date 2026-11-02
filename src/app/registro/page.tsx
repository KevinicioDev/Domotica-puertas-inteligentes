"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Registro() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await authClient.signUp.email({
            name,
            email,
            password,
        });

        if (data) {
            router.push("/login");
        } else {
            alert("Error: " + error?.message);
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-neutral-200 font-sans">
            <form onSubmit={handleRegister} className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]">
                <h1 className="text-xl font-semibold text-white uppercase text-center mb-8">
                    Crear Administrador
                </h1>
                <div className="space-y-4 mb-8">
                    <input
                        type="text"
                        placeholder="NOMBRE (Ej. Kevin)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none"
                        required
                    />
                    <input
                        type="email"
                        placeholder="CORREO"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none"
                        required
                    />
                    <input
                        type="password"
                        placeholder="CONTRASEÑA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-cyan-400 disabled:opacity-50 uppercase text-sm"
                >
                    {loading ? "Registrando..." : "Registrar"}
                </button>
            </form>
        </main>
    );
}