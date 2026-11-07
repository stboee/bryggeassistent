# Prosjektstatus – 2026-11-07

Gjeldende første GitHub-versjon: `2026.11.07-1 – Første produksjonsutprøving`.

## Verifisert grunnlag

- Original RC3.3.2-pakke er gjenhentet og har SHA-256 som oppgitt i `release.json`.
- Originalen består 7154/7154 tekniske runtimekontroller i 159 tester og 1077/1077 dokument-/pakkekontroller i 16 tester ved ny kjøring.
- Den datobaserte flowen og dashboardet skal være identiske etter versjonsnormalisering. Alle 230 HA config-ID-er beholdes. Installer og referansetemplate har ingen funksjonsendring.
- 342 krav, 15 sensorstates, 51 toppnivåattributter, 27 strukturfelt, 15 faser × 15 redigerbare punktplasser og 15 timerplasser.
- XLSX-generatoren er kopiert byte-identisk. Dens innebygde `source_release` viser RC3.3.2 som opphav, ikke aktiv runtimeversjon.
- Faktisk datobasert teststatus og kildecommit leses fra GitHub Actions og releasevedlegget `verification.json`. Ikke oppdater denne filen med en grønn live-status uten brukerens bevis.

## Åpne forhold

| ID | Status | Neste arbeid/akseptanse |
|---|---|---|
| OPEN-001 | Installerdesign ikke ferdigstilt | 16 operative CLI-valg og hjelp er arvet. Reduksjon til normal installasjon, validate-only, eventuelt dry-run og hjelp er foreslått, ikke implementert. Avklar rollbackpolicy og fast miljømodell gjennom krav før kodeendring. Nåværende standard har ikke automatisk rollback. |
| OPEN-002 | Målmiljøakseptanse gjenstår | Dokumenter alle 230 entiteter, restart/reconnect og state_restored med fasepunkt/tid, template load/edit/save, A→B→A-rapport, timere og backup/rollback. Deretter full bryggedag og stabilitetsforløp. |
| OPEN-003 | Verifikasjonssporbarhet er delvis | Krav-ID-likhet og matriserader er kontrollert. Flere rader peker på generell modulregresjon, ikke eksakt testbevis. Dette er ikke full funksjonell kravdekning. |
| OPEN-004 | Dashboard-v2 er separat prototype | Standarddashboardet inngår. Tidligere «Sections-visning» og eget Lovelace-kort inngår ikke i denne releasen og må ikke antas installert. |

## Neste baseline

Når denne releasen er publisert, er den direkte baseline for neste endring. Original RC3.3.2 beholdes som verifisert importproveniens, ikke som en parallell, løpende produktlinje. Tidligere «RC3.3.3» er ikke et eksisterende bygg.

## Releasepolicy

Datobasert `ÅÅÅÅ.MM.DD-N`, beskrivelse i tittel og artifaktnavn. Komplett pakke med dokumentasjon, XLSX, manifest og provenance ved hver release. Nye rettelser får ny versjon; ingen skjult erstatning av publisert tag/artifakt.
