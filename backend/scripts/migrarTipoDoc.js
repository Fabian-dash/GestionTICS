import mysql from "mysql2/promise";
import mongoose from "mongoose";
import TipoDoc from "../models/TipoDoc.js";

const migrar = async () => {
  try {
    const mysqlConnection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "complementario2"
    });

    await mongoose.connect("mongodb://127.0.0.1:27017/gestionytics");

    const [rows] = await mysqlConnection.execute(
      "SELECT * FROM tipodoc"
    );

    await TipoDoc.deleteMany();

    const datos = rows.map(row => ({
      nombre: row.tipodoc
    }));

    await TipoDoc.insertMany(datos);

    console.log("🚀 Tipos de documento migrados correctamente");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();
