"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Door {
    id: string;
}

interface Tag {
    uid: string;
    label: string | null;
    assignedDoors?: string[];
}

export default function AccessManagement() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    const [tags, setTags] = useState<Tag[]>([]);
    const [doors, setDoors] = useState<Door[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [editingUid, setEditingUid] = useState<string | null>(null);
    const [draftLabel, setDraftLabel] = useState("");
    const [draftDoorIds, setDraftDoorIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isPending && !session) router.push("/login");
    }, [isPending, session, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tagsRes, doorsRes] = await Promise.all([
                    fetch("/api/tags", { cache: "no-store" }),
                    fetch("/api/doors", { cache: "no-store" })
                ]);

                if (tagsRes.ok && doorsRes.ok) {
                    const tagsData = await tagsRes.json();
                    const doorsData = await doorsRes.json();

                    if (Array.isArray(tagsData)) setTags(tagsData);
                    if (Array.isArray(doorsData)) setDoors(doorsData);
                }
            } catch (error) {
                console.error("Connection error loading data");
            } finally {
                setIsLoading(false);
            }
        };

        if (session) fetchData();
    }, [session]);

    const handleEditStart = (tag: Tag) => {
        setEditingUid(tag.uid);
        setDraftLabel(tag.label || "");
        setDraftDoorIds(tag.assignedDoors || []);
    };

    const toggleDoorSelection = (doorId: string) => {
        setDraftDoorIds((prev) =>
            prev.includes(doorId)
                ? prev.filter((id) => id !== doorId)
                : [...prev, doorId]
        );
    };

    const handleSave = async (uid: string) => {
        setIsSaving(true);
        try {
            const [labelRes, accessRes] = await Promise.all([
                fetch("/api/tags", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid, label: draftLabel })
                }),
                fetch("/api/tags/access", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid, doorIds: draftDoorIds })
                })
            ]);

            if (labelRes.ok && accessRes.ok) {
                setTags((prev) =>
                    prev.map((t) => (t.uid === uid ? { ...t, label: draftLabel, assignedDoors: draftDoorIds } : t))
                );
                setEditingUid(null);
            } else {
                console.error("Failed to save changes");
            }
        } catch (error) {
            console.error("Network error saving data");
        } finally {
            setIsSaving(false);
        }
    };

    // Nueva función para eliminar la tarjeta aplicando Optimistic UI
    const handleDelete = async (uid: string) => {
        if (!window.confirm("¿Seguro que deseas revocar el acceso a esta tarjeta? Esta acción no se puede deshacer.")) return;

        try {
            const res = await fetch("/api/tags", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid })
            });

            if (res.ok) {
                setTags((prev) => prev.filter((tag) => tag.uid !== uid));
            } else {
                console.error("Failed to delete tag");
            }
        } catch (error) {
            console.error("Network error deleting tag");
        }
    };

    if (isPending || isLoading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">Cargando base de datos...</div>;
    }
    if (!session) return null;

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-start p-6 text-neutral-200 font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mt-12 shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-lg font-mono text-cyan-500 tracking-widest uppercase">
                        Gestión de Accesos
                    </h1>
                    <Link
                        href="/"
                        className="bg-transparent border border-white/20 text-white font-bold rounded-lg px-4 py-2 uppercase text-xs tracking-widest transition-all hover:bg-white/10"
                    >
                        Volver
                    </Link>
                </div>

                {tags.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/20 rounded-lg text-neutral-500 font-mono text-sm">
                        No hay tarjetas registradas en el sistema.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 font-mono text-xs text-neutral-400 uppercase tracking-wider">
                                    <th className="py-4 px-4 font-normal">Identificador</th>
                                    <th className="py-4 px-4 font-normal">Etiqueta</th>
                                    <th className="py-4 px-4 font-normal">Puertas Permitidas</th>
                                    <th className="py-4 px-4 font-normal text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono text-sm">
                                {tags.map((tag) => (
                                    <tr key={tag.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-4 text-cyan-400">{tag.uid}</td>

                                        <td className="py-4 px-4 text-neutral-300">
                                            {editingUid === tag.uid ? (
                                                <input
                                                    type="text"
                                                    value={draftLabel}
                                                    onChange={(e) => setDraftLabel(e.target.value)}
                                                    className="bg-black/50 border border-cyan-500/50 rounded px-2 py-1 text-white outline-none focus:border-cyan-400 w-full"
                                                />
                                            ) : (
                                                tag.label || "Sin etiqueta"
                                            )}
                                        </td>

                                        <td className="py-4 px-4 text-neutral-300">
                                            {editingUid === tag.uid ? (
                                                <div className="flex flex-col gap-2">
                                                    {doors.map((door) => (
                                                        <label key={door.id} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={draftDoorIds.includes(door.id)}
                                                                onChange={() => toggleDoorSelection(door.id)}
                                                                className="accent-cyan-500"
                                                            />
                                                            <span className="text-xs uppercase">{door.id.replace("-", " ")}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-500 italic">
                                                    {tag.assignedDoors?.length
                                                        ? `${tag.assignedDoors.length} puerta(s) asignada(s)`
                                                        : "Ninguna"}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-4 text-right space-x-2 flex justify-end">
                                            {editingUid === tag.uid ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSave(tag.uid)}
                                                        disabled={isSaving}
                                                        className="text-xs border border-green-500/50 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors uppercase tracking-widest disabled:opacity-50"
                                                    >
                                                        {isSaving ? "..." : "Guardar"}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUid(null)}
                                                        disabled={isSaving}
                                                        className="text-xs border border-white/20 text-neutral-300 px-3 py-1 rounded hover:bg-white/10 transition-colors uppercase tracking-widest disabled:opacity-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEditStart(tag)}
                                                        className="text-xs border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-colors uppercase tracking-widest"
                                                    >
                                                        Editar
                                                    </button>
                                                    {/* Nuevo botón Eliminar */}
                                                    <button
                                                        onClick={() => handleDelete(tag.uid)}
                                                        className="text-xs border border-red-500/30 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 hover:border-red-500/50 transition-colors uppercase tracking-widest ml-2"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}