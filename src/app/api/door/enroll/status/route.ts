import { NextResponse } from "next/server";
import { db } from "@/db";
import { enrollmentRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
    // Extraemos el id directamente de la URL de la peticion
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("requestId")

    if (!requestId) {
        return NextResponse.json({ error: "Falta el requestId" }, { status: 400 })
    }

    try {
        const resultado = await db
            .select()
            .from(enrollmentRequests)
            .where(eq(enrollmentRequests.id, requestId))
            .limit(1)

        if (resultado.length === 0) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
        }

        const enrollment = resultado[0]

        if (enrollment.status === "pending" && new Date() > enrollment.expiresAt) {
            return NextResponse.json({ status: "expired" })
        }

        return NextResponse.json({
            status: enrollment.status,
            uid: enrollment.scannedUid
        })
    } catch (error) {
        return NextResponse.json({ error: "Error al consultar el estado" }, { status: 500 })
    }
}