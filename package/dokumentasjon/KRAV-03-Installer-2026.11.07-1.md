# Kravspesifikasjon 03 – Installer for Bryggedagsassistent

## Dokumentstatus

| Felt | Verdi |
|---|---|
| Modul | Installer for Node-RED-flow |
| Release | 2026.11.07-1 |
| Direkte baseline | v1.0.0-rc3.3.2 |
| Dokumenttype | Normativ kravspesifikasjon |
| Status | Samsvar med arvet skript; installerforenkling er et åpent designavvik |
| Dato | 2026-11-07 |

> Åpent designavvik: Installeren har fortsatt 16 operative CLI-valg og hjelp. Dokumentet beskriver eksisterende implementasjon, ikke godkjent sluttgrensesnitt. Se DRIFTSSTATUS.md.

## Formål og endringsgrense

Installeren validerer og bytter bare Node-REDs `flows.json` i et eksisterende Docker-/Compose-miljø. Den installerer ikke dashboard, templates, rapporter, journaler, katalogstruktur, mounts, Composefil eller tidssone. Dette er en bevisst grense, ikke manglende implementasjon.

## Faktisk kommandolinjegrensesnitt

```text
Bryggedagsassistent 2026.11.07-1 – installer Node-RED-flow

Bruk:
  ./install-brygging-2026.11.07-1.sh [--flow FLOW.json] [valg]

Valg:
  --flow FILE              Flowfil. Standard: brygging-assistent-2026.11.07-1-flow.json
  --import-dir DIR         Ekstra katalog der flowfilen kan ligge
  --data-dir DIR           Node-REDs hostkatalog for /data. Standard: /mnt/docker/nodered-brygging/data
  --backup-root DIR        Rotkatalog for installerbackup. Standard: /mnt/docker/nodered-brygging/backup
  --compose-dir DIR        Katalog med composefil. Standard: /mnt/docker
  --service NAME           Compose-service. Standard: nodered-brygging
  --container NAME         Containernavn. Standard: nodered-brygging
  --start-stop-mode MODE   auto, compose eller docker. Standard: auto
  --stability-seconds N    Kontrolltid etter oppstart, minst 15. Standard: 30
  --node-red-uid UID       Eier av ny flows.json dersom ingen gammel fil finnes
  --node-red-gid GID       Gruppe av ny flows.json dersom ingen gammel fil finnes
  --recreate               Recreate compose-containeren ved oppstart
  --dry-run                Valider og vis planlagte operasjoner
  --validate-only          Valider bare flowfilen; Docker er ikke nødvendig
  --auto-rollback          Rull tilbake flows.json dersom ettertesten feiler
  --no-auto-rollback       Behold 2026.11.07-1 og backup ved ettertestfeil (standard)
  -h, --help               Vis hjelpen

Installeren gjør bare dette:
  1. validerer 2026.11.07-1-flowen
  2. nekter installasjon mens current_state.json peker på en session
  3. stopper Node-RED
  4. sikkerhetskopierer eksisterende flows.json
  5. installerer og hash-kontrollerer ny flows.json
  6. starter og ettertester Node-RED

Den installerer eller endrer ikke Home Assistant-dashboard, templates,
rapporter, sessionjournaler, katalogstruktur, Docker-mounts, composefil eller TZ.

Installeren migrerer ikke state mellom schema. En aktiv sesjon må avsluttes eller gjenopprettes av runtime før flowbytte.
```

## Normative krav

