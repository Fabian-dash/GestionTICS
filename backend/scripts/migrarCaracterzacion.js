import mongoose from "mongoose";
import Caracterizacion from "../models/Caracterizacion.js"; // Asegúrate de que el modelo exista

const migrar = async () => {
  try {
    // Conectamos a la base de datos correcta: gestionytics
    await mongoose.connect("mongodb://127.0.0.1:27017/gestionytics");

    await Caracterizacion.insertMany([
      { tipo_caracterizacion: "DESPLAZADOS POR LA VIOLENCIA" },
      { tipo_caracterizacion: "INDIGENAS" },
      { tipo_caracterizacion: "ADOLESCENTES EN CONFLICTO CON LA LEY PENAL" },
      { tipo_caracterizacion: "TERCERA EDAD" },
      { tipo_caracterizacion: "JOVENES VULNERABLES" },
      { tipo_caracterizacion: "MUJER CABEZA DE FAMILIA" },
      { tipo_caracterizacion: "ADOLESCENTE TRABAJADOR" },
      { tipo_caracterizacion: "EMPRENDEDORES" }
    ]);

    console.log("✅ Datos migrados correctamente a gestionytics");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();
