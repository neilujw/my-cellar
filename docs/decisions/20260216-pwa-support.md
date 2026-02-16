# Feature: Full PWA Support

Decision made on 2026-02-16

## Feature overview
Adding Progressive Web App capabilities to My Cellar: a Service Worker for offline asset caching and a Web App Manifest for mobile installability.

## Context
The app is mobile-first and already has offline data capability via IndexedDB. However, static assets (JS, CSS, HTML) are not cached, so the app shell requires a network connection to load. Two options were considered: (1) Service Worker only for asset caching, or (2) full PWA with manifest and installability.

## Decision
Implement full PWA support with both a Service Worker (cache-first strategy for static assets) and a Web App Manifest (enabling "Add to Home Screen" and standalone display mode). This gives users a native-like mobile experience where the app loads instantly from cache and can be launched from the home screen without a browser URL bar.
