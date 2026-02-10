# FRONTEND KNOWLEDGE BASE

**Generated:** 2026-01-21 00:29 EET
**Commit:** f755c19
**Branch:** main

## OVERVIEW
React (Vite) UI with bilingual RTL/LTR support and a single large CSS file.

## STRUCTURE
```
frontend/
├── src/
│   ├── components/       # Feature UI + reports
│   ├── api/              # API client wrappers
│   ├── context/          # Language context
│   ├── i18n/             # Translation strings
│   ├── utils/            # Number formatting helpers
│   ├── App.jsx           # App state + modals
│   └── App.css           # Global styles
└── vite.config.js
```

## WHERE TO LOOK
| Task | Location | Notes |
| --- | --- | --- |
| App state + modals | frontend/src/App.jsx | Single place for modal orchestration |
| Styling | frontend/src/App.css | Global CSS, large file |
| i18n strings | frontend/src/i18n/translations.js | Arabic/English text |
| Language switching | frontend/src/context/LanguageContext.jsx | Sets dir/lang and toggles |
| API calls | frontend/src/api/index.js | Fetch wrappers for /api |
| Reports | frontend/src/components/Report.jsx | Yearly income + expenses |
| Ownership reports | frontend/src/components/OwnershipReport.jsx | Kirats division logic |

## CONVENTIONS
- All API traffic goes through `frontend/src/api/index.js` and uses `/api` paths.
- Language state is global via `LanguageProvider`; document dir/lang updated on change.
- RTL/LTR rendering depends on `isRtl` from context.
- Vite dev server proxies `/api` to `http://localhost:4001`.

## ANTI-PATTERNS (THIS PROJECT)
- Do not split styles into new files without a clear reason; current pattern is single `App.css`.
- Avoid direct DOM writes outside LanguageContext (it owns `documentElement.dir/lang`).

## NOTES
- `App.css` is very large; keep selectors consistent to avoid regressions.
- Reports components are logic-heavy; be cautious with changes to totals.
