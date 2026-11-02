//Este archivo abre la conexión con PostgreSQL usando las credenciales de .env para que el resto de la aplicación pueda hacer consultas
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client, { schema })