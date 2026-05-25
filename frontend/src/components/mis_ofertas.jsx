import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MisOfertas = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mapa de colores para los estados
  const coloresEstado = {
    'borrador': '#95a5a6',
    'pendiente': '#f39c12',
    'rechazada': '#e74c3c',
    'aprobada': '#27ae60',
    'ficha_creada': '#2980b9',
    'con_inscritos': '#8e44ad',
    'completada': '#2c3e50'
  };

  // Nombres para mostrar
  const nombresEstado = {
    'borrador': 'Borrador',
    'pendiente': 'Pendiente',
    'rechazada': 'Rechazada',
    'aprobada': 'Aprobada',
    'ficha_creada': 'Ficha Creada',
    'con_inscritos': 'Con Inscritos',
    'completada': 'Completada'
  };

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ofertas/mis-ofertas');
      console.log('Ofertas cargadas:', response.data);
      setOfertas(response.data.data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (ofertaId) => {
    // Aquí puedes implementar un modal o redirigir a una página de detalle
    alert(`Ver detalle de oferta ${ofertaId} - Próximamente`);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO');
  };

  if (loading) {
    return <div style={styles.loading}>Cargando ofertas...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 Mis Ofertas</h2>
      
      {error && <div style={styles.errorAlert}>❌ {error}</div>}

      {ofertas.length === 0 ? (
        <div style={styles.noData}>
          <p>📭 No has creado ninguna oferta aún</p>
          <p style={styles.noDataSub}>Ve a "Crear Oferta" para comenzar</p>
        </div>
      ) : (
        <>
          <p style={styles.totalInfo}>
            Total de ofertas: <strong>{ofertas.length}</strong>
          </p>
          
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Programa</th>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Fechas</th>
                  <th style={styles.th}>Cupos</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((oferta) => (
                  <tr key={oferta._id} style={styles.tr}>
                    <td style={styles.td}>
                      {oferta.programa_formacion?.nombre_programa || 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {oferta.programa_formacion?.codigo || 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {oferta.es_campesena ? 'Campesena' : 'Regular'}
                    </td>
                    <td style={styles.td}>
                      {formatearFecha(oferta.fechas?.inicio)} - {formatearFecha(oferta.fechas?.fin)}
                    </td>
                    <td style={styles.td}>
                      {oferta.cupos_disponibles || 0}/{oferta.cupo_maximo || 0}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.estadoBadge,
                        backgroundColor: coloresEstado[oferta.estado?.codigo] || '#95a5a6'
                      }}>
                        {nombresEstado[oferta.estado?.codigo] || oferta.estado?.codigo || 'Sin estado'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => verDetalle(oferta._id)}
                        style={styles.verButton}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    color: '#2c3e50',
    borderBottom: '3px solid #3498db',
    paddingBottom: '10px',
    marginBottom: '20px',
    fontSize: '24px'
  },
  totalInfo: {
    backgroundColor: '#f8f9fa',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '20px',
    color: '#2c3e50',
    border: '1px solid #e0e0e0'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#7f8c8d'
  },
  noData: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#2c3e50',
    border: '1px dashed #3498db'
  },
  noDataSub: {
    color: '#7f8c8d',
    fontSize: '14px',
    marginTop: '10px'
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px'
  },
  tr: {
    ':hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  estadoBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  verButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  errorAlert: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px'
  }
};

export default MisOfertas;