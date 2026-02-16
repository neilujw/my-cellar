# Feature: Toast Notification System

Decision made on 2026-02-16

## Feature overview
Adding a toast/snackbar notification system for transient user feedback messages across the app.

## Context
The app currently uses inline messages within components for success/error feedback (e.g., below the Add Bottle form, in Settings connection test). While the existing error handling with discriminated unions is mature, there is no unified, app-wide mechanism for transient feedback that works across view transitions.

## Decision
Add a custom toast notification system (no external dependency) with success, error, and info variants. Toasts will auto-dismiss after a configurable duration and be rendered at the app root level. Existing inline error messages within forms will remain for field-level validation; toasts are for action-level feedback (bottle added, sync completed, connection failed).
