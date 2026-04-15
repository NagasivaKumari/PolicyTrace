import React, { useMemo, useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  User, 
  Save, 
  Info,
  ChevronRight,
  XCircle,
  Database,
  Download
} from 'lucide-react';

import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type TabKey = 'general' | 'notifications' | 'privacy';

export const Settings = () => {
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [settings, setSettings] = useState(user?.settings || {
    notifications: {
      scan_start: true,
      audit_anchor: true,
      rule_change: true,
      weekly_digest: false
    },
    privacy: {
      public_profile: true,
      anonymous_anchoring: false
    }
  });

  // Load backend settings on mount
  useEffect(() => {
     const fetchSettings = async () => {
       try {
         const token = localStorage.getItem('blockd_token');
         const res = await axios.get(`${API_URL}/api/user/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (res.data) {
           setEmail(res.data.email || '');
         }
       } catch (err) { console.error("Failed to load settings", err); }
     };
     fetchSettings();
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
  ];

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await axios.patch(`${API_URL}/api/user/me`, { full_name: fullName });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = (category: string, key: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('blockd_token');
      
      // Sync with the new engagement API including security token
      await axios.post(`${API_URL}/api/user/settings`, { 
        email, 
        email_alerts: settings.notifications.scan_start 
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error("Save Error:", err);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing export...');
      const response = await axios.get(`${API_URL}/api/user/me/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `blockd_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  const handlePurgeHistory = async () => {
    if (!window.confirm('ARE YOU SURE? This will permanently delete all your scan history. This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/scan/history/purge`);
      toast.success('History purged successfully');
    } catch (err) {
      toast.error('Failed to purge history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageWrapper title="Settings">
        <div className="space-y-8 pb-20">
          <SectionHeader title="Settings" subtitle="Configure your account preferences and data privacy" />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="lg:w-64 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabKey)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                      ${activeTab === tab.id 
                        ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20' 
                        : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'}
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                    {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 max-w-2xl">
              {activeTab === 'general' && (
                <Card padding="lg" className="space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">General Settings</h3>
                    <p className="text-sm text-text-secondary">Update your basic account information</p>
                  </div>
                  
                  <div className="space-y-6">
                    <Input 
                      label="Full Name" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      icon={User} 
                    />
                    <Input 
                      label="Email Address" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={Bell} 
                    />
                    <Button icon={Save} loading={loading} onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <Card padding="lg" className="space-y-8">
                   <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Notifications</h3>
                    <p className="text-sm text-text-secondary">Manage how you receive compliance alerts</p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-white/5 transition-colors cursor-pointer group">
                      <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">Email me when a scan starts</span>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.scan_start} 
                        onChange={() => handleToggleSetting('notifications', 'scan_start')}
                        className="w-5 h-5 accent-purple-600 rounded-md" 
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-white/5 transition-colors cursor-pointer group">
                      <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">Email me when an audit result is anchored</span>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.audit_anchor} 
                        onChange={() => handleToggleSetting('notifications', 'audit_anchor')}
                        className="w-5 h-5 accent-purple-600 rounded-md" 
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-white/5 transition-colors cursor-pointer group">
                      <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">Notify me of major DPDP Act rule changes</span>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.rule_change} 
                        onChange={() => handleToggleSetting('notifications', 'rule_change')}
                        className="w-5 h-5 accent-purple-600 rounded-md" 
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-white/5 transition-colors cursor-pointer group">
                      <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">Weekly compliance digest</span>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.weekly_digest} 
                        onChange={() => handleToggleSetting('notifications', 'weekly_digest')}
                        className="w-5 h-5 accent-purple-600 rounded-md" 
                      />
                    </label>
                    <Button icon={Save} loading={loading} onClick={handleSaveSettings}>Update Preferences</Button>
                  </div>
                </Card>
              )}

              {activeTab === 'privacy' && (
                <Card padding="lg" className="space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Privacy & Data</h3>
                    <p className="text-sm text-text-secondary">Control your data and audit transparency</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 rounded-xl border border-border group transition-colors cursor-pointer">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-text-primary">Public Profiles</p>
                          <p className="text-xs text-text-muted">Allow others to see your anchored audits in Global Explore</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={settings.privacy.public_profile}
                          onChange={() => handleToggleSetting('privacy', 'public_profile')}
                          className="w-5 h-5 accent-purple-600" 
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 rounded-xl border border-border group transition-colors cursor-pointer">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-text-primary">Anonymous Anchoring</p>
                          <p className="text-xs text-text-muted">Hide your user ID in on-chain metadata (Algorand)</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={settings.privacy.anonymous_anchoring}
                          onChange={() => handleToggleSetting('privacy', 'anonymous_anchoring')}
                          className="w-5 h-5 accent-purple-600" 
                        />
                      </label>
                      <Button icon={Save} size="sm" loading={loading} onClick={handleSaveSettings}>Save Privacy Settings</Button>
                    </div>

                    <div className="pt-6 border-t border-border space-y-4">
                      <h4 className="text-xs font-black text-red-400 uppercase tracking-widest">Danger Zone</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="ghost" icon={Download} onClick={handleExportData} className="text-text-muted hover:text-white justify-start">Export All Data</Button>
                        <Button variant="danger" icon={XCircle} onClick={handlePurgeHistory} className="justify-start">Purge Scan History</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </AppLayout>
  );
};