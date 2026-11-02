import { NextResponse } from "next/server";
import { enrollmentRequests } from "@/db/schema";
import { db } from "@/db";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        // Generamos el ID unico
        const uniqueId = crypto.randomUUID();

        // Calculamos la expiracion (2 minutos a partir de ahora)
        const fechaExpiracion = new Date();
        fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 2);

        // Insertamos incluyendo todos los campos obligatorios
        const resultado = await db
            .insert(enrollmentRequests)
            .values({
                id: uniqueId,
                userId,
                status: "pending",
                expiresAt: fechaExpiracion // Este era el campo faltante
            })
            .returning();

        return NextResponse.json({
            id: resultado[0].id,
            status: resultado[0].status
        });
    } catch (error) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}