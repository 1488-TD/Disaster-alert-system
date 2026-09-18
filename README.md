# Disaster Alert Network

A real-time disaster alert communication platform for authorities and the public.

## Included

- Public active-alert feed at the web root
- Authority console for summaries, delivery health, and recent activity
- Draft creation, editing, publishing, and delivery inspection
- PostgreSQL-backed alert persistence
- OpenAPI-generated typed client and validation schemas

## Run locally

Install dependencies with pnpm, then run the API server and web app using the workspace workflows. The API is available under /api and the web app is served at the root.

## Project layout

- artifacts/disaster-alerts — React + Vite web app
- artifacts/api-server — Express API
- lib/api-spec/openapi.yaml — API contract source
- lib/db/src/schema/alerts.ts — database schema

## Status

This is an operational prototype for coordinating verified alerts. Connect production notification gateways, official data feeds, role-based authentication, and audit controls before using it for live emergency response.
