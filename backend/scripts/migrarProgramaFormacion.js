import mysql from "mysql2/promise";
import mongoose from "mongoose";
import ProgramaFormacion from "../models/ProgramaFormacion.js";
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
      "SELECT * FROM programa_formacion"
    );

    await ProgramaFormacion.deleteMany();

    const modalidadesMongo = await Modalidad.find();

    const datos = [];

    for (let row of rows) {
      const modalidadRelacionada = modalidadesMongo[row.id_modalidad - 1];

      datos.push({
        codigo: row.codigo,
        version: row.version,
        nombre_programa: row.nombre_programa,
        tipo_programa: row.tipo_programa,
        nivel_formacion: row.nivel_formacion,
        duracion_maxima: Number(row.duracion_maxima),
        duracion_etapa_lectiva: Number(row.duracion_etapa_lectiva),
        duracion_etapa_productiva: Number(row.duracion_etapa_productiva),
        edad_minima_requerida: row.edad_minima_requerida,
        grado_maximo: row.grado_maximo,
        red_conocimientos: row.red_conocimientos,
        modalidad: modalidadRelacionada._id
      });
    }

    await ProgramaFormacion.insertMany(datos);

    console.log("🚀 ProgramaFormacion migrado con relación correcta");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();
