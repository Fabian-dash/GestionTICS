import mongoose from "mongoose";
import mysql from "mysql2/promise";
import TipoPrograma from "../models/TipoPrograma.js";

const migrar = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/gestionytics");
    console.log("🟢 Mongo conectado");

    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "complementario2"
    });

    const [rows] = await connection.execute(
      "SELECT id, nombre FROM tipo_de_oferta"
    );

    for (const row of rows) {
      await TipoPrograma.updateOne(
        { id: row.id },
        {
          id: row.id,
          nombre: row.nombre
        },
        { upsert: true }
      );
    }

    console.log("✅ TipoPrograma migrado correctamente");

    await mongoose.disconnect();
    await connection.end();
  } catch (error) {
    console.error(error);
  }
};

migrar();
