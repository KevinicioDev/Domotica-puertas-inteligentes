"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Door {
  id: string;
  name: string;
}

export default function PanelPrincipal() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  // Estados de vinculación
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  // Nuevos estados para las puertas
  const [doors, setDoors] = useState<Door[]>([]);
  const [selectedDoorId, setSelectedDoorId] = useState<string>("");

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [isPending, session, router]);

  // Cargar las puertas disponibles al iniciar
  useEffect(() => {
    const fetchDoors = async () => {
      try {
        const res = await fetch("/api/doors", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setDoors(data);
          if (data.length > 0) setSelectedDoorId(data[0].id); // Seleccionar la primera por defecto
        }
      } catch (error) {
        console.error("Error al cargar puertas", error);
      }
    };
    if (session) fetchDoors();
  }, [session]);

  // Polling para revisar si la tarjeta ya se leyó
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEnrolling && enrollmentId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/door/enroll/status?requestId=${enrollmentId}`);
          const data = await res.json();

          if (data.status === "success") {
            setEnrollStatus(`¡Guardada con éxito! UID: ${data.uid}`);
            setIsEnrolling(false);
            setIsSuccess(true);
            clearInterval(interval);

            setTimeout(() => {
              router.push("/tarjetas");
              setTimeout(() => {
                setIsSuccess(false);
                setEnrollStatus(null);
                setEnrollmentId(null);
              }, 500);
            }, 2000);

          } else if (data.status === "expired" || data.status === "error") {
            setEnrollStatus("Tiempo agotado o error de lectura.");
            setIsEnrolling(false);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error consultando estado");
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isEnrolling, enrollmentId, router]);

  const iniciarVinculacion = async () => {
    if (!selectedDoorId) {
      setEnrollStatus("Por favor selecciona una puerta primero.");
      return;
    }

    setIsEnrolling(true);
    setIsSuccess(false);
    setEnrollStatus(`Acerca la tarjeta al lector de: ${selectedDoorId.replace("-", " ")}...`);

    try {
      const res = await fetch("/api/door/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          // Ahora usamos la puerta seleccionada dinámicamente
          doorId: selectedDoorId
        })
      });
      const data = await res.json();
      if (data.id) setEnrollmentId(data.id);
    } catch (error) {
      setEnrollStatus("Error al iniciar vinculación");
      setIsEnrolling(false);
    }
  };

  if (isPending || !session) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-white">Verificando...</div>;

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-neutral-200 font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]">
        <h1 className="text-sm font-mono text-cyan-500 mb-8 tracking-widest uppercase">
          Bienvenido, {session.user.name}
        </h1>

        <div className="flex justify-center mb-8 h-24 items-center">
          {isSuccess ? (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.6)]">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : isEnrolling ? (
            <div className="relative flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-cyan-500/20 rounded-full animate-ping"></div>
              <div className="absolute w-16 h-16 bg-cyan-500/40 rounded-full animate-pulse"></div>
              <div className="w-8 h-8 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]"></div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center border border-white/10">
              <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
        </div>

        <p className={`text-xs font-mono uppercase tracking-[0.1em] mb-6 h-4 ${isSuccess ? "text-green-400" : "text-neutral-400"}`}>
          {enrollStatus || "Sistema en espera"}
        </p>

        <div className="space-y-4">
          {/* Nuevo menú desplegable para elegir la puerta */}
          {doors.length > 0 ? (
            <div className="text-left mb-4">
              <select
                value={selectedDoorId}
                onChange={(e) => setSelectedDoorId(e.target.value)}
                disabled={isEnrolling}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-400 font-mono text-sm appearance-none cursor-pointer disabled:opacity-50"
              >
                {doors.map((door) => (
                  <option key={door.id} value={door.id} className="bg-neutral-900">
                    {door.name || door.id.replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-red-400 font-mono mb-4">No hay puertas registradas.</p>
          )}

          <button
            onClick={iniciarVinculacion}
            disabled={isEnrolling || isSuccess || doors.length === 0}
            className="w-full bg-white text-black font-bold rounded-lg px-4 py-3 uppercase text-sm tracking-widest transition-all duration-300 disabled:opacity-50 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
          >
            {isEnrolling ? "Escuchando..." : isSuccess ? "Redirigiendo..." : "Vincular Tarjeta"}
          </button>

          <Link href="/puerta" className="w-full flex items-center justify-center bg-transparent border border-white/20 text-white font-bold rounded-lg px-4 py-3 uppercase text-sm tracking-widest transition-all hover:bg-white/10">
            Panel de Puerta
          </Link>

          <Link href="/tarjetas" className="w-full flex items-center justify-center bg-transparent border border-white/20 text-white font-bold rounded-lg px-4 py-3 uppercase text-sm tracking-widest transition-all hover:bg-white/10">
            Gestionar Accesos
          </Link>
          <Link href="/puertas" className="w-full flex items-center justify-center bg-transparent border border-white/20 text-white font-bold rounded-lg px-4 py-3 uppercase text-sm tracking-widest transition-all hover:bg-white/10">
            Agregar puertas
          </Link>
        </div>
      </div>
    </main>
  );
}