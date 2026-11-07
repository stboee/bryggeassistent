# Dokumentoversikt og dokumenthierarki – 2026.11.07-1

## Bruk

Dette er autoritativ inngang til leveransedokumentasjonen. Normative krav går foran beskrivende systemdokumentasjon. Grensekontrakter går foran eksempler. Genererte inventarer beskriver faktisk releasekilde, men endrer ikke krav alene.

## Hierarki

1. KRAV-00 gjelder hele leveransen.
2. KRAV-01, KRAV-02 og KRAV-03 gjelder hver sin modul.
3. HA–Node-RED-kontrakten og schema 1.0 er normative grensesnitt.
4. Sporbarhetsmatrisen binder krav til implementasjon, test og akseptanse.
5. Systemdokumentasjon forklarer arkitektur og drift.
6. Generert dataflytinventar er low-level kildegrunnlag for Node-RED.

## Leveransedokumenter

| Dokument | Modul | Formål | Status |
|---|---|---|---|
| [00-DOKUMENTOVERSIKT-2026.11.07-1](00-DOKUMENTOVERSIKT-2026.11.07-1.html) | Felles | Styrende inngang og dokumentmatrise | Normativ for hierarki |
| [KRAV-00-Felles-leveranse-dokumentasjon-og-konfigurasjonsstyring-2026.11.07-1](KRAV-00-Felles-leveranse-dokumentasjon-og-konfigurasjonsstyring-2026.11.07-1.html) | Felles | Felles release- og dokumentkrav | Normativ |
| [SYSTEMOVERSIKT-2026.11.07-1](SYSTEMOVERSIKT-2026.11.07-1.html) | Felles | High-level systemoversikt | Beskrivende |
| [HOME-ASSISTANT-NODE-RED-ENTITETS-OG-ATTRIBUTTKONTRAKT-2026.11.07-1](HOME-ASSISTANT-NODE-RED-ENTITETS-OG-ATTRIBUTTKONTRAKT-2026.11.07-1.html) | Felles grense | HA–Node-RED grensekontrakt | Normativ |
| [KRAV-SPORBARHET-2026.11.07-1](KRAV-SPORBARHET-2026.11.07-1.html) | Felles | Krav–implementasjon–test–akseptanse | Normativ styringsmatrise |
| [AKSEPTANSEPLAN-2026.11.07-1](AKSEPTANSEPLAN-2026.11.07-1.html) | Felles | Målmiljø- og byggeakseptanse | Normativ plan |
| [BYGGEOMFANG-2026.11.07-1](BYGGEOMFANG-2026.11.07-1.html) | Felles | Releaseomfang og avgrensning | Normativ for release |
| [KRAV-01-Node-RED-runtime-template-og-rapportgenerering-2026.11.07-1](KRAV-01-Node-RED-runtime-template-og-rapportgenerering-2026.11.07-1.html) | Node-RED | Runtime, template, rapport og lagring | Normativ |
| [SYSTEMDOKUMENTASJON-Node-RED-2026.11.07-1](SYSTEMDOKUMENTASJON-Node-RED-2026.11.07-1.html) | Node-RED | High-/low-level moduldokumentasjon | Beskrivende |
| [NODE-RED-VARIABEL-OG-DATAFLYTKONTRAKT-2026.11.07-1](NODE-RED-VARIABEL-OG-DATAFLYTKONTRAKT-2026.11.07-1.html) | Node-RED | Generert variabel- og dataflytinventar | Avledet fra flow |
| [KRAV-02-Home-Assistant-dashboard-og-rapport-2026.11.07-1](KRAV-02-Home-Assistant-dashboard-og-rapport-2026.11.07-1.html) | Dashboard | Home Assistant-dashboard og rapportforbruk | Normativ |
| [SYSTEMDOKUMENTASJON-Home-Assistant-dashboard-2026.11.07-1](SYSTEMDOKUMENTASJON-Home-Assistant-dashboard-2026.11.07-1.html) | Dashboard | Dashboardarkitektur og bruk | Beskrivende |
| [KRAV-03-Installer-2026.11.07-1](KRAV-03-Installer-2026.11.07-1.html) | Installer | Installerens faktiske endringsgrense | Normativ |
| [SYSTEMDOKUMENTASJON-Installer-2026.11.07-1](SYSTEMDOKUMENTASJON-Installer-2026.11.07-1.html) | Installer | Sekvens, backup og rollback | Beskrivende |
| [TEMPLATE-SCHEMA-OG-GENERATORVEILEDNING-2026.11.07-1](TEMPLATE-SCHEMA-OG-GENERATORVEILEDNING-2026.11.07-1.html) | Templateverktøy | Schema og XLSX-bruk | Beskrivende |

## Verktøy og rotfiler

- [XLSX-templategenerator](../verktoy/templategenerator/bryggedagsassistent-templategenerator-schema-1.0-2026.11.07-1.xlsx)
- [README](../README-bryggedagsassistent-2026.11.07-1.html)
- [Byggerapport](../BYGGERAPPORT-2026.11.07-1.html)
- [Testresultat](../testresultat-brygging-2026.11.07-1.html)
- [Dashboard-YAML](../brygging-dashboard-2026.11.07-1.yaml)
- [Node-RED-flow](../brygging-assistent-2026.11.07-1-flow.json)

JSON-inventaret `node-red-variabel-og-dataflytinventar-2026.11.07-1.json` er maskinlesbart vedlegg til dataflytkontrakten.

## GitHub-publisering og videreføring

- [Onboarding for en ny chat](NY-CHAT-ONBOARDING.md)
- [Driftsstatus og åpne avvik](DRIFTSSTATUS.md)
- [Utgivelsesnotater](RELEASE-NOTES.md)

Dette er første datobaserte publisering fra RC3.3.2. Installerforenkling og full målmiljøakseptanse er fortsatt åpne. XLSX er byte-identisk med importbaselinen; source_release i arbeidsboken er opphavsmetadata.
