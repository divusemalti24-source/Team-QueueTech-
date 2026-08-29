import React, { useState } from 'react';
import { QueueProvider, useQueue } from './context/QueueContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CitizenPortal } from './components/citizen/CitizenPortal';
import { UserDashboard } from './components/user/UserDashboard';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { WaitingRoomDisplay } from './components/display/WaitingRoomDisplay';
import { TouchKioskMode } from './components/kiosk/TouchKioskMode';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/auth/AuthModal';
import { SecuritySuiteModal } from './components/security/SecuritySuiteModal';
import { ThermalReceiptModal } from './components/common/ThermalReceiptModal';
import { PrivacyModal } from './components/common/PrivacyModal';
import { HandoverModal } from './components/common/HandoverModal';
import { OnboardOrgModal } from './components/admin/OnboardOrgModal';
import { JudgeDemoModal } from './components/demo/JudgeDemoModal';
import { QueueToken } from './types';

const MainLayout: React.FC = () => {
  const { currentView, currentOrg } = useQueue();

  // Modal control states
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [receiptToken, setReceiptToken] = useState<QueueToken | null>(null);

  const handleOpenReceipt = (token: QueueToken) => {
    setReceiptToken(token);
  };

  const handleCloseReceipt = () => {
    setReceiptToken(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Header is shown on all standard views, hidden on Fullscreen TV Display and Kiosk */}
      {currentView !== 'display' && currentView !== 'kiosk' && (
        <Header
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenOnboardModal={() => setIsOnboardModalOpen(true)}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        />
      )}

      {/* For Display or Kiosk views, provide an exit button to switch back */}
      {(currentView === 'display' || currentView === 'kiosk') && (
        <div className="fixed top-3 left-3 z-50">
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
          >
            <span>Exit Fullscreen / Open Demo</span>
          </button>
        </div>
      )}

      {/* Main View Switcher */}
      <main className="flex-1">
        {currentView === 'citizen' && (
          <CitizenPortal onOpenReceiptModal={handleOpenReceipt} />
        )}
        {currentView === 'user_dashboard' && (
          <UserDashboard onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}
        {currentView === 'staff' && (
          <StaffDashboard />
        )}
        {currentView === 'display' && (
          <WaitingRoomDisplay />
        )}
        {currentView === 'kiosk' && (
          <TouchKioskMode onOpenReceiptModal={handleOpenReceipt} />
        )}
        {currentView === 'admin' && (
          <AdminPortal
            onOpenOnboardModal={() => setIsOnboardModalOpen(true)}
            onOpenHandoverModal={() => setIsHandoverModalOpen(true)}
            onOpenSecuritySuiteModal={() => setIsSecurityModalOpen(true)}
          />
        )}
      </main>

      {/* Footer on standard views */}
      {currentView !== 'display' && currentView !== 'kiosk' && (
        <Footer
          onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          onOpenHandoverModal={() => setIsHandoverModalOpen(true)}
        />
      )}

      {/* Shared Modals */}
      <JudgeDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SecuritySuiteModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />

      <OnboardOrgModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
      />

      <ThermalReceiptModal
        token={receiptToken}
        org={currentOrg}
        isOpen={!!receiptToken}
        onClose={handleCloseReceipt}
      />

    </div>
  );
};

export default function App() {
  return (
    <QueueProvider>
      <MainLayout />
    </QueueProvider>
  );
}
