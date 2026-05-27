import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import SeleccionarTipoOferta from './seleccionar_tipo_oferta';
import FormularioCampesenaCompleto from './formulario_campesena_completo';
import Swal from 'sweetalert2';

// ===== COMPONENTE AUTOCOMPLETE REUTILIZABLE =====
const Autocomplete = ({ opciones, valorId, onChange, placeholder, displayFn, required }) => {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(-1);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!valorId) {
      setTexto('');
      return;
    }
    const opcion = opciones.find(o => o._id === valorId);
    if (opcion) setTexto(displayFn(opcion));
  }, [valorId, opciones, displayFn]);

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
        const opcion = opciones.find(o => o._id === valorId);
        if (opcion) setTexto(displayFn(opcion));
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [opciones, valorId, displayFn]);

  const filtradas = texto.length > 0
    ? opciones.filter(o => displayFn(o).toLowerCase().includes(texto.toLowerCase()))
    : opciones;

  const handleInput = (e) => {
    const value = e.target.value;
    setTexto(value);
    setAbierto(true);
    setResaltado(-1);
    if (!value) onChange('');
  };

  const handleSeleccionar = (opcion) => {
    setTexto(displayFn(opcion));
    onChange(opcion._id);
    setAbierto(false);
    setResaltado(-1);
  };

  const handleKeyDown = (e) => {
    if (!abierto || filtradas.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setResaltado(r => Math.min(r + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setResaltado(r => Math.max(r - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resaltado >= 0) handleSeleccionar(filtradas[resaltado]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  const handleFocus = () => {
    if (opciones.length > 0) setAbierto(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      const opcion = opciones.find(o => o._id === valorId);
      if (opcion && texto === displayFn(opcion)) {
        setTexto(displayFn(opcion));
      } else {
        setTexto('');
        onChange('');
      }
      setAbierto(false);
    }, 150);
  };

  return (
    <div ref={contenedorRef} style={styles.autocompleteWrapper}>
      <input
        type="text"
        value={texto}
        onChange={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={styles.autocompleteInput}
        autoComplete="off"
        required={required}
      />
      <span style={styles.autocompleteIcon}>🔍</span>

      {abierto && filtradas.length > 0 && (
        <ul style={styles.autocompleteList}>
          {filtradas.map((opcion, idx) => (
            <li
              key={opcion._id}
              onPointerDown={(e) => {
                e.preventDefault();
                handleSeleccionar(opcion);
              }}
              style={{
                ...styles.autocompleteItem,
                ...(idx === resaltado ? styles.autocompleteItemResaltado : {})
              }}
              onMouseEnter={() => setResaltado(idx)}
            >
              {displayFn(opcion)}
            </li>
          ))}
        </ul>
      )}

      {abierto && texto.length > 0 && filtradas.length === 0 && (
        <div style={styles.autocompleteVacio}>Sin resultados para "{texto}"</div>
      )}
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const CrearOferta = ({ onOfertaCreada }) => {
  const [modo, setModo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mostrarFormularioEmpresa, setMostrarFormularioEmpresa] = useState(false);
  const [instructoresVisibles, setInstructoresVisibles] = useState({
    primerInstructor: '',
    segundoInstructor: ''
  });

  const [tiposProgramaIds, setTiposProgramaIds] = useState({ regular: '', campesena: '' });

  const [formData, setFormData] = useState({
    programa_formacion: '',
    modalidad: '',
    tipo_oferta: '',
    cupo_maximo: '',
    ambiente: { nombre: '' },
    fechas: { inicio: '', fin: '' },
    ubicacion: { departamento: 'Cauca', municipio: '', direccion: '' },
    empresa_solicitante: '',
    subsector_economico: { nombre: '' },
    programa_especial: '',
    convenio: { nombre: '' },
    horario: { hora_inicio: '08:00', hora_fin: '12:00', dias: [] },
    firma_digital_pdf: null,
    carta_pdf: null
  });

  const [programas, setProgramas] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [tiposPrograma, setTiposPrograma] = useState([]);
  const [tiposOferta, setTiposOferta] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [programasEspeciales, setProgramasEspeciales] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [nuevaEmpresa, setNuevaEmpresa] = useState({
    nombre: '', nit: '', fecha_creacion: '', tipo_empresa: 'Privada', direccion: '',
    representante_legal: { nombre_completo: '', documento_identidad: '', telefono: '', correo: '' },
    contacto: { nombre_completo: '', cargo: '', telefono: '', correo: '' },
    numero_empleados: ''
  });

  useEffect(() => { cargarDatosIniciales(); }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [programasRes, modalidadesRes, tiposProgramaRes, tiposOfertaRes, municipiosRes, programasEspecialesRes, empresasRes] = await Promise.all([
        api.get('/programas-formacion'),
        api.get('/modalidades'),
        api.get('/tipos-programa'),
        api.get('/tipos-oferta'),
        api.get('/municipios'),
        api.get('/programas-especiales'),
        api.get('/empresas')
      ]);
      setProgramas(programasRes.data.data || []);
      setModalidades(modalidadesRes.data.data || []);
      setTiposPrograma(tiposProgramaRes.data.data || []);
      setTiposOferta(tiposOfertaRes.data.data || []);
      setMunicipios(municipiosRes.data.data || []);
      setProgramasEspeciales(programasEspecialesRes.data.data || []);
      setEmpresas(empresasRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire({ icon: 'error', title: 'Error de carga', text: 'No se pudieron cargar los datos iniciales', timer: 3000, showConfirmButton: false });
    }
  };

  useEffect(() => {
    if (tiposPrograma.length > 0) {
      const regular = tiposPrograma.find(t => t.nombre === 'Regular');
      const campesena = tiposPrograma.find(t => t.nombre === 'Campesena');
      setTiposProgramaIds({ regular: regular?._id || '', campesena: campesena?._id || '' });
    }
  }, [tiposPrograma]);

  const determinarInstructores = (tipoProgramaId) => {
    const tipoSeleccionado = tiposPrograma.find(t => t._id === tipoProgramaId);
    if (!tipoSeleccionado) return { primero: '', segundo: '' };
    const instructores = {
      'Técnico': { primero: 'Empresarial', segundo: 'Popular' },
      'Empresarial': { primero: 'Técnico', segundo: 'Popular' },
      'Popular': { primero: 'Técnico', segundo: 'Empresarial' }
    };
    return instructores[tipoSeleccionado.nombre] || { primero: '', segundo: '' };
  };

  useEffect(() => {
    if (modo === 'campesena' && formData.tipo_programa) {
      setInstructoresVisibles(determinarInstructores(formData.tipo_programa));
    }
  }, [formData.tipo_programa, tiposPrograma, modo]);

  const handleNuevaEmpresaChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNuevaEmpresa({ ...nuevaEmpresa, [parent]: { ...nuevaEmpresa[parent], [child]: value } });
    } else {
      setNuevaEmpresa({ ...nuevaEmpresa, [name]: value });
    }
  };

  const mostrarAlertaValidacion = (mensaje) => {
    Swal.fire({ icon: 'warning', title: 'Campo requerido', text: mensaje, timer: 3000, showConfirmButton: true, confirmButtonColor: '#3498db' });
  };

  const crearNuevaEmpresa = async () => {
    try {
      if (!nuevaEmpresa.nombre) { mostrarAlertaValidacion('El nombre de la empresa es obligatorio'); return; }
      if (!nuevaEmpresa.nit) { mostrarAlertaValidacion('El NIT es obligatorio'); return; }
      if (!nuevaEmpresa.fecha_creacion) { mostrarAlertaValidacion('La fecha de creación es obligatoria'); return; }
      if (!nuevaEmpresa.direccion) { mostrarAlertaValidacion('La dirección es obligatoria'); return; }
      if (!nuevaEmpresa.representante_legal.nombre_completo) { mostrarAlertaValidacion('El nombre del representante legal es obligatorio'); return; }
      if (!nuevaEmpresa.contacto.nombre_completo) { mostrarAlertaValidacion('El nombre del contacto es obligatorio'); return; }
      if (!nuevaEmpresa.contacto.telefono) { mostrarAlertaValidacion('El teléfono del contacto es obligatorio'); return; }
      if (!nuevaEmpresa.contacto.correo) { mostrarAlertaValidacion('El correo del contacto es obligatorio'); return; }
      if (!nuevaEmpresa.numero_empleados) { mostrarAlertaValidacion('El número de empleados es obligatorio'); return; }

      setLoading(true);
      const response = await api.post('/empresas', nuevaEmpresa);
      setEmpresas([...empresas, response.data.data]);
      setFormData({ ...formData, empresa_solicitante: response.data.data._id });
      setMostrarFormularioEmpresa(false);
      setNuevaEmpresa({
        nombre: '', nit: '', fecha_creacion: '', tipo_empresa: 'Privada', direccion: '',
        representante_legal: { nombre_completo: '', documento_identidad: '', telefono: '', correo: '' },
        contacto: { nombre_completo: '', cargo: '', telefono: '', correo: '' },
        numero_empleados: ''
      });
      Swal.fire({ icon: 'success', title: '¡Empresa creada!', text: 'La empresa se ha registrado exitosamente', timer: 2000, showConfirmButton: false });
    } catch (error) {
      let mensajeError = error.message;
      if (error.response?.data?.message) mensajeError = error.response.data.message;
      Swal.fire({ icon: 'error', title: 'Error', text: mensajeError, confirmButtonColor: '#e74c3c' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      if (files[0].type !== 'application/pdf') {
        Swal.fire({ icon: 'error', title: 'Formato incorrecto', text: 'Solo se permiten archivos PDF', timer: 3000, showConfirmButton: false });
        return;
      }
      if (files[0].size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'El archivo no puede superar los 5MB', timer: 3000, showConfirmButton: false });
        return;
      }
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDiaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({ ...formData, horario: { ...formData.horario, dias: [...formData.horario.dias, value] } });
    } else {
      setFormData({ ...formData, horario: { ...formData.horario, dias: formData.horario.dias.filter(d => d !== value) } });
    }
  };

  const validarFormulario = () => {
    if (!formData.programa_formacion) { mostrarAlertaValidacion('Seleccione un programa de formación'); return false; }
    if (!formData.modalidad) { mostrarAlertaValidacion('Seleccione una modalidad'); return false; }
    if (!formData.tipo_oferta) { mostrarAlertaValidacion('Seleccione un tipo de oferta'); return false; }
    if (!formData.cupo_maximo) { mostrarAlertaValidacion('Ingrese el cupo máximo'); return false; }
    if (!formData.ambiente.nombre) { mostrarAlertaValidacion('El nombre del ambiente es obligatorio'); return false; }
    if (!formData.fechas.inicio || !formData.fechas.fin) { mostrarAlertaValidacion('Ingrese las fechas de inicio y fin'); return false; }
    const fechaInicio = new Date(formData.fechas.inicio);
    const fechaFin = new Date(formData.fechas.fin);
    if (fechaFin <= fechaInicio) {
      Swal.fire({ icon: 'warning', title: 'Fechas inválidas', text: 'La fecha de fin debe ser posterior a la fecha de inicio', timer: 3000, showConfirmButton: true });
      return false;
    }
    if (!formData.ubicacion.municipio) { mostrarAlertaValidacion('Seleccione un municipio'); return false; }
    if (!formData.ubicacion.direccion) { mostrarAlertaValidacion('Ingrese la dirección'); return false; }
    if (!formData.empresa_solicitante) { mostrarAlertaValidacion('Seleccione una empresa solicitante'); return false; }
    if (!formData.subsector_economico.nombre) { mostrarAlertaValidacion('Ingrese el subsector económico'); return false; }
    if (!formData.convenio.nombre) { mostrarAlertaValidacion('El nombre del convenio es obligatorio'); return false; }
    if (modo === 'regular' && formData.horario.dias.length === 0) { mostrarAlertaValidacion('Seleccione al menos un día'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tipoProgramaId = modo === 'regular' ? tiposProgramaIds.regular : tiposProgramaIds.campesena;
      if (!tipoProgramaId) {
        Swal.fire({ icon: 'error', title: 'Error de configuración', text: 'No se encontró el ID del tipo de programa.', confirmButtonColor: '#e74c3c' });
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('programa_formacion', formData.programa_formacion);
      formDataToSend.append('modalidad', formData.modalidad);
      formDataToSend.append('tipo_oferta', formData.tipo_oferta);
      formDataToSend.append('cupo_maximo', formData.cupo_maximo);
      formDataToSend.append('empresa_solicitante', formData.empresa_solicitante);
      formDataToSend.append('programa_especial', formData.programa_especial || '');
      formDataToSend.append('tipo_programa', tipoProgramaId);
      formDataToSend.append('modo', modo);
      formDataToSend.append('ambiente_nombre', formData.ambiente.nombre);
      formDataToSend.append('fechas_inicio', formData.fechas.inicio);
      formDataToSend.append('fechas_fin', formData.fechas.fin);
      formDataToSend.append('ubicacion_departamento', formData.ubicacion.departamento);
      formDataToSend.append('ubicacion_municipio', formData.ubicacion.municipio);
      formDataToSend.append('ubicacion_direccion', formData.ubicacion.direccion);
      formDataToSend.append('subsector_nombre', formData.subsector_economico.nombre);
      formDataToSend.append('convenio_nombre', formData.convenio.nombre);

      // ✅ FIX: horario_dias solo se agrega una vez, dentro del bloque regular
      if (modo === 'regular') {
        formDataToSend.append('horario_hora_inicio', formData.horario.hora_inicio);
        formDataToSend.append('horario_hora_fin', formData.horario.hora_fin);
        formDataToSend.append('horario_dias', JSON.stringify(formData.horario.dias));
      }

      // ✅ Línea duplicada eliminada — ya no sobreescribe los días con []
      formDataToSend.append('duracion_meses', '12');

      if (formData.firma_digital_pdf) formDataToSend.append('firma_digital_pdf', formData.firma_digital_pdf);
      if (formData.carta_pdf) formDataToSend.append('carta_pdf', formData.carta_pdf);

      if (modo === 'campesena' && formData.instructores) {
        formDataToSend.append('instructores', JSON.stringify(formData.instructores));
      }

      Swal.fire({ title: 'Guardando oferta...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

      const response = await api.post('/ofertas', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });

      Swal.close();
      const linkInscripciones = response.data.data?.link_inscripciones;
      if (linkInscripciones) {
        await Swal.fire({ icon: 'success', title: '¡Oferta creada!', text: 'Redirigiendo al panel de links de inscripción...', timer: 1500, showConfirmButton: false });
        if (typeof onOfertaCreada === 'function') onOfertaCreada();
        return;
      }
      Swal.fire({ icon: 'success', title: '¡Oferta creada!', text: 'La oferta se ha guardado exitosamente', timer: 2000, showConfirmButton: false });

    } catch (error) {
      Swal.close();
      let mensajeError = error.message;
      if (error.response?.data?.errors) mensajeError = error.response.data.errors.join(', ');
      else if (error.response?.data?.message) mensajeError = error.response.data.message;
      Swal.fire({ icon: 'error', title: 'Error', text: mensajeError, confirmButtonColor: '#e74c3c' });
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  if (!modo) return <SeleccionarTipoOferta onSeleccionar={setModo} />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {modo === 'regular' ? ' Crear Oferta Regular' : 'Crear Oferta Campesena'}
        </h2>
        <button onClick={() => setModo(null)} style={styles.cambiarModoButton}>← Volver</button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* PROGRAMA DE FORMACIÓN */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Programa de Formación</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Programa:</label>
            <Autocomplete
              opciones={programas}
              valorId={formData.programa_formacion}
              onChange={(id) => setFormData({ ...formData, programa_formacion: id })}
              placeholder="Escribe nombre o código del programa..."
              displayFn={(p) => `${p.nombre_programa} - ${p.codigo}`}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Modalidad:</label>
            <select name="modalidad" value={formData.modalidad} onChange={handleChange} style={styles.select} required>
              <option value="">Seleccione...</option>
              {modalidades.map(mod => <option key={mod._id} value={mod._id}>{mod.nombre}</option>)}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tipo de Oferta:</label>
            <select name="tipo_oferta" value={formData.tipo_oferta} onChange={handleChange} style={styles.select} required>
              <option value="">Seleccione...</option>
              {tiposOferta.map(to => <option key={to._id} value={to._id}>{to.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* CUPOS */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Cupos</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Cupo Máximo:</label>
            <input type="number" name="cupo_maximo" value={formData.cupo_maximo} onChange={handleChange} style={styles.input} placeholder="30" min="1" required />
          </div>
        </div>

        {/* AMBIENTE */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Modelo de Ambiente</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre del Ambiente:</label>
            <input type="text" name="ambiente.nombre" value={formData.ambiente.nombre} onChange={handleChange} style={styles.input} placeholder="Ej: Aula 101" required />
          </div>
        </div>

        {/* FECHAS */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Fechas</h3>
          <div style={styles.row}>
            <div style={styles.half}>
              <label style={styles.label}>Fecha Inicio:</label>
              <input type="date" name="fechas.inicio" value={formData.fechas.inicio} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.half}>
              <label style={styles.label}>Fecha Fin:</label>
              <input type="date" name="fechas.fin" value={formData.fechas.fin} onChange={handleChange} style={styles.input} required />
            </div>
          </div>
        </div>

        {/* UBICACIÓN */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Ubicación</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Departamento:</label>
            <input type="text" name="ubicacion.departamento" value={formData.ubicacion.departamento} onChange={handleChange} style={styles.input} placeholder="Cauca" required />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Municipio:</label>
            <Autocomplete
              opciones={municipios}
              valorId={formData.ubicacion.municipio}
              onChange={(id) => setFormData({ ...formData, ubicacion: { ...formData.ubicacion, municipio: id } })}
              placeholder="Escribe el nombre del municipio..."
              displayFn={(m) => m.nombre}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Dirección:</label>
            <input type="text" name="ubicacion.direccion" value={formData.ubicacion.direccion} onChange={handleChange} style={styles.input} placeholder="Calle 123 #45-67, Barrio Centro" required />
          </div>
        </div>

        {/* EMPRESA SOLICITANTE */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Empresa Solicitante</h3>

          {!mostrarFormularioEmpresa ? (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Seleccionar Empresa:</label>
                <select name="empresa_solicitante" value={formData.empresa_solicitante} onChange={handleChange} style={styles.select} required>
                  <option value="">Seleccione una empresa...</option>
                  {empresas.map(emp => <option key={emp._id} value={emp._id}>{emp.nombre} - NIT: {emp.nit}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => setMostrarFormularioEmpresa(true)} style={styles.secondaryButton}>
                ➕ Crear Nueva Empresa
              </button>
            </>
          ) : (
            <div style={styles.subSection}>
              <h4 style={styles.subSectionTitle}>Nueva Empresa</h4>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre de la Empresa:</label>
                <input type="text" name="nombre" value={nuevaEmpresa.nombre} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Nombre de la empresa" />
              </div>
              <div style={styles.row}>
                <div style={styles.half}>
                  <label style={styles.label}>NIT:</label>
                  <input type="text" name="nit" value={nuevaEmpresa.nit} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="123456789-0" />
                </div>
                <div style={styles.half}>
                  <label style={styles.label}>Fecha Creación:</label>
                  <input type="date" name="fecha_creacion" value={nuevaEmpresa.fecha_creacion} onChange={handleNuevaEmpresaChange} style={styles.input} />
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.half}>
                  <label style={styles.label}>Tipo de Empresa:</label>
                  <select name="tipo_empresa" value={nuevaEmpresa.tipo_empresa} onChange={handleNuevaEmpresaChange} style={styles.select}>
                    <option value="Privada">Privada</option>
                    <option value="Pública">Pública</option>
                    <option value="Mixta">Mixta</option>
                    <option value="ONG">ONG</option>
                    <option value="Fundación">Fundación</option>
                    <option value="Cooperativa">Cooperativa</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div style={styles.half}>
                  <label style={styles.label}>Dirección:</label>
                  <input type="text" name="direccion" value={nuevaEmpresa.direccion} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Dirección completa" />
                </div>
              </div>

              <h4 style={styles.subSectionTitle}>Representante Legal</h4>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre Completo:</label>
                <input type="text" name="representante_legal.nombre_completo" value={nuevaEmpresa.representante_legal.nombre_completo} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Nombre completo del representante" />
              </div>
              <div style={styles.row}>
                <div style={styles.half}>
                  <label style={styles.label}>Documento:</label>
                  <input type="text" name="representante_legal.documento_identidad" value={nuevaEmpresa.representante_legal.documento_identidad} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Documento de identidad" />
                </div>
                <div style={styles.half}>
                  <label style={styles.label}>Teléfono:</label>
                  <input type="text" name="representante_legal.telefono" value={nuevaEmpresa.representante_legal.telefono} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Teléfono" />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo:</label>
                <input type="email" name="representante_legal.correo" value={nuevaEmpresa.representante_legal.correo} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="correo@ejemplo.com" />
              </div>

              <h4 style={styles.subSectionTitle}>Contacto en la Empresa</h4>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre Completo:</label>
                <input type="text" name="contacto.nombre_completo" value={nuevaEmpresa.contacto.nombre_completo} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Nombre del contacto" />
              </div>
              <div style={styles.row}>
                <div style={styles.half}>
                  <label style={styles.label}>Cargo:</label>
                  <input type="text" name="contacto.cargo" value={nuevaEmpresa.contacto.cargo} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Cargo del contacto" />
                </div>
                <div style={styles.half}>
                  <label style={styles.label}>Teléfono:</label>
                  <input type="text" name="contacto.telefono" value={nuevaEmpresa.contacto.telefono} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Teléfono del contacto" />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo:</label>
                <input type="email" name="contacto.correo" value={nuevaEmpresa.contacto.correo} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="correo@ejemplo.com" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Número de Empleados:</label>
                <input type="number" name="numero_empleados" value={nuevaEmpresa.numero_empleados} onChange={handleNuevaEmpresaChange} style={styles.input} placeholder="Ej: 50" min="1" />
              </div>

              <div style={styles.buttonGroup}>
                <button type="button" onClick={crearNuevaEmpresa} style={styles.successButton} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Empresa'}
                </button>
                <button type="button" onClick={() => setMostrarFormularioEmpresa(false)} style={styles.cancelButton}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* SUBSECTOR ECONÓMICO */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Subsector Económico</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre:</label>
            <input type="text" name="subsector_economico.nombre" value={formData.subsector_economico.nombre} onChange={handleChange} style={styles.input} placeholder="Ej: Tecnologías de la Información" required />
          </div>
        </div>

        {/* PROGRAMA ESPECIAL */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Programa Especial</h3>
          <div style={styles.formGroup}>
            <select name="programa_especial" value={formData.programa_especial} onChange={handleChange} style={styles.select}>
              <option value="">Ninguno</option>
              {programasEspeciales.map(pe => <option key={pe._id} value={pe._id}>{pe.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* CONVENIO */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Convenio</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre del Convenio:</label>
            <input type="text" name="convenio.nombre" value={formData.convenio.nombre} onChange={handleChange} style={styles.input} placeholder="Nombre del convenio" required />
          </div>
        </div>

        {/* HORARIO */}
        {modo === 'regular' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Horario</h3>
            <div style={styles.row}>
              <div style={styles.half}>
                <label style={styles.label}>Hora Inicio:</label>
                <input type="time" name="horario.hora_inicio" value={formData.horario.hora_inicio} onChange={handleChange} style={styles.input} required />
              </div>
              <div style={styles.half}>
                <label style={styles.label}>Hora Fin:</label>
                <input type="time" name="horario.hora_fin" value={formData.horario.hora_fin} onChange={handleChange} style={styles.input} required />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Días:</label>
              <div style={styles.checkboxGroup}>
                {diasSemana.map(dia => (
                  <label key={dia} style={styles.checkboxLabel}>
                    <input type="checkbox" value={dia} checked={formData.horario.dias.includes(dia)} onChange={handleDiaChange} /> {dia}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FORMULARIO CAMPESENA */}
        {modo === 'campesena' && (
          <FormularioCampesenaCompleto formData={formData} setFormData={setFormData} />
        )}

        {/* ARCHIVOS PDF */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Documentos Adjuntos</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Firma Digital (PDF):</label>
            <div style={styles.fileInputGroup}>
              <input type="file" id="firma_digital_pdf" name="firma_digital_pdf" onChange={handleFileChange} style={styles.fileInput} accept=".pdf" />
              {formData.firma_digital_pdf && (
                <div style={styles.fileInfo}>
                  <span style={styles.fileName}>{formData.firma_digital_pdf.name}</span>
                  <button type="button" onClick={() => { document.getElementById('firma_digital_pdf').value = ''; setFormData({ ...formData, firma_digital_pdf: null }); }} style={styles.removeFileButton}>✕</button>
                </div>
              )}
            </div>
            <small style={styles.fileHint}>Archivo PDF con la firma digital escaneada</small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Carta (PDF):</label>
            <div style={styles.fileInputGroup}>
              <input type="file" id="carta_pdf" name="carta_pdf" onChange={handleFileChange} style={styles.fileInput} accept=".pdf" />
              {formData.carta_pdf && (
                <div style={styles.fileInfo}>
                  <span style={styles.fileName}>{formData.carta_pdf.name}</span>
                  <button type="button" onClick={() => { document.getElementById('carta_pdf').value = ''; setFormData({ ...formData, carta_pdf: null }); }} style={styles.removeFileButton}>✕</button>
                </div>
              )}
            </div>
            <small style={styles.fileHint}>Documento PDF de la carta solicitante</small>
          </div>
        </div>

        <button type="submit" style={loading ? { ...styles.submitButton, ...styles.buttonDisabled } : styles.submitButton} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Oferta'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { color: '#2c3e50', borderBottom: '3px solid #3498db', paddingBottom: '10px', marginBottom: '0', fontSize: '28px' },
  cambiarModoButton: { backgroundColor: '#95a5a6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },

  autocompleteWrapper: { position: 'relative', width: '100%' },
  autocompleteInput: { padding: '10px 36px 10px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  autocompleteIcon: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' },
  autocompleteList: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #3498db', borderTop: 'none', borderRadius: '0 0 4px 4px', maxHeight: '220px', overflowY: 'auto', zIndex: 1000, margin: 0, padding: 0, listStyle: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
  autocompleteItem: { padding: '10px 12px', cursor: 'pointer', fontSize: '14px', color: '#2c3e50', borderBottom: '1px solid #f0f0f0' },
  autocompleteItemResaltado: { backgroundColor: '#eaf4fc', color: '#2980b9' },
  autocompleteVacio: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '10px 12px', fontSize: '13px', color: '#95a5a6', zIndex: 1000 },

  section: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e0e0e0' },
  subSection: { backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', marginTop: '10px', border: '1px solid #3498db' },
  sectionTitle: { color: '#2c3e50', marginTop: 0, marginBottom: '20px', fontSize: '18px', borderBottom: '1px solid #3498db', paddingBottom: '5px' },
  subSectionTitle: { color: '#3498db', marginTop: 0, marginBottom: '15px', fontSize: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' },
  row: { display: 'flex', gap: '20px', marginBottom: '15px' },
  half: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#34495e' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', outline: 'none' },
  select: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' },
  checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '15px', padding: '10px 0' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
  submitButton: { backgroundColor: '#27ae60', color: 'white', padding: '15px', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  secondaryButton: { backgroundColor: '#3498db', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px', width: '100%' },
  successButton: { flex: 1, backgroundColor: '#27ae60', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  cancelButton: { flex: 1, backgroundColor: '#e74c3c', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  buttonDisabled: { backgroundColor: '#95a5a6', cursor: 'not-allowed' },
  fileInputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fileInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#ecf0f1', borderRadius: '4px' },
  fileName: { fontSize: '13px', color: '#2c3e50', flex: 1 },
  removeFileButton: { backgroundColor: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', padding: '0 5px' },
  fileHint: { fontSize: '12px', color: '#7f8c8d', marginTop: '4px' },
  fileInput: { fontSize: '14px' }
};

export default CrearOferta;