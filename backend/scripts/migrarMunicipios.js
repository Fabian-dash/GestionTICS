import mysql from "mysql2/promise";
import mongoose from "mongoose";
import Municipio from "../models/Municipio.js";

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
      "SELECT * FROM municipios_cauca"
    );

    await Municipio.deleteMany();

    const datos = rows.map(row => ({
      nombre: row.nombre,
      cod_dane: row.cod_dane,
      estado: row.estado === 1
    }));

    await Municipio.insertMany(datos);

    console.log("🚀 Municipios migrados correctamente");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();
