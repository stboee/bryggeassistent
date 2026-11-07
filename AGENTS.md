# Arbeidsregler – Bryggeassistent

1. Les `START-HERE.md`, `STATUS.md`, `README.md` og `release.json` før første prosjektendring. Finn faktisk main-HEAD og siste release/tag; ikke stol på en gammel chats siste svar.
2. Dette er Bryggedagsassistent, ikke Gjæringsassistent. Ikke importer arkitektur, databaser, installere, versjoner eller beslutninger fra det andre prosjektet uten et eksplisitt behov.
3. `package/` er autoritativ kilde for deploybare filer. Flow-JSON-en er foreløpig autoritativ for Function-kode. `dist/` er generert og skal ikke committes.
4. Ved første import er direkte baseline RC3.3.2 med ZIP SHA-256 i `release.json`. Etter første publisering er forrige GitHub-release direkte baseline. Ikke innfør gamle RC2.5-/RC3.2-tester som parallelle godkjenningsgrunnlag.
5. Bevar HA-entitets-ID-er, config-ID-er, schema, journalrekkefølge og replay. HA–Node-RED-grensen skal ikke endres som følge av en dashboardendring.
6. Revider relevante normative krav, tekniske kontrakter, sporbarhetsmatrise og akseptansekriterier før funksjonelle endringer. Dokumenter avvik mellom ønsket design og arvet kode; kode er ikke automatisk et godkjent krav.
7. Skill tekniske assertions, navngitte tester, funksjonell kravdekning og målmiljøakseptanse. Ingen grønne sluttstatuser uten faktisk bevis. Statisk analyse kan ikke bevise alle dynamiske dataflyter.
8. Oppdater `STATUS.md`, onboarding og releasebeskrivelse ved materielle endringer. Komplett dokumentasjon og makrofri XLSX-generator skal følge hver release.
9. Kjør `python3 scripts/verify.py` og bygg/test fra ren utpakking. Bevar baseline-tester; legg målrettede regresjonstester til når et krav endres. Registrer hva som ikke er kjørt.
10. Datoformat er `ÅÅÅÅ.MM.DD-N`. Publiserte tags og releaseartifakter er immutable. Endre aldri en allerede publisert tag for å skjule en rettelse.
11. Direkte main-publisering er brukerens valgte arbeidsform for denne importen. Senere mutasjoner og releaser må være innen gjeldende bestilling. Ingen force-push, sletting eller omgåelse av beskyttelse. Ved auth-/rettighetsfeil: stopp og rapporter.
12. Ingen hemmeligheter eller reelle driftsdata i Git. Ikke reparer eller repurpose credentials fra et annet prosjekt. Bruk konfigurert, oppgaverelevant tilgang.
