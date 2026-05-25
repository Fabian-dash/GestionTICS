import mongoose from "mongoose";
import TipoOferta from "../models/TipoOferta.js";

const migrar = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/gestionytics");


    await TipoOferta.insertMany([
      { nombre: "Abierta" },
      { nombre: "Cerrada" }
    ]);

    console.log("✅ Datos migrados correctamente");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();
