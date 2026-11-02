import { NextResponse } from "next/server";
import { db } from "@/db";
import { door } from "@/db/schema";
import { eq } from "drizzle-orm"; // <-- Importante para el "where"
import { unstable_noStore as noStore } from "next/cache";

export async function GET(request: Request) {
    noStore();
    try {
        // 1. Leer el Query Parameter de la URL (ej: ?doorId=puerta-principal)
        const { searchParams } = new URL(request.url);
        const doorId = searchParams.get("doorId");

        // Validamos que el cliente haya enviado el doorId
        if (!doorId) {
            return NextResponse.json({ error: "Falta el parámetro doorId" }, { status: 400 });
        }

        // 2. Buscamos el estado de esa puerta en específico
        const estado = await db.select().from(door).where(eq(door.id, doorId)).limit(1);

        // 3. Auto-reparación inteligente: Si es una puerta nueva, la registramos al vuelo
        if (estado.length === 0) {
            const doorName = doorId.replace("-", " "); // "puerta-principal" -> "puerta principal"
            await db.insert(door).values({ id: doorId, name: doorName, isLocked: true });
            return NextResponse.json({ id: doorId, isLocked: true });
        }

        return NextResponse.json({ id: estado[0].id, isLocked: estado[0].isLocked });
    } catch (error) {
        return NextResponse.json({ error: "Error al leer estado" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // 1. Extraemos el doorId y la acción del body (JSON)
        const { doorId, isLocked } = await request.json();

        if (!doorId) {
            return NextResponse.json({ error: "Falta el parámetro doorId" }, { status: 400 });
        }

        // 2. Actualizamos el estado solo de ESA puerta
        await db.update(door)
            .set({ isLocked, updatedAt: new Date() })
            .where(eq(door.id, doorId));

        return NextResponse.json({ success: true, isLocked });
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}