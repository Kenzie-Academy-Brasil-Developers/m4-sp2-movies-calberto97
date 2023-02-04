import { Client } from "pg";

export const client = new Client({
  user: "Caio",
  password: "1997",
  host: "localhost",
  database: "m4_sp2_movies",
  port: 5432,
});

export const startDatabase = async (): Promise<void> => {
    await client.connect()
    console.log("Database connected")
}