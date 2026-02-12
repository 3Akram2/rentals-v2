import { useState, useEffect } from 'react';
import { useLang } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import BuildingList from './components/BuildingList';
import BuildingForm from './components/BuildingForm';
import PropertyList from './components/PropertyList';
import PropertyForm from './components/PropertyForm';
import PaymentForm from './components/PaymentForm';
import PaymentHistory from './components/PaymentHistory';
import Report from './components/Report';
import Receipt from './components/Receipt';
import BlankReceipt from './components/BlankReceipt';
import OwnershipSettings from './components/OwnershipSettings';
import OwnershipReport from './components/OwnershipReport';
import GroupDetailsReport from './components/GroupDetailsReport';
import UserManagement from './components/UserManagement';
import UserReport from './components/UserReport';
import PayoutReport from './components/PayoutReport';
import AdminUserManagement from './components/AdminUserManagement';
import ProfilePage from './components/ProfilePage';
import BuildingAiAssistant from './components/BuildingAiAssistant';
import AiDashboard from './components/AiDashboard';
import * as api from './api';

function App() {
  const { t, lang, toggleLang, isRtl } = useLang();
  const { user, loading: authLoading, hasPermission } = useAuth();
  const [currentView, setCurrentView] = useState('buildings');
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [properties, setProperties] = useState([]);
  const [modal, setModal] = useState({ type: null, data: null });
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  const canCreateBuilding = hasPermission('building@create');
  const canUpdateBuilding = hasPermission('building@update');
  const canDeleteBuilding = hasPermission('building@delete');
  const canReadReport = hasPermission('report@read');
  const canManageOwnership = hasPermission('building@update');

  const canCreateProperty = hasPermission('property@create');
  const canUpdateProperty = hasPermission('property@update');
  const canDeleteProperty = hasPermission('property@delete');
  const canCreatePayment = hasPermission('payment@create');
  const canUpdatePayment = hasPermission('payment@update');

  useEffect(() => {
    if (user) loadBuildings();
  }, [user]);

  useEffect(() => {
    if (selectedBuilding) {
      loadProperties(selectedBuilding._id);
    }
  }, [selectedBuilding]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleNavigate(view) {
    setCurrentView(view);
    if (view === 'buildings') {
      setSelectedBuilding(null);
      setProperties([]);
      setAiOpen(false);
    }
  }

  async function loadBuildings() {
    setLoading(true);
    const data = await api.getBuildings();
    setBuildings(data);
    setLoading(false);
  }

  async function loadProperties(buildingId) {
    setLoading(true);
    const data = await api.getProperties(buildingId);
    setProperties(data);
    setLoading(false);
  }

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="login-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  function openModal(type, data = null) {
    setModal({ type, data });
  }

  function closeModal() {
    setModal({ type: null, data: null });
  }

  async function handleSaveBuilding(data) {
    if (modal.data && !canUpdateBuilding) return;
    if (!modal.data && !canCreateBuilding) return;

    if (modal.data) {
      await api.updateBuilding(modal.data._id, data);
    } else {
      await api.createBuilding(data);
    }
    loadBuildings();
    closeModal();
  }

  async function handleDeleteBuilding(id) {
    if (!canDeleteBuilding) return;
    if (confirm(t('deleteBuilding'))) {
      await api.deleteBuilding(id);
      if (selectedBuilding?._id === id) {
        setSelectedBuilding(null);
        setProperties([]);
      }
      loadBuildings();
    }
  }

  async function handleSaveProperty(data) {
    if (modal.data && !canUpdateProperty) return;
    if (!modal.data && !canCreateProperty) return;

    let result;
    if (modal.data) {
      result = await api.updateProperty(modal.data._id, data);
    } else {
      result = await api.createProperty({ ...data, buildingId: selectedBuilding._id });
    }

    if (result.error === 'unitExists') {
      alert(t('unitExists'));
      return;
    }

    loadProperties(selectedBuilding._id);
    closeModal();
  }

  async function handleDeleteProperty(id) {
    if (!canDeleteProperty) return;
    if (confirm(t('deleteProperty'))) {
      await api.deleteProperty(id);
      loadProperties(selectedBuilding._id);
    }
  }

  async function handleSavePayment(data) {
    if (!canCreatePayment) return;
    await api.createPayment({ ...data, propertyId: modal.data._id });
    closeModal();
  }

  async function handleSaveBulkPayments(payments) {
    if (!canCreatePayment) return;
    for (const payment of payments) {
      await api.createPayment({ ...payment, propertyId: modal.data._id });
    }
    closeModal();
  }

  async function handleUpdatePayment(paymentId, data) {
    if (!canUpdatePayment) return;
    await api.updatePayment(paymentId, data);
    closeModal();
  }

  async function handleSaveOwnership(data) {
    if (!canManageOwnership) return;
    await api.updateBuilding(modal.data._id, data);
    loadBuildings();
    closeModal();
  }

  return (
    <div className="app-container">
      <Sidebar
        onNavigate={handleNavigate}
        currentView={currentView}
        hidden={isMobile && (Boolean(modal.type) || aiOpen)}
      />

      <div className="app">
        <header>
          <h1 className="app-title-with-logo">
            <img src="/logo.png" alt="Rentals logo" className="app-title-logo" />
            <span>{t('appTitle')}</span>
          </h1>
        </header>

      {currentView === 'profile' ? (
        <ProfilePage />
      ) : currentView === 'aiDashboard' ? (
        <AiDashboard />
      ) : currentView === 'adminUsers' ? (
        <AdminUserManagement onClose={() => setCurrentView('buildings')} />
      ) : currentView === 'users' ? (
        <UserManagement
          onClose={() => setCurrentView('buildings')}
          onViewReport={(user) => openModal('userReport', user)}
        />
      ) : currentView === 'payout' ? (
        <PayoutReport onClose={() => setCurrentView('buildings')} />
      ) : loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">{t('loading')}</p>
        </div>
      ) : !selectedBuilding ? (
        <BuildingList
          buildings={buildings}
          onSelect={setSelectedBuilding}
          onAdd={() => openModal('building')}
          onEdit={(b) => openModal('building', b)}
          onDelete={handleDeleteBuilding}
          onReport={(b) => openModal('report', b)}
          onOwnership={(b) => openModal('ownership', b)}
          onDivision={(b) => openModal('division', b)}
          canCreateBuilding={canCreateBuilding}
          canUpdateBuilding={canUpdateBuilding}
          canDeleteBuilding={canDeleteBuilding}
          canReadReport={canReadReport}
          canManageOwnership={canManageOwnership}
        />
      ) : (
        <>
          <div className="back-btn">
            <button onClick={() => { setSelectedBuilding(null); setProperties([]); setAiOpen(false); }}>
              {isRtl ? '→' : '←'} {t('back')}
            </button>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{t('buildingNumber')}: {selectedBuilding.number}</div>
                {selectedBuilding.address && <div className="card-subtitle">{selectedBuilding.address}</div>}
              </div>
              <div className="card-actions">
                {canReadReport && (
                  <button className="btn btn-primary btn-small" onClick={() => openModal('report', selectedBuilding)}>
                    {t('report')}
                  </button>
                )}
                {canReadReport && (
                  <button className="btn btn-primary btn-small" onClick={() => openModal('division', selectedBuilding)}>
                    {t('divisionReport')}
                  </button>
                )}
                {canUpdateBuilding && (
                  <button className="btn btn-secondary btn-small" onClick={() => openModal('building', selectedBuilding)}>
                    {t('edit')}
                  </button>
                )}
              </div>
            </div>
            <div className="stats">
              <div className="stat">
                <span className="stat-value">{properties.filter(p => p.type === 'apartment').length}</span> {t('apartments')}
              </div>
              <div className="stat">
                <span className="stat-value">{properties.filter(p => p.type === 'store').length}</span> {t('stores')}
              </div>
            </div>
          </div>

          <PropertyList
            properties={properties}
            onAdd={() => openModal('property')}
            onEdit={(p) => openModal('property', p)}
            onDelete={handleDeleteProperty}
            onPayment={(p) => openModal('payment', p)}
            onHistory={(p) => openModal('history', p)}
            onReceipt={(p) => openModal('receipt', p)}
            onBlankReceipt={(p) => openModal('blankReceipt', p)}
            canCreateProperty={canCreateProperty}
            canUpdateProperty={canUpdateProperty}
            canDeleteProperty={canDeleteProperty}
            canCreatePayment={canCreatePayment}
          />

          <button className="building-ai-fab" onClick={() => setAiOpen(true)} title="Open Building Copilot" aria-label="Open Building Copilot">
            <span className="building-ai-fab-label">Building Copilot</span>
            <span className="building-ai-fab-mobile-icon">?</span>
          </button>

          <BuildingAiAssistant
            building={selectedBuilding}
            visible={aiOpen}
            onClose={() => setAiOpen(false)}
          />
        </>
      )}

      {modal.type === 'building' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{modal.data ? t('editBuilding') : t('addBuilding')}</h3>
            <BuildingForm
              building={modal.data}
              onSave={handleSaveBuilding}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'property' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{modal.data ? t('editProperty') : t('addProperty')}</h3>
            <PropertyForm
              property={modal.data}
              onSave={handleSaveProperty}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'payment' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('recordPayment')}</h3>
            <PaymentForm
              property={modal.data}
              onSave={handleSavePayment}
              onSaveBulk={handleSaveBulkPayments}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'editPayment' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('editPayment')} - {modal.data.property.unit}</h3>
            <PaymentForm
              property={modal.data.property}
              payment={modal.data.payment}
              onUpdate={handleUpdatePayment}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'history' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('paymentHistory')} - {modal.data.unit}</h3>
            <PaymentHistory
              property={modal.data}
              onClose={closeModal}
              onEdit={(payment) => openModal('editPayment', { property: modal.data, payment })}
            />
          </div>
        </div>
      )}

      {modal.type === 'report' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <Report
              building={modal.data}
              onClose={closeModal}
              canManageExpenses={hasPermission('expense@create') || hasPermission('expense@delete')}
            />
          </div>
        </div>
      )}

      {modal.type === 'receipt' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('receipt')} - {modal.data.unit}</h3>
            <Receipt
              property={modal.data}
              building={selectedBuilding}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'blankReceipt' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('blankReceipt')} - {modal.data.unit}</h3>
            <BlankReceipt
              property={modal.data}
              building={selectedBuilding}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'ownership' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal ownership-modal" onClick={e => e.stopPropagation()}>
            <h3>{t('ownership')} - {modal.data.name}</h3>
            <OwnershipSettings
              building={modal.data}
              onSave={handleSaveOwnership}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'division' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <OwnershipReport
              building={modal.data}
              onClose={closeModal}
              onViewGroupDetails={(group, groupShare, year, expenses) => {
                openModal('groupDetails', { building: modal.data, group, groupShare, year, expenses });
              }}
            />
          </div>
        </div>
      )}

      {modal.type === 'groupDetails' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <GroupDetailsReport
              group={modal.data.group}
              groupShare={modal.data.groupShare}
              year={modal.data.year}
              buildingId={modal.data.building._id}
              buildingNumber={modal.data.building.number}
              totalKirats={modal.data.building.totalKirats || 24}
              expenses={modal.data.expenses || []}
              onExpenseChange={() => {
                // Go back to division view to refresh data
                openModal('division', modal.data.building);
              }}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {modal.type === 'userReport' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <UserReport
              user={modal.data}
              onClose={closeModal}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
