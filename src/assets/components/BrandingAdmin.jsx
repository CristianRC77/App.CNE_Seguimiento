import { useState } from 'react';
import { updateBrandConfig } from '../constants/brandConfig.js';
import './BrandingAdmin.css';

export default function BrandingAdmin({ authSession, onConfigUpdated }) {
  const [formData, setFormData] = useState({
    organizationName: 'Consejo Nacional Electoral',
    subtitle: 'Oficinas Consulares',
    logoPath: '/images/logo-cne.png',
    logoAlt: 'Logo CNE',
    reportTitle: 'Reporte de Seguimiento CNE',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const success = await updateBrandConfig(formData, authSession?.token);
      if (success) {
        setMessage('✅ Configuración actualizada correctamente');
        if (onConfigUpdated) onConfigUpdated();
      } else {
        setMessage('❌ Error al actualizar la configuración. Verifica tu rol de administrador.');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!authSession || authSession.user.rol !== 'admin') {
    return (
      <div className="branding-admin-restricted">
        <p>⚠️ Acceso restringido. Solo administradores pueden cambiar la configuración de marca.</p>
      </div>
    );
  }

  return (
    <div className="branding-admin">
      <h2>🎨 Configuración de Marca</h2>
      
      <form onSubmit={handleSubmit} className="branding-form">
        <div className="form-group">
          <label htmlFor="organizationName">Nombre de la Organización</label>
          <input
            type="text"
            id="organizationName"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="subtitle">Subtítulo/Descripción</label>
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="logoPath">Ruta del Logo</label>
          <input
            type="text"
            id="logoPath"
            name="logoPath"
            value={formData.logoPath}
            onChange={handleChange}
            placeholder="/images/logo.png"
          />
          {formData.logoPath && (
            <div className="logo-preview">
              <img 
                src={formData.logoPath} 
                alt="Vista previa" 
                onError={(e) => {
                  e.target.src = '/images/logo-cne.png';
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="logoAlt">Texto Alternativo del Logo</label>
          <input
            type="text"
            id="logoAlt"
            name="logoAlt"
            value={formData.logoAlt}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="reportTitle">Título para Reportes</label>
          <input
            type="text"
            id="reportTitle"
            name="reportTitle"
            value={formData.reportTitle}
            onChange={handleChange}
          />
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>

      <div className="info-box">
        <h3>ℹ️ Información</h3>
        <p>Los cambios se mostrarán en:</p>
        <ul>
          <li>✅ Barra lateral de la aplicación</li>
          <li>✅ Encabezados de reportes en Excel</li>
          <li>✅ Encabezados de reportes en CSV</li>
          <li>✅ Nombres de archivos descargados</li>
        </ul>
      </div>
    </div>
  );
}
