import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // Especificamos que usamos PostgreSQL (Neon)
    }),
    emailAndPassword: {
        enabled: true // Habilitamos login con correo y contraseña para probar 
    }
});