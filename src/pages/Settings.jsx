import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import logger from '../utils/logger';
import Container from '../components/layout/Container';
import { Card, Button, Select, Switch, Icon } from '../components/ui';

export default function Settings() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      logger.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Container size="narrow" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6">
          <h1 className="font-display text-display-md text-content">{t('settings')}</h1>
          <p className="mt-1 text-body-sm text-muted">Manage your app preferences and account.</p>
        </header>

        <section className="mb-8 space-y-3">
          <h2 className="text-overline uppercase text-subtle">App preferences</h2>
          <Card padding="none" className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-control bg-surface-sunken text-muted"><Icon name={isDark ? 'themeDark' : 'themeLight'} className="size-[18px]" /></span>
                <span className="text-body-sm font-medium text-content">{t('dark_mode')}</span>
              </div>
              <Switch checked={isDark} onChange={toggleTheme} aria-label={t('dark_mode')} />
            </div>

            <div className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-control bg-surface-sunken text-muted"><Icon name="language" className="size-[18px]" /></span>
                <span className="text-body-sm font-medium text-content">{t('language')}</span>
              </div>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                options={[{ value: 'en', label: 'English' }, { value: 'bn', label: 'বাংলা' }]}
                containerClassName="w-40"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-control bg-surface-sunken text-muted"><Icon name="notifications" className="size-[18px]" /></span>
                <span className="text-body-sm font-medium text-content">{t('notifications')}</span>
              </div>
              <Switch checked={notificationsEnabled} onChange={setNotificationsEnabled} aria-label={t('notifications')} />
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-overline uppercase text-subtle">Account actions</h2>
          <Button variant="soft" fullWidth onClick={handleLogout} leftIcon={<Icon name="logout" />} className="justify-start bg-danger-subtle text-danger hover:brightness-95">
            {t('sign_out')}
          </Button>
        </section>
      </Container>
    </div>
  );
}
