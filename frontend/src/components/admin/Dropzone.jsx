import { useRef, useState } from 'react';
import Icon from '../ui/Icon';
import './Dropzone.css';

const MAX_MB = 25;

/**
 * Subida de fotos: arrastrar y soltar, o tocar para elegir del carrete.
 *
 * Valida tipo y tamano aqui para avisar al instante, sin esperar a que el
 * archivo suba y el servidor lo rechace. El backend vuelve a validar: esto
 * es comodidad, no seguridad.
 */
export default function Dropzone({ onFiles, isBusy = false, progress = null }) {
  const [isOver, setIsOver] = useState(false);
  const [rejected, setRejected] = useState([]);
  const inputRef = useRef(null);

  const handle = (fileList) => {
    const files = [...fileList];
    const ok = [];
    const bad = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        bad.push(`${file.name}: no es una imagen`);
      } else if (file.size > MAX_MB * 1024 * 1024) {
        bad.push(`${file.name}: pesa más de ${MAX_MB} MB`);
      } else {
        ok.push(file);
      }
    }

    setRejected(bad);
    if (ok.length) onFiles(ok);
  };

  return (
    <div className="dropzone-wrap">
      <div
        className={`dropzone ${isOver ? 'is-over' : ''} ${isBusy ? 'is-busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          if (!isBusy) handle(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          disabled={isBusy}
          onChange={(e) => {
            handle(e.target.files);
            // Permite volver a elegir el mismo archivo si hizo falta reintentar
            e.target.value = '';
          }}
        />

        <span className="dropzone__icon">
          <Icon name="upload" size={24} />
        </span>

        <p className="dropzone__title">
          {isBusy ? 'Subiendo tus fotos...' : 'Arrastra tus fotos aquí'}
        </p>
        <p className="dropzone__hint">
          JPG, PNG o WebP · hasta {MAX_MB} MB cada una · varias a la vez
        </p>

        <button
          type="button"
          className="abtn abtn--secondary"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
        >
          Elegir del teléfono
        </button>
      </div>

      {progress?.length > 0 && (
        <ul className="dropzone__progress">
          {progress.map((item) => (
            <li key={item.name} className={item.status}>
              <span className="dropzone__progress-name">{item.name}</span>
              <span className="dropzone__progress-bar">
                <span style={{ width: `${item.percent}%` }} />
              </span>
              <span className="dropzone__progress-state">
                {item.status === 'done' && 'Lista'}
                {item.status === 'error' && 'Falló'}
                {item.status === 'uploading' && `${item.percent}%`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {rejected.length > 0 && (
        <ul className="dropzone__rejected">
          {rejected.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
