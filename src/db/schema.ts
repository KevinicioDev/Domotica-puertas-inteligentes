import { timeStamp } from "console";
import { integer } from "drizzle-orm/gel-core";
import { pgTable, text, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { any } from "zod";
import { id } from "zod/locales";

// Tabla base de usuarios para Better Auth
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull()
})

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => user.id)
})

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => user.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull()
})

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt")
})
// Tabla de tarjetas vinculada al usuario
export const authorizedTags = pgTable("authorized_tags", {
    uid: text("uid").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    label: text("label"),
    stateTag: boolean("state_tag").notNull().default(true), // lo agregue para corregir un error en mi ruta de api
    createdAt: timestamp("created_at").defaultNow(),
});

// Tabla para guardar el estado del usuario

export const enrollmentRequests = pgTable("enrollment_requests", {
    id: text("id").primaryKey(), // Podemos usar un uuid o nanoid
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "success", "expired"] })
        .notNull()
        .default("pending"),
    scannedUid: text("scanned_uid"),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
});

//Tabla para guardar la informacion de cada cerradura fisica
export const door = pgTable("door", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    macAddress: text("mac_address").unique(),
    isLocked: boolean("is_locked").notNull().default(true),
    updatedAt: timestamp("updated_at").defaultNow(),
})

//Tabla puente de muchos a muchos para almacenar el door_id
export const doorAccess = pgTable("door_access", {
    doorId: text("door_id").notNull().references(() => door.id, { onDelete: 'cascade' }),
    uidTarget: text("uid_target").notNull().references(() => authorizedTags.uid, { onDelete: 'cascade' })
}, (t) => [
    primaryKey({ columns: [t.doorId, t.uidTarget] })
])
