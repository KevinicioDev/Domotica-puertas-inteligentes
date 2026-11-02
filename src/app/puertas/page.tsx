"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Door {
    id: string;
    name: string;
    macAddress: string | null;
}

export default function DoorManagement() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    const [doors, setDoors] = useState<Door[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newDoorName, setNewDoorName] = useState("");
    const [newDoorMac, setNewDoorMac] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [editingDoorId, setEditingDoorId] = useState<string | null>(null);
    const [draftDoorName, setDraftDoorName] = useState("");
    const [draftDoorMac, setDraftDoorMac] = useState("");

    useEffect(() => {
        if (!isPending && !session) router.push("/login");
    }, [isPending, session, router]);

    useEffect(() => {
        const fetchDoors = async () => {
            try {
                const res = await fetch("/api/doors", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setDoors(data);
                }
            } catch (error) {
                console.error("Connection error loading doors");
            } finally {
                setIsLoading(false);
            }
        };

        if (session) fetchDoors();
    }, [session]);

    const handleCreateDoor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoorName.trim()) return;
        setIsSaving(true);

        try {
            const res = await fetch("/api/doors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newDoorName,
                    macAddress: newDoorMac || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                setDoors((prev) => [...prev, { id: data.id, name: newDoorName, macAddress: newDoorMac.toUpperCase() || null }]);
                setNewDoorName("");
                setNewDoorMac("");
            }
        } catch (error) {
            console.error("Network error creating door");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditStart = (door: Door) => {
        setEditingDoorId(door.id);
        setDraftDoorName(door.name || "");
        setDraftDoorMac(door.macAddress || "");
    };

    const handleSaveEdit = async (id: string) => {
        if (!draftDoorName.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/doors", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    name: draftDoorName,
                    macAddress: draftDoorMac || null
                })
            });

            if (res.ok) {
                setDoors((prev) => prev.map((d) => (d.id === id ? { ...d, name: draftDoorName, macAddress: draftDoorMac.toUpperCase() || null } : d)));
                setEditingDoorId(null);
            }
        } catch (error) {
            console.error("Network error updating door");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta puerta? Esto revocará el acceso de todas las tarjetas asignadas a ella.")) return;
        try {
            const res = await fetch("/api/doors", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setDoors((prev) => prev.filter((d) => d.id !== id));
            }
        } catch (error) {
            console.error("Network error deleting door");
        }
    };

    if (isPending || isLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">Cargando base de datos...</div>;
    if (!session) return null;

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-start p-6 text-neutral-200 font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mt-12 shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-lg font-mono text-cyan-500 tracking-widest uppercase">Gestión de Puertas</h1>

                    <div className="flex gap-3">
                        <Link href="/tarjetas" className="bg-transparent border border-cyan-500/50 text-cyan-400 font-bold rounded-lg px-4 py-2 uppercase text-xs tracking-widest transition-all hover:bg-cyan-500/10">
                            Tarjetas
                        </Link>
                        <Link href="/" className="bg-transparent border border-white/20 text-white font-bold rounded-lg px-4 py-2 uppercase text-xs tracking-widest transition-all hover:bg-white/10">
                            Panel Principal
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleCreateDoor} className="flex gap-4 mb-8">
                    <input
                        type="text"
                        placeholder="Nombre de puerta"
                        value={newDoorName}
                        onChange={(e) => setNewDoorName(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-400 font-mono text-sm"
                    />
                    <input
                        type="text"
                        placeholder="MAC del ESP32 (ej: A1:B2:C3...)"
                        value={newDoorMac}
                        onChange={(e) => setNewDoorMac(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-400 font-mono text-sm uppercase"
                    />
                    <button type="submit" disabled={isSaving || !newDoorName.trim()} className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-bold rounded-lg px-6 py-2 uppercase text-xs tracking-widest transition-all hover:bg-cyan-500/40 disabled:opacity-50">
                        {isSaving ? "Guardando..." : "Agregar"}
                    </button>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 font-mono text-xs text-neutral-400 uppercase tracking-wider">
                                <th className="py-4 px-4 font-normal">Identificador</th>
                                <th className="py-4 px-4 font-normal">Nombre Visible</th>
                                <th className="py-4 px-4 font-normal">MAC Hardware</th>
                                <th className="py-4 px-4 font-normal text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-sm">
                            {doors.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-neutral-500 text-xs">No hay puertas registradas.</td></tr>
                            ) : (
                                doors.map((door) => (
                                    <tr key={door.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-4 text-neutral-500 font-mono text-xs">{door.id}</td>

                                        <td className="py-4 px-4 text-cyan-400 font-bold">
                                            {editingDoorId === door.id ? (
                                                <input
                                                    type="text"
                                                    value={draftDoorName}
                                                    onChange={(e) => setDraftDoorName(e.target.value)}
                                                    className="bg-black/50 border border-cyan-500/50 rounded px-2 py-1 text-white outline-none focus:border-cyan-400 w-full"
                                                />
                                            ) : (
                                                door.name || door.id.replace("-", " ")
                                            )}
                                        </td>

                                        <td className="py-4 px-4 text-neutral-300 font-mono text-xs">
                                            {editingDoorId === door.id ? (
                                                <input
                                                    type="text"
                                                    value={draftDoorMac}
                                                    onChange={(e) => setDraftDoorMac(e.target.value)}
                                                    placeholder="A1:B2:C3:D4:E5:F6"
                                                    className="bg-black/50 border border-cyan-500/50 rounded px-2 py-1 text-white outline-none focus:border-cyan-400 w-full uppercase"
                                                />
                                            ) : (
                                                door.macAddress || <span className="text-neutral-600 italic">Sin asignar</span>
                                            )}
                                        </td>

                                        <td className="py-4 px-4 text-right space-x-2 flex justify-end">
                                            {editingDoorId === door.id ? (
                                                <>
                                                    <button onClick={() => handleSaveEdit(door.id)} disabled={isSaving} className="text-xs border border-green-500/50 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 uppercase tracking-widest disabled:opacity-50">Guardar</button>
                                                    <button onClick={() => setEditingDoorId(null)} disabled={isSaving} className="text-xs border border-white/20 text-neutral-300 px-3 py-1 rounded hover:bg-white/10 uppercase tracking-widest disabled:opacity-50">Cancelar</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEditStart(door)} className="text-xs border border-white/20 px-3 py-1 rounded hover:bg-white/10 uppercase tracking-widest">Editar</button>
                                                    <button onClick={() => handleDelete(door.id)} className="text-xs border border-red-500/30 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 hover:border-red-500/50 uppercase tracking-widest ml-2">Eliminar</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}