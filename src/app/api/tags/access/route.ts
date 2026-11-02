import { NextResponse } from "next/server";
import { db } from "@/db"
import { doorAccess } from "@/db/schema"
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const { uid, doorIds } = await request.json()
        // Validamos que exista el uid que doorIds sea expicitamente un arreglo
        if (!uid || !Array.isArray(doorIds)) {
            return NextResponse.json({ error: "Falta uid o doorId" }, { status: 400 })
        }
        // Limpieza total: borramos permisos antiguos
        await db.delete(doorAccess)
            .where(eq(doorAccess.uidTarget, uid))

        //Mapeo e insercion masiva
        if (doorIds.length > 0) {
            //convertimos cada texto en un objeto con la estructura de la tabla
            const newPermissions = doorIds.map((idPuerta: string) => ({
                uidTarget: uid,
                doorId: idPuerta
            }))

            //Insertamos todos los objetos en una sola operacion a la db
            await db.insert(doorAccess).values(newPermissions)
        }
        return NextResponse.json({ message: "Permisos actualizados!" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}