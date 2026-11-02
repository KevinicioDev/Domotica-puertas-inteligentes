//Para que Drizzle sepa dónde están los esquemas y a qué base de datos empujarlos
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    }
})