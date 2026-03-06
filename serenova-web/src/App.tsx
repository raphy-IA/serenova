import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import SiteDetail from './pages/SiteDetail';
import NewSite from './pages/NewSite';
import Locataires from './pages/Locataires';
import NewLocataire from './pages/NewLocataire';
import Baux from './pages/Baux';
import NewBail from './pages/NewBail';
import NewEspace from './pages/NewEspace';
import Paiements from './pages/Paiements';
import PaiementDetail from './pages/PaiementDetail';
import Tresorerie from './pages/Tresorerie';
import LocataireDetail from './pages/LocataireDetail';
import ParcImmobilier from './pages/ParcImmobilier';
import BailDetail from './pages/BailDetail';
import EspaceDetail from './pages/EspaceDetail';
import Login from './pages/Login';
import Parametres from './pages/Parametres';
import Utilisateurs from './pages/Utilisateurs';
import Organisations from './pages/Organisations';
import NewOrganisation from './pages/NewOrganisation';
import OrganisationDetail from './pages/OrganisationDetail';
import StaffPage from './pages/StaffPage';
import PlansPage from './pages/PlansPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SubscriptionDetail from './pages/SubscriptionDetail';
import PaymentSettings from './pages/PaymentSettings';
import ClientBilling from './pages/ClientBilling';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="sites" element={<Sites />} />
          <Route path="sites/new" element={<NewSite />} />
          <Route path="sites/:id" element={<SiteDetail />} />
          <Route path="sites/:id/espaces/new" element={<NewEspace />} />
          <Route path="locataires" element={<Locataires />} />
          <Route path="locataires/new" element={<NewLocataire />} />
          <Route path="locataires/:id" element={<LocataireDetail />} />
          <Route path="locataires/edit/:id" element={<NewLocataire />} />
          <Route path="baux" element={<Baux />} />
          <Route path="baux/new" element={<NewBail />} />
          <Route path="baux/:id" element={<BailDetail />} />
          <Route path="baux/edit/:id" element={<NewBail />} />
          <Route path="paiements" element={<Paiements />} />
          <Route path="paiements/:id" element={<PaiementDetail />} />
          <Route path="tresorerie" element={<Tresorerie />} />
          <Route path="parc" element={<ParcImmobilier />} />
          <Route path="parametres" element={<Parametres />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
            <Route path="utilisateurs" element={<Utilisateurs />} />
            <Route path="mon-abonnement" element={<ClientBilling />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="organisations" element={<Organisations />} />
            <Route path="organisations/new" element={<NewOrganisation />} />
            <Route path="organisations/:id" element={<OrganisationDetail />} />
            <Route path="organisations/edit/:id" element={<NewOrganisation />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="abonnements" element={<SubscriptionsPage />} />
            <Route path="abonnements/:id" element={<SubscriptionDetail />} />
            <Route path="passerelles-paiement" element={<PaymentSettings />} />
            <Route path="annonces" element={<AnnouncementsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
          </Route>
          <Route path="sites/:siteId/espaces/:id" element={<EspaceDetail />} />
          <Route path="sites/:siteId/espaces/edit/:id" element={<NewEspace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