| ID | Presist krav | Verifikasjon og akseptansekriterium |
|---|---|---|
| INS-MIL-001 | Installeren skal være Bash med `set -Eeuo pipefail`. | Statisk test og kontrollert feilinjeksjon. |
| INS-MIL-002 | Installeren skal arbeide mot en eksisterende Node-RED-container eller Compose-service; den skal ikke opprette hele Docker-miljøet. | Hjelpetekst og målmiljøtest. |
| INS-MIL-003 | Standard Node-RED hostkatalog skal være `/mnt/docker/nodered-brygging/data` og kunne overstyres med `--data-dir`. | Argumenttest og dry-run. |
| INS-MIL-004 | Stabilitetsperioden skal være et heltall på minst 15 sekunder; standard er 30. | Grenseverdier 14, 15 og 30. |
| INS-CLI-001 | Installeren skal støtte nøyaktig valgene som vises av `--help` for flow, kataloger, service/container, start/stopp, UID/GID, recreate, dry-run, validate-only og rollback. | Hjelpeteksten sammenlignes med parserens valg. |
| INS-CLI-002 | Ukjent valg eller manglende verdi skal gi ikke-null exit uten målendring. | Negativ argumenttest. |
| INS-CLI-003 | `--start-stop-mode` skal bare godta `auto`, `compose` eller `docker`. | Enumtest. |
| INS-CLI-004 | `--recreate` skal bare kunne brukes med Compose. | Konflikttest. |
| INS-CLI-005 | `--validate-only` skal validere releaseflowen uten krav om Docker og uten målendring. | Kjøres i ren utpakking. |
| INS-CLI-006 | `--dry-run` skal validere og vise planen uten å stoppe container eller skrive målfil. | Målmiljøtest med filhash før/etter. |
| INS-VAL-001 | Dersom `SHA256SUMS` finnes, skal alle oppføringer verifiseres før målendring. | Gyldig og manipulert manifest. |
| INS-VAL-002 | Flowfilen skal være en JSON-liste med unike node-ID-er og gyldige wire- og gruppereferanser. | Gyldig flow og tre målrettede ugyldige varianter. |
| INS-VAL-003 | Flowen skal ha produksjonsfanen `brygging_production` med etiketten `Brygging – Produksjonsflow` og ingen dokumentasjonsfane. | Statisk flowtest. |
| INS-VAL-004 | Flowen skal ha release-, state-, event- og templateschema-signaturene som 2026.11.07-1 krever. | Markør- og syntakstest. |
| INS-VAL-005 | Flowen skal ha nøyaktig 230 HA-entiteter: 15 sensorer, 17 knapper, 87 selecter, 48 tall og 63 tekster. | Entitetssett sammenlignes med kontrakt og baseline-manifest. |
| INS-VAL-006 | Alle Function-noder skal syntaksvalideres på verten når Node.js finnes, og alltid i containeren etter oppstart. | Vertstest og ettertest. |
| INS-VAL-007 | Installerens validatorprobe skal godta en statisk schema-1.0-template med 15×15 fasepunktplasser og avvise aktivt punkt med tomt navn. | Innebygd validate-only-probe. |
| INS-VAL-008 | Template-, dashboard- og rapportfiler i pakken skal ikke installeres eller overskrives av installeren. | Hjelpetekst, kodekontroll og filhash før/etter. |
| INS-SIK-001 | Installasjon skal avvises når `current_state.json` angir en aktiv session. | Fixtures for aktiv, manglende og inaktiv peker. |
| INS-SIK-002 | Stier, service-/containernavn og UID/GID skal valideres før containerstopp. | Ugyldige argumenter skal stoppe i preflight. |
| INS-BCK-001 | Eksisterende `flows.json` skal kopieres til en tidsstemplet backup før erstatning. | Sammenlign backuphash med førbildet. |
| INS-BCK-002 | Backupkatalogen skal ligge under eksplisitt `--backup-root` og ikke bestemmes av innhold i flowen. | Sti- og traversaltest. |
| INS-INST-001 | Node-RED skal stoppes med valgt Compose-/Docker-mekanisme før `flows.json` byttes. | Målmiljølogg og containerstatus. |
| INS-INST-002 | Ny flow skal skrives atomisk og hashkontrolleres mot kildefilen. | Etterkontroll av målhash. |
| INS-INST-003 | Eier og gruppe for eksisterende `flows.json` skal bevares; ved ny fil brukes eksplisitt UID/GID. | Målmiljøtest for begge tilfeller. |
| INS-INST-004 | Node-RED skal startes med samme valgte mekanisme; `--recreate` skal bruke Compose uten avhengigheter. | Kommando- og statuskontroll. |
| INS-ETTER-001 | Containeren skal være kjørende gjennom hele stabilitetsperioden. | Poll og ikke-null exit ved restart/stopp. |
| INS-ETTER-002 | Ettertesten skal parse faktisk `/data/flows.json`, kompilere Function-noder og kontrollere 2026.11.07-1-signaturer. | Containerprobe. |
| INS-ETTER-003 | Ettertesten skal kontrollere templatebackupvakten, oppstartsrestoremarkør og automatisk STORAGE_REFRESH uten dashboardknapp. | Eksplisitt oppstartsprobe. |
| INS-ETTER-004 | Vellykket installasjon skal rapportere aktiv flow, backupsti og verifisert status. | Installerlogg er akseptansebevis. |
| INS-RBK-001 | `--auto-rollback` skal gjenopprette førbildet når en feil oppstår etter filbyttet. | Indusert ettertestfeil og hashkontroll. |
| INS-RBK-002 | Standard `--no-auto-rollback` skal beholde ny flow og backup ved ettertestfeil, stoppe og forklare manuell videreføring. | Indusert feil uten auto-rollback. |
| INS-SEC-001 | Installeren skal ikke inneholde eller skrive passord, token eller miljøspesifikke HA-hemmeligheter. | Statisk hemmelighetsskann. |
| INS-NF-001 | Et vellykket installerskript er ikke bevis for alle 230 registrerte HA-entiteter, dashboardvisning eller langtidstabilitet. | README og akseptanseplan skal holde målmiljøporten åpen. |

## Godkjenning

`--validate-only` og pakketest må bestå før installasjon. Reell stop/start, backup, stabilitetsperiode og rollback godkjennes i målmiljø etter AKSEPTANSEPLAN-2026.11.07-1.html.
