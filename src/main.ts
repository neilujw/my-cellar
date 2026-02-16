import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { setupGlobalErrorHandler } from './lib/error-handler';
import { registerServiceWorker } from './lib/sw-registration';

setupGlobalErrorHandler();
registerServiceWorker();

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
