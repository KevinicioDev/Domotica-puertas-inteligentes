import { NextResponse } from "next/server";
import { db } from "@/db";
import { authorizedTags, enrollmentRequests, doorAccess, door } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const { uid, doorId } = await request.json()

        //INTERCEPTOR: Buscar si hay un enrolamiento pendiente y vigente
        const pendingEnrollment = await db
            .select()
            .from(enrollmentRequests)
            .where(
                and(
                    eq(enrollmentRequests.status, "pending"),
                    gt(enrollmentRequests.expiresAt, new Date()) // Que no haya expirado
                )
            )
            .limit(1)

        if (pendingEnrollment.length > 0) {
            const enrollment = pendingEnrollment[0]

            // Guardamos la tarjeta asociada al usuario
            await db.insert(authorizedTags).values({
                uid: uid,
                userId: enrollment.userId,
                label: "Nueva Tarjeta"
            })

            //Le otorgamos acceso a la puerta desde donde se vinculo
            await db.insert(doorAccess).values({
                doorId: doorId,
                uidTarget: uid
            })

            // Marcamos la solicitud como exitosa
            await db.update(enrollmentRequests)
                .set({ status: "success", scannedUid: uid })
                .where(eq(enrollmentRequests.id, enrollment.id))

            return NextResponse.json({ message: "Tarjeta vinculada exitosamente" }, { status: 200 })
        }

        // Modo normal control de acceso
        const door_access = await db
            .select()
            .from(doorAccess)
            .where(
                and(
                    eq(doorAccess.doorId, doorId),
                    eq(doorAccess.uidTarget, uid)
                )
            )
            .limit(1);

        if (door_access.length > 0) {
            const actualState = await db.select().from(door).where(eq(door.id, doorId));
            const newState = actualState.length > 0 ? !actualState[0].isLocked : false;

            await db.update(door).set({
                isLocked: newState,
                updatedAt: new Date()
            }).where(eq(door.id, doorId));

            return NextResponse.json({ message: newState ? "Puerta cerrada" : "Puerta abierta" }, { status: 200 });
        } else {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}