import { bootstrapApp } from 'ugly-app/client';
import { requests } from '../shared/api';
import en from '../shared/lang/en';
import { stringsDef } from '../shared/strings';
import { RouterProvider, RouterView } from './router';
import AppShell from './components/shell/AppShell';
import './styles.css';

bootstrapApp({
  requests,
  RouterProvider,
  render: () => (
    <AppShell>
      <RouterView />
    </AppShell>
  ),
  strings: {
    defaultLang: stringsDef.defaultLang,
    langs: stringsDef.langs,
    defaultTable: en as unknown as Record<string, string>,
    loadTable: async (lang) => {
      const mod = await import(`../shared/lang/${lang}.ts`) as { default: Record<string, string> };
      return mod.default;
    },
  },
});
