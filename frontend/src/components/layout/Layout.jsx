import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WhatsAppFab from './WhatsAppFab';
import siteContent from '../../data/siteContent';
import { whatsappLink } from '../../lib/whatsapp';

/** Lleva el scroll arriba al cambiar de pagina, salvo si la URL trae ancla. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}

export default function Layout({ content = siteContent }) {
  const wa = whatsappLink(content.contact.whatsapp, content.contact.whatsappMessage);

  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer content={content} />
      <WhatsAppFab href={wa} />
    </>
  );
}
