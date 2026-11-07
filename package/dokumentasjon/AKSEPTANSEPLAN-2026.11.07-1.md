# Akseptanseplan – Bryggedagsassistent 2026.11.07-1

Dokumentet skiller byggbevis fra målmiljøbevis. Status «Gjenstår» er en åpen godkjenningsport, ikke en skjult feil.

| ID | Område | Fremgangsmåte | Akseptansekriterium | Miljø | Status |
|---|---|---|---|---|---|
| AKS-01 | Ren pakke og integritet | Pakk ut ZIP i ny katalog; kjør `sha256sum -c SHA256SUMS`, runtime-test, dokumenttest og installer `--validate-only`. | Alle exit 0; ingen fil utenfor pakken brukes. | Byggmiljø | Bestått i releasebygg |
| AKS-02 | Node-RED og 230 HA-entiteter | Installer flow; start Node-RED; sammenlign 15 sensorer og 215 kontroller med kontrakten. | Eksakt sett; ingen duplikater eller gamle entiteter. | Målmiljø | Gjenstår |
| AKS-03 | Dashboard og reconnect | Åpne alle visninger, bryt/gjenopprett HA-forbindelsen og kontroller resynk. | Ingen dashboardreparasjon; state og valg blir konsistente. | Målmiljø | Gjenstår |
| AKS-04 | Restart under brygging | Start, gå til et fasepunkt, stopp Node-RED, vent og start igjen. | Samme fase/forsøk gjenopprettes; `state_restored` viser fasepunkt og tidsposisjon; automatisk STORAGE_REFRESH er ikke knappetrykk. | Målmiljø | Gjenstår |
| AKS-05 | Rapport | Generer rapport med A→B→A, kommentarer, fasehopp, restart og timer. | RC3.3.2-layout videreføres; grå `#bfbfbf`-headere, korrekt forsøk, klokkeslett og restartlinje. | Målmiljø | Gjenstår |
| AKS-06 | Template og XLSX | Rediger generatoren, eksporter JSON, valider, last, rediger og lagre fra dashboard. | 15 faser, 225 plasser, 15 timere; deaktivert tomt punkt godtas; backup opprettes i riktig katalog. | Bygg + målmiljø | Byggrundtur bestått; live gjenstår |
| AKS-07 | Installer og rollback | Kjør dry-run, normal installasjon og indusert ettertestfeil med/uten auto-rollback. | Backup/hash/eier/start/stopp/rollback følger KRAV-03. | Målmiljø | Gjenstår |
| AKS-08 | Stabilitet | La løsning og reconnect-/lagringsbaner gå over avtalt langtidsperiode og én full bryggedag. | Ingen tap av journal, heng, ukontrollert vekst eller uvarslet feilstillstand. | Målmiljø | Gjenstår |

Resultat, dato, operatør og vedlegg skal føres inn før kandidaten promoteres til stabil release.
