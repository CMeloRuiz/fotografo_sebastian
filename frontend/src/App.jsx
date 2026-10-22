import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import RouteFallback from './components/ui/RouteFallback';
import { SiteDataProvider } from './context/SiteDataProvider';

/*
 * El home entra en el bundle principal porque es la primera pantalla y lo
 * que mide Lighthouse. El resto se carga cuando se visita, y el panel de
 * administracion queda en su propio trozo: un visitante nunca lo descarga.
 */
const Portfolio = lazy(() => import('./pages/Portfolio'));
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'));
const Services = lazy(() => import('./pages/Services'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <SiteDataProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="portafolio" element={<Portfolio />} />
            <Route path="portafolio/:slug" element={<AlbumDetail />} />
            <Route path="servicios" element={<Services />} />
            <Route path="sobre-mi" element={<About />} />
            <Route path="contacto" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </SiteDataProvider>
  );
}
