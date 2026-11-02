"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Door {
    id: string;
    name: string;
}

export default function PanelPuerta() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    const [isLocked, setIsLocked] = useState(true);
    const [loading, setLoading] = useState(true);

    // Nuevos estados dinámicos
    const [doors, setDoors] = useState<Door[]>([]);
    const [selectedDoorId, setSelectedDoorId] = useState<string>("");

    useEffect(() => {
        if (!isPending && !session) router.push("/login");
    }, [isPending, session, router]);

    // 1. Cargar el catálogo de puertas al entrar
    useEffect(() => {
        const fetchDoors = async () => {
            try {
                const res = await fetch("/api/doors", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setDoors(data);
                    if (data.length > 0) setSelectedDoorId(data[0].id);
                }
            } catch (error) {
                console.error("Error cargando catálogo de puertas");
            }
        };
        if (session) fetchDoors();
    }, [session]);

    // 2. Consultar el estado en tiempo real de la puerta SELECCIONADA
    useEffect(() => {
        if (!selectedDoorId) return; // Pausar si aún no hay puerta seleccionada

        setLoading(true); // Mostrar carga al cambiar de puerta

        const fetchState = async () => {
            try {
                const res = await fetch(`/api/door/state?doorId=${selectedDoorId}`, { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setIsLocked((prev) => (data.isLocked !== undefined ? data.isLocked : prev));
                }
            } catch (error) {
                console.error("Error conectando con el servidor");
            } finally {
                setLoading(false);
            }
        };

        fetchState();
        const interval = setInterval(fetchState, 3000);

        return () => clearInterval(interval); // Limpiar el intervalo anterior si el usuario cambia de puerta
    }, [selectedDoorId]);

    // 3. Enviar el comando a la puerta correcta
    const toggleDoor = async () => {
        if (!selectedDoorId) return;

        const newState = !isLocked;
        setIsLocked(newState); // Optimistic update

        await fetch("/api/door/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ doorId: selectedDoorId, isLocked: newState })
        });
    };

    if (isPending || (loading && doors.length === 0)) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">Cargando interfaz...</div>;
    if (!session) return null;

    const currentDoor = doors.find(d => d.id === selectedDoorId);

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-neutral-200 font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]">

                {/* Menú Desplegable */}
                {doors.length > 0 ? (
                    <div className="mb-8">
                        <select
                            value={selectedDoorId}
                            onChange={(e) => setSelectedDoorId(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-cyan-400 outline-none focus:border-cyan-400 font-mono text-sm appearance-none cursor-pointer text-center uppercase tracking-widest"
                        >
                            {doors.map((door) => (
                                <option key={door.id} value={door.id} className="bg-neutral-900 text-white">
                                    {door.name || door.id.replace("-", " ")}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <p className="text-xs font-mono text-red-400 mb-8">No hay puertas configuradas</p>
                )}

                <div className="flex justify-center mb-8 relative min-h-[8rem] items-center">
                    {loading ? (
                        <div className="w-12 h-12 border-2 border-cyan-500/50 border-t-cyan-500 rounded-full animate-spin"></div>
                    ) : (
                        <button
                            onClick={toggleDoor}
                            disabled={!selectedDoorId}
                            className={`w-32 h-32 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] disabled:opacity-50 ${isLocked
                                ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500"
                                : "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500"
                                }`}
                        >
                            {isLocked ? (
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            ) : (
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                <p className="text-xs font-mono uppercase tracking-[0.1em] mb-8 text-neutral-400">
                    Estado: <span className={isLocked ? "text-red-500" : "text-cyan-500"}>{isLocked ? "CERRADO" : "ABIERTO"}</span>
                </p>

                <div className="space-y-4">
                    <Link href="/" className="w-full flex items-center justify-center bg-transparent border border-white/20 text-white font-bold rounded-lg px-4 py-3 uppercase text-sm tracking-widest transition-all hover:bg-white/10">
                        Volver al Inicio
                    </Link>
                    <Link href="/tarjetas" className="w-full flex items-center justify-center bg-transparent border border-white/20 text-white font-bold rounded-lg px-4 py-3 uppercase text-sm tracking-widest transition-all hover:bg-white/10">
                        Gestionar Accesos
                    </Link>
                </div>
            </div>
        </main>
    );
}