# Centrika OnePortal — Project Status Report
**To:** CTO  
**From:** Selmy N. Shuti  
**Date:** 6 March 2026  
**Project:** Centrika OnePortal (Employee Workflow Management System)  
**Project Start:** January 2026  
**Target Delivery:** 25 March 2026

---

## 1. Executive Summary

The OnePortal is a web-based employee workflow platform for managing leave, car, and expenditure requests through a multi-level approval chain (Employee → HOD → HR → CEO/MD). The system features role-based dashboards, digital signature capture, email/in-app notifications, and real-time tracking. An **Asset Management** module is also planned to allow designated roles to track and manage company assets.

**Core workflow functionality is complete.** We are now in the final stretch — UI polish, asset management, reporting, and deployment — targeting **production delivery on 25 March 2026**.

---

## 2. Completed Work (January – 6 March 2026)

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Authentication system (login, signup, OTP/MFA, password reset) | ✅ Done |
| 2 | Database schema & backend API (tRPC routers for all request types) | ✅ Done |
| 3 | Leave request workflow (submission, approval chain, balance tracking) | ✅ Done |
| 4 | Car request workflow (submission + approval) | ✅ Done |
| 5 | Expenditure request workflow (submission + approval) | ✅ Done |
| 6 | Multi-level approval chain (HOD → HR → CEO/MD) with digital signatures | ✅ Done |
| 7 | Email & in-app notifications (leave approvals) | ✅ Done |
| 8 | Role-based dashboards (Employee, HOD, HR, Finance, CEO, Admin) | ✅ Done |
| 9 | Frontend/Backend decoupling into independent deployable apps | ✅ Done |
| 10 | UI standardisation — all 6 forms unified to Centrika branding | ✅ Done |
| 11 | GitLab SSH setup for deployment pipeline | ✅ Done |

---

## 3. Remaining Work & Timeline

### Sprint 1: Core Refinements (7 Mar – 12 Mar)
| Task | Deadline |
|------|----------|
| Leave balance calculations & eligibility rule refinements | 9 Mar |
| Extend notifications to car & expenditure approvals/rejections | 10 Mar |
| TypeScript error cleanup & build validation | 11 Mar |
| Dashboard data accuracy & real-time stats polish | 12 Mar |

### Sprint 2: Asset Management, Reporting & Documents (13 Mar – 18 Mar)
| Task | Deadline |
|------|----------|
| **Asset Management — backend** (DB schema, CRUD API) | 14 Mar |
| **Asset Management — frontend** (dashboard, forms, assignment view) | 16 Mar |
| PDF generation for all request types (download & print) | 17 Mar |
| Expenditure tracking dashboard & leave analytics | 18 Mar |

> **Asset Management Module Overview:**  
> A new feature allowing authorised roles (Admin, Finance) to register, track, and assign company assets (vehicles, laptops, equipment, etc.). Key capabilities:
> - **Asset registry** — add/edit/delete assets with category, serial number, purchase date, value, and condition
> - **Assignment tracking** — assign assets to employees with checkout/return dates
> - **Dashboard** — overview of total assets, assigned vs available, and assets by category
> - **Role-gated access** — only Admin and Finance roles can manage assets; employees can view their assigned assets on their profile  
>
> Implementation starts **13 March** with the database schema and backend API, followed by the frontend pages on **15–16 March**.

### Sprint 3: Admin, Testing & Deployment (19 Mar – 25 Mar)
| Task | Deadline |
|------|----------|
| System settings & leave policy configuration | 20 Mar |
| Employee directory & company calendar | 20 Mar |
| End-to-end testing of all workflows (incl. asset management) | 22 Mar |
| Staging deployment & internal UAT | 23 Mar |
| Bug fixes from UAT feedback | 24 Mar |
| **🚀 Production deployment** | **25 Mar** |

---

## 4. Technical Architecture

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Vite, TypeScript, TailwindCSS, tRPC client |
| Backend | Node.js, tRPC, PostgreSQL (Drizzle ORM) |
| File Storage | DigitalOcean Spaces (signatures, attachments) |
| Auth | Session-based with MFA (OTP) support |
| Hosting | GitLab CI/CD via `gitlab.safaribus.rw` |

---

## 5. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| SMTP credentials needed for notifications | Medium | Request from IT by 8 Mar |
| Asset management scope creep | Medium | MVP scope only (registry + assignment); advanced features in v1.1 |
| UAT feedback exceeds 1-day buffer | Medium | Prioritise critical bugs only; defer cosmetic fixes to v1.1 |

---

## 6. Post-Launch (v1.1 — April 2026)

Items deferred to post-launch to meet the 25 Mar deadline:
- Export to CSV/Excel
- Advanced budget analysis (period comparisons, forecasting)
- Asset maintenance scheduling & depreciation tracking
- Notification preferences (opt-in/out per channel)
- Performance optimisation & security audit

---

**🎯 Production-Ready Date: 25 March 2026**
