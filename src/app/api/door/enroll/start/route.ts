import { NextResponse } from "next/server";
import { db } from "@/db";
import { enrollmentRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

const startSchema = z.object({
    userId: z.string(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = startSchema.parse(body);

        // Tiempo de expiracion 60 segundos a partir de ahora
        const expiresAt = new Date(Date.now() + 60 * 1000);

        // Cancelar solicitudes pendientes previas de este usuario
        await db
            .update(enrollmentRequests)
            .set({ status: "expired" })
            .where(
                and(
                    eq(enrollmentRequests.userId, userId),
                    eq(enrollmentRequests.status, "pending")
                )
            );

        // Crear la nueva sesion de enrolamiento
        const requestId = crypto.randomUUID();
        await db.insert(enrollmentRequests).values({
            id: requestId,
            userId,
            status: "pending",
            expiresAt,
        });

        return NextResponse.json({
            message: "Modo registro activado. Pasa la tarjeta por el lector.",
            requestId,
            expiresAt,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.flatten() }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Error al iniciar el registro" },
            { status: 500 }
        );
    }
}