
import React, { useState } from 'react';
import { AppView, DistrictData, DrillDownPath } from './types';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import BriefsReportsView from './components/BriefsReportsView';
import DistrictComparison from './components/DistrictComparison';
import GeographicMapView from './components/GeographicMapView';
import DistrictDetail from './components/DistrictDetail';
import ScreeningRiskView from './components/ScreeningRiskView';
import ImpactAnalyticsView from './components/ImpactAnalyticsView';
import PolicyInsightsView from './components/PolicyInsightsView';
import EscalationView from './components/EscalationView';
import ReferralHealthView from './components/ReferralHealthView';
import WorkforceOverview from './components/WorkforceOverview';
import ChildrenDirectory from './components/ChildrenDirectory';
import SettingsView from './components/SettingsView';
import { CDPODetail, MandalDetail, AWCDetail, ChildDetail } from './components/HierarchyDrillDown';
import { DISTRICT_MOCK_DATA } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Unified Drill-down Path state
  const [drillPath, setDrillPath] = useState<DrillDownPath>({});

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-black" size={32} />
          <span className="text-[14px] text-[#888] font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const currentUser = {
    name: user.name,
    role: 'State Commissioner',
    email: user.email || '',
    avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=000&color=fff&bold=true`,
  };

  const resetHierarchy = () => setDrillPath({});

  const handleDistrictSelect = (id: string) => {
    setDrillPath({ districtId: id });
    setActiveView(AppView.DISTRICTS);
  };

  const handleChildSelect = (childId: string, districtId: string) => {
    setDrillPath({
      districtId: districtId,
      cdpoId: 'c1',
      mandalId: 'm1',
      awcId: 'awc1',
      childId: childId
    });
    setActiveView(AppView.DISTRICTS);
  };

  const updatePath = (update: Partial<DrillDownPath>) => {
    setDrillPath(prev => ({ ...prev, ...update }));
  };

  const goBack = () => {
    setDrillPath(prev => {
      if (prev.childId) return { ...prev, childId: undefined };
      if (prev.awcId) return { ...prev, awcId: undefined };
      if (prev.mandalId) return { ...prev, mandalId: undefined };
      if (prev.cdpoId) return { ...prev, cdpoId: undefined };
      if (prev.districtId) return { ...prev, districtId: undefined };
      return prev;
    });
  };

  const renderContent = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return <ExecutiveDashboard />;
      case AppView.SCREENING:
        return <ScreeningRiskView />;
      case AppView.ANALYTICS:
        return <ImpactAnalyticsView />;
      case AppView.POLICY:
        return <PolicyInsightsView />;
      case AppView.ESCALATIONS:
        return <EscalationView />;
      case AppView.REFERRALS:
        return <ReferralHealthView />;
      case AppView.WORKFORCE:
        return <WorkforceOverview />;
      case AppView.CHILDREN:
        return <ChildrenDirectory onChildSelect={handleChildSelect} />;
      case AppView.MAP:
        return <GeographicMapView />;
      case AppView.BRIEFS:
        return <BriefsReportsView />;
      case AppView.SETTINGS:
        return <SettingsView />;
      case AppView.DISTRICTS:
        // Level 5: Child
        if (drillPath.childId && drillPath.awcId && drillPath.mandalId && drillPath.cdpoId && drillPath.districtId) {
          const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
          const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
          const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId);
          const awc = mandal?.awcList?.find(a => a.id === drillPath.awcId);
          const child = awc?.childrenList?.find(ch => ch.id === drillPath.childId);
          if (child) return <ChildDetail child={child} onBack={goBack} />;
        }
        // Level 4: AWC
        if (drillPath.awcId && drillPath.mandalId && drillPath.cdpoId && drillPath.districtId) {
          const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
          const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
          const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId);
          const awc = mandal?.awcList?.find(a => a.id === drillPath.awcId);
          if (awc) return <AWCDetail awc={awc} onSelectChild={(id) => updatePath({ childId: id })} onBack={goBack} />;
        }
        // Level 3: Mandal
        if (drillPath.mandalId && drillPath.cdpoId && drillPath.districtId) {
          const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
          const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
          const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId);
          if (mandal) return <MandalDetail mandal={mandal} onSelectAWC={(id) => updatePath({ awcId: id })} onBack={goBack} />;
        }
        // Level 2: CDPO
        if (drillPath.cdpoId && drillPath.districtId) {
          const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
          const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
          if (district && cdpo) return <CDPODetail district={district} cdpo={cdpo} onSelectMandal={(id) => updatePath({ mandalId: id })} onBack={goBack} />;
        }
        // Level 1: District
        if (drillPath.districtId) {
          const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
          if (district) return <DistrictDetail district={district} onSelectCDPO={(id) => updatePath({ cdpoId: id })} onBack={goBack} />;
        }
        // Level 0: Comparison
        return <DistrictComparison onDistrictSelect={handleDistrictSelect} />;

      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#888]">
            <div className="w-16 h-16 bg-[#EEE] rounded-full flex items-center justify-center mb-4">
              <span className="text-[24px] font-bold">{activeView.charAt(0)}</span>
            </div>
            <h2 className="text-[20px] font-bold text-black mb-2">{activeView}</h2>
            <p className="text-[14px]">This module view is currently under development for State Executive level.</p>
          </div>
        );
    }
  };

  // Clickable Breadcrumbs logic
  const renderBreadcrumbs = () => {
    const crumbs = [{ label: 'State', action: resetHierarchy }];

    if (activeView === AppView.DISTRICTS) {
      crumbs.push({ label: 'Districts', action: resetHierarchy });
      if (drillPath.districtId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
        crumbs.push({ label: district?.name || 'District', action: () => setDrillPath({ districtId: drillPath.districtId }) });
      }
      if (drillPath.cdpoId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
        crumbs.push({ label: cdpo?.name || 'CDPO', action: () => setDrillPath({ districtId: drillPath.districtId, cdpoId: drillPath.cdpoId }) });
      }
      if (drillPath.mandalId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
        const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId);
        crumbs.push({ label: mandal?.name || 'Mandal', action: () => setDrillPath({ districtId: drillPath.districtId, cdpoId: drillPath.cdpoId, mandalId: drillPath.mandalId }) });
      }
      if (drillPath.awcId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
        const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId);
        const awc = mandal?.awcList?.find(a => a.id === drillPath.awcId);
        crumbs.push({ label: awc?.name || 'AWC', action: () => setDrillPath({ districtId: drillPath.districtId, cdpoId: drillPath.cdpoId, mandalId: drillPath.mandalId, awcId: drillPath.awcId }) });
      }
      if (drillPath.childId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId);
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId);
        const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId);
        const awc = mandal?.awcList?.find(a => a.id === drillPath.awcId);
        const child = awc?.childrenList?.find(ch => ch.id === drillPath.childId);
        crumbs.push({ label: child?.name || 'Child', action: () => { } });
      }
    } else {
      crumbs.push({ label: activeView, action: () => { } });
    }

    return (
      <div className="flex items-center text-[13px] gap-2 ml-auto mr-8">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <button
              onClick={crumb.action}
              className={`hover:underline decoration-1 underline-offset-4 transition-all ${i === crumbs.length - 1 ? 'text-white font-bold' : 'text-[#AAAAAA]'}`}
            >
              {crumb.label}
            </button>
            {i < crumbs.length - 1 && <span className="text-[#AAAAAA] opacity-30 select-none">/</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] selection:bg-black selection:text-white">
      <nav className="fixed top-0 left-0 right-0 h-[56px] bg-black flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView(AppView.DASHBOARD)}>
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold text-black text-[14px]">J</div>
            <span className="text-white font-bold text-[14px] tracking-tight">JIVEESHA</span>
          </div>
          <div className="h-4 w-[1px] bg-[#333333]" />
          <span className="text-[#888888] text-[11px] font-bold tracking-widest uppercase">STATE COMMAND</span>
        </div>

        {renderBreadcrumbs()}

        <div className="flex items-center gap-6">
          <button className="relative text-white opacity-80 hover:opacity-100 transition-opacity">
            <span className="sr-only">Notifications</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black" />
          </button>

          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="flex flex-col items-end">
              <span className="text-[#AAAAAA] text-[12px] leading-tight">Commissioner</span>
              <span className="text-white text-[13px] font-medium leading-tight">{currentUser.name}</span>
            </div>
            <img src={currentUser.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-[#333]" />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#AAAAAA] group-hover:text-white transition-colors"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
      </nav>

      <Sidebar
        activeView={activeView}
        setActiveView={(v) => { setActiveView(v); resetHierarchy(); }}
        collapsed={sidebarCollapsed}
      />

      <main
        className={`pt-[56px] transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-[260px]'
          }`}
      >
        <div className="p-8 min-h-[calc(100vh-56px)] overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="fixed bottom-8 left-8 z-50 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {sidebarCollapsed ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
        )}
      </button>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
