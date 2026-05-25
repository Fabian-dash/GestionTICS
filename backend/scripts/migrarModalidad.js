import mysql from "mysql2/promise";
import mongoose from "mongoose";
import Modalidad from "../models/Modalidad.js";

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
      "SELECT * FROM modalidad"
    );

    await Modalidad.deleteMany();

    const datos = rows.map(row => ({
      nombre: row.Modalidad
    }));

    await Modalidad.insertMany(datos);

    console.log("✅ Modalidades migradas correctamente");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();
