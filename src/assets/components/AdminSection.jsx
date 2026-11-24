import { useState } from 'react';
import './AdminSection.css';

export default function AdminSection({ authSession }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Solo mostrar para admins
  if (!authSession || authSession.user.rol !== 'ADMIN') {
    return null;
  }

  const handleResetDatabase = async () => {
    if (confirmationInput !== 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE') {
      setMessage('❌ Código de confirmación inválido');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/admin/reset-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.token}`,
        },
        body: JSON.stringify({
          confirmationPhrase: 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}\n\nSe eliminaron: ${data.deletedCount} registros`);
        setConfirmationInput('');
        setTimeout(() => {
          setShowResetModal(false);
          setMessage('');
          // Recargar la página
          window.location.reload();
        }, 3000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h3>🔧 Administración</h3>

      <div className="admin-controls">
        <div className="control-group">
          <h4>Base de Datos</h4>
          <p className="control-description">
            Gestiona los datos de la aplicación. Usa con precaución.
          </p>
          <button
            className="admin-btn reset-btn"
            onClick={() => setShowResetModal(true)}
            title="Limpiar todos los datos de seguimiento"
          >
            🗑️ Vaciar Base de Datos
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Vaciar Base de Datos</h2>
              <button
                className="close-btn"
                onClick={() => !loading && setShowResetModal(false)}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            {/* Advertencia principal */}
            <div className="warning-box">
              <p>
                <strong>⚠️ ATENCIÓN:</strong> Esta acción eliminará <strong>TODOS</strong> los datos
                de seguimiento de la aplicación. <strong>Esta acción NO se puede deshacer</strong>.
              </p>
            </div>

            {/* Información */}
            <div className="info-section">
              <h4>Paso 1: Verifica qué se eliminará</h4>
              <ul className="info-list">
                <li>✓ Todos los registros de zonas electorales</li>
                <li>✓ Todos los datos de seguimiento</li>
                <li>✓ Todos los hitos completados</li>
                <li>✗ Los usuarios NO serán eliminados</li>
                <li>✗ La configuración de marca NO será eliminada</li>
              </ul>

              <h4>Paso 2: Ingresa el código de confirmación</h4>
              <p className="confirmation-hint-text">
                Para evitar borrados accidentales, copia y pega el siguiente código:
              </p>
              <div className="code-box">
                <code>ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE</code>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE');
                  }}
                  title="Copiar al portapapeles"
                >
                  📋
                </button>
              </div>

              <input
                type="text"
                placeholder="Pega el código aquí"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                className={`confirmation-input ${
                  confirmationInput === 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE' ? 'valid' : ''
                }`}
                disabled={loading}
              />

              {confirmationInput === 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE' && (
                <div className="validation-success">✅ Código correcto</div>
              )}
            </div>

            {/* Mensajes */}
            {message && (
              <div
                className={`message ${
                  message.includes('✅') ? 'success' : 'error'
                }`}
              >
                {message.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            {/* Botones */}
            <div className="modal-buttons">
              <button
                className="btn btn-cancel"
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmationInput('');
                  setMessage('');
                }}
                disabled={loading}
              >
                ← Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleResetDatabase}
                disabled={
                  loading ||
                  confirmationInput !== 'ELIMINAR_TODOS_LOS_DATOS_PERMANENTEMENTE'
                }
              >
                {loading ? '⏳ Procesando...' : '🗑️ Eliminar Todos los Datos'}
              </button>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <small>
                Esta acción será registrada. Admin: <strong>{authSession.user.username}</strong>
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
