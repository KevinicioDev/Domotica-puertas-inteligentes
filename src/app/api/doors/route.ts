import { NextResponse } from "next/server";
import { db } from "@/db";
import { door, doorAccess } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

export async function GET() {
    noStore();
    try {
        const doors = await db.select().from(door);
        return NextResponse.json(doors);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener puertas" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { id, macAddress } = await request.json();
        if (!id) return NextResponse.json({ error: "Falta el identificador" }, { status: 400 });

        const formattedId = id.toLowerCase().trim().replace(/\s+/g, '-');
        await db.insert(door).values({
            id: formattedId,
            name: id,
            macAddress: macAddress ? macAddress.trim().toUpperCase() : null
        });

        return NextResponse.json({ message: "Puerta creada", id: formattedId }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error en el servidor al crear puerta" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, name, macAddress } = await request.json();
        if (!id || !name) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

        await db.update(door)
            .set({
                name,
                macAddress: macAddress ? macAddress.trim().toUpperCase() : null
            })
            .where(eq(door.id, id));

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar puerta" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

        await db.delete(doorAccess).where(eq(doorAccess.doorId, id));
        await db.delete(door).where(eq(door.id, id));

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar puerta" }, { status: 500 });
    }
}