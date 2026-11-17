import { useState } from 'react';
import { login } from '../data/authService';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await login(username, password);
      onSuccess(session);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <span className="login-modal-icon" aria-hidden="true">🔒</span>
        <h2 id="login-title">Acceso restringido</h2>
        <p>Inicia sesión para marcar avances ejecutados.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-username">Usuario</label>
          <input
            id="login-username"
            type="text"
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Validando...' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </div>
  );
}
