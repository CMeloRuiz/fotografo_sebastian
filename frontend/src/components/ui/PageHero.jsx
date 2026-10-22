import './PageHero.css';

/** Cabecera de las paginas interiores: compacta, sin robarle sitio al contenido. */
export default function PageHero({ eyebrow, title, lead, children }) {
  return (
    <section className="page-hero">
      <div className="container">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-hero__title">{title}</h1>
        {lead && <p className="lead page-hero__lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
