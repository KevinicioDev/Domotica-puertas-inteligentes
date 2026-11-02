import { NextResponse } from "next/server"
import { db } from "@/db"
import { authorizedTags, doorAccess } from "@/db/schema"
import { unstable_noStore as noStore } from "next/cache"
import { eq } from "drizzle-orm"

export async function GET() {
    noStore()
    try {
        //Ejecutamos un left join
        const rows = await db
            .select({
                uid: authorizedTags.uid,
                label: authorizedTags.label,
                createdAt: authorizedTags.createdAt,
                doorId: doorAccess.doorId,// Traemos el id de la puerta desde la tabla puente
            })
            .from(authorizedTags)
            .leftJoin(doorAccess, eq(authorizedTags.uid, doorAccess.uidTarget))

        //Agrupamos las filas planas en un arreglo limpio de objetos
        const tagsMap = new Map()

        rows.forEach((row) => {
            // Si la tarjeta no está en el mapa, la creamos con su arreglo vacío
            if (!tagsMap.has(row.uid)) {
                tagsMap.set(row.uid, {
                    uid: row.uid,
                    label: row.label,
                    createdAt: row.createdAt,
                    assignedDoors: []
                });
            }

            // Si esta fila trajo una puerta vinculada, la agregamos al arreglo
            if (row.doorId) {
                tagsMap.get(row.uid).assignedDoors.push(row.doorId);
            }
        });

        // Convertimos el mapa de vuelta a un arreglo clásico
        const formattedTags = Array.from(tagsMap.values());

        return NextResponse.json(formattedTags);
    } catch (error) {
        return NextResponse.json({ error: "Error interno del servidor al cargar tarjetas" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    //Leer el uid y el label desde el await request.json()
    try {
        const { uid, label } = await request.json()
        if (!uid || !label) {
            return NextResponse.json(
                { error: "Falta UID o Label" },
                { status: 400 }
            )
        }

        await db.update(authorizedTags)
            .set({ label })
            .where(eq(authorizedTags.uid, uid))

        return NextResponse.json({ message: "Etiqueta actualizada exitosamente" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { uid } = await request.json()
        await db.delete(authorizedTags).where(eq(authorizedTags.uid, uid))
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: " Error al eliminar" }, { status: 500 })
    }
}