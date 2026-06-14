import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from './app';
import './index.css';

const root = createRoot(document.getElementById('app') as HTMLElement);
root.render(createElement(App));