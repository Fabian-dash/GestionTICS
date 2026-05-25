import mongoose from "mongoose";
import mysql from "mysql2/promise";
import ProgramaEspecial from "../models/ProgramaEspecial.js";

const migrar = async () => {
  try {
    // Conectar a Mongo
    await mongoose.connect("mongodb://127.0.0.1:27017/gestionytics");
    console.log("✅ Conectado a MongoDB");

    // Conectar a MySQL
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "complementario2",
    });

    const [rows] = await connection.execute(
      "SELECT * FROM programa_especial"
    );

    for (const row of rows) {
      await ProgramaEspecial.create({
        nombre: row.Nombre.trim(),
      });
    }

    console.log("🚀 ProgramaEspecial migrado correctamente");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();
