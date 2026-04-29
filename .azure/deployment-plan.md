# Azure Deployment Plan

Status: Draft

## 1. Workspace Analysis

- Mode: MODIFY existing application
- Application: Next.js 16 web application with App Router API routes
- Runtime: Node.js server runtime
- Current deployment guidance in repo: Vercel primary, Azure Static Web Apps listed but not aligned with current app shape

## 2. Requirements Snapshot

- Goal: host the existing CNX Work Permit application on Azure
- Required capabilities:
  - Next.js server rendering and API routes
  - multipart file upload handling
  - environment variable configuration for LINE and backend API integration
  - persistent outbound HTTPS access to external API and LINE services
- Unknowns to confirm:
  - Azure subscription
  - preferred region
  - production domain
  - whether uploaded files should remain on local disk or move to Azure Blob Storage

## 3. Codebase Findings

- `app/api/**` contains server-side route handlers, so this is not a static export deployment
- `app/api/upload/route.ts` uses Node filesystem writes with optional `@vercel/blob` storage
- `server.js` is a local HTTPS development server and not the production hosting model
- No existing Azure deployment assets found:
  - no `azure.yaml`
  - no `.azure` plan before this file
  - no `infra/` deployment templates

## 4. Recommended Azure Recipe

- Primary recommendation: Azure App Service for Linux running the Next.js Node app
- Reasoning:
  - supports Node-hosted Next.js app without forcing a container path first
  - simpler than Container Apps for this single web workload
  - better fit than Azure Static Web Apps because the app depends on server runtime behavior and upload APIs
- Secondary option if containerization is preferred: Azure Container Apps

## 5. Planned Architecture

- Azure Web App for the Next.js application
- App Service app settings for all required environment variables
- Optional future hardening:
  - Azure Blob Storage for uploaded files instead of local filesystem
  - Azure Key Vault for secrets
  - Application Insights for monitoring

## 6. Execution Plan

1. Confirm Azure target, subscription, and region
2. Generate Azure deployment assets for App Service
3. Adapt upload storage configuration if needed for Azure runtime constraints
4. Validate build and deployment configuration locally
5. Hand off to Azure validation workflow

## 7. Risks And Decisions

- Local filesystem uploads on App Service are possible but are not the best long-term storage pattern
- If multiple app instances are needed, uploaded files should move to Azure Blob Storage
- Existing repo deployment docs for Azure Static Web Apps should be treated as outdated for the current runtime model

## 8. Approval Needed

- Default target if not otherwise specified: Azure App Service (Linux, Node.js)
- Need user confirmation before generating Azure deployment assets