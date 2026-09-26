import { useState } from 'react';
import { PageHeader } from '../components/layout/AppShell';
import { Card, Button, cx } from '../components/ui';
import { Bell, Lock, User, Globe } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'language', label: 'Language', icon: Globe },
  ];

  return (
    <div className="fp-fade-in max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences and application settings." />
      
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full shrink-0 space-y-1 md:w-64">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cx(
                'flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-surface-sunken hover:text-ink-900'
              )}
            >
              <tab.icon className={cx('h-4 w-4', activeTab === tab.id ? 'text-brand-600' : 'text-faint')} />
              {tab.label}
            </button>
          ))}
        </div>

        <Card className="flex-1 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-semibold text-ink">Personal Information</h3>
                <p className="text-sm text-muted">Update your personal details here.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink-700">First Name</label>
                  <input type="text" defaultValue="Ananya" className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink-700">Last Name</label>
                  <input type="text" defaultValue="R." className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-ink-700">Email Address</label>
                  <input type="email" defaultValue="ananya.r@example.com" className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-semibold text-ink">Language Preferences</h3>
                <p className="text-sm text-muted">Select your preferred language for the application.</p>
              </div>
              <div className="space-y-3">
                {['English', 'Hindi (हिंदी)', 'Marathi (मराठी)', 'Tamil (தமிழ்)'].map((lang, i) => (
                  <label key={lang} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 transition-colors hover:bg-surface-sunken">
                    <input type="radio" name="language" defaultChecked={i === 0} className="text-brand focus:ring-brand" />
                    <span className="text-sm font-medium text-ink-700">{lang}</span>
                  </label>
                ))}
              </div>
              <Button>Update Language</Button>
            </div>
          )}
          
          {(activeTab === 'notifications' || activeTab === 'security') && (
            <div className="flex h-40 flex-col items-center justify-center space-y-2 text-center animate-in fade-in">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken">
                <Bell className="h-6 w-6 text-faint" />
              </span>
              <h3 className="font-semibold text-ink">Coming Soon</h3>
              <p className="text-sm text-muted">This settings panel is under construction.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
