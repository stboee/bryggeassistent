# Onboarding for en ny chat

Repository: https://github.com/stboee/bryggeassistent

Dette dokumentet er en leserekkefølge og kontrolliste, ikke en erstatning for kildefilene. Bruk gjeldende filer fra GitHub. Start med read-only inspeksjon. Det er ikke nødvendig å installere på produksjonsmaskinen for å bli onboardet.

## 1. Fastslå riktig versjon

Les `AGENTS.md`, `README.md`, `STATUS.md`, `release.json` og siste GitHub-release. Noter eksakt main-HEAD, releasetag, taggens commit og status på tilhørende workflow. Kontroller at nedlastet releaseartifakt og SHA-256 tilhører samme versjon. En tag eller grønn build er ikke i seg selv full målmiljøgodkjenning.

Første GitHub-import er `2026.11.07-1`, fra RC3.3.2 med original ZIP SHA-256 `61f8e2655852ccf55cbb2273dc52b243d60d11ba715818cc01f12365160cd952`. RC3.3.3 ble foreslått, men ikke levert. Senere chatter skal bruke siste faktiske GitHub-release som direkte baseline, ikke begynne bygging fra gammel RC-historikk.

## 2. Les dokumenthierarkiet

Åpne `package/dokumentasjon/00-DOKUMENTOVERSIKT-2026.11.07-1.md`. Les KRAV-00 og systemoversikten. Deretter leses modulens krav, grensekontrakt og systemdokumentasjon for oppgaven som skal utføres:

- Node-RED: KRAV-01, HA–Node-RED entitets-/attributtkontrakt, variabel-/dataflytkontrakt, maskinlesbart inventar og Node-RED-systemdokumentasjon.
- Dashboard: KRAV-02, HA–Node-RED-kontrakten, faktisk dashboard-YAML og dashboard-systemdokumentasjon. Grensesnittet endres ikke bare fordi presentasjonen forbedres.
- Installer: KRAV-03, selve Bash-skriptet og installer-systemdokumentasjon. Les det åpne installeravviket før kravteksten behandles som godkjent sluttgrensesnitt.
- Templateverktøy: schema-/generatorveiledning, referansetemplate, XLSX og runtimevalidator. Maks 15 faser × 15 punkter og 15 timere; aktive punkter må ha navn, deaktiverte plasser kan være tomme. HA-tekstgrensen er 255, med 120 på de feltene kontrakten angir.

Les også krav–implementasjon–test–akseptanse-matrisen og akseptanseplanen. At et krav har en matriserad betyr ikke at full funksjon er verifisert.

## 3. Undersøk faktisk kilde og testoppsett

`package/` er komplett deploybar kilde; Function-koden finnes i flow-JSON-en. `scripts/verify.py` kjører de arvede runtime- og dokumenttestene og de nye publiseringskontrollene. `scripts/build_release.py` lager deterministisk ZIP, manifest og byggerapport fra denne kilden. `.github/workflows/release.yml` tester før tag/release fra samme commit.

Installerens `--validate-only` er ikke en reell Docker-/HA-test. Lokale testresultater skal bare påstås hvis de faktisk er kjørt i denne økten. Manglende lokal autentisering skal ikke «repareres» ved å hente credentials fra andre prosjekter; bruk tilkoblet GitHub-integrasjon hvis den dekker operasjonen. Hvis en nødvendig tillatelse mangler, stopp ved den konkrete grensen.

## 4. Kontroller åpne forhold og drift

Les `STATUS.md`, `package/dokumentasjon/DRIFTSSTATUS.md` og åpne GitHub-issues. Prioritert kjent designavvik er installerforenkling. Reell HA-registrering, restart/reconnect, rapportvisning, templatearbeidsflyt, backup/rollback og full bryggedag er målmiljøakseptanse. Ikke sett dem til bestått ut fra antall automatiske kontroller.

Driftsstier: Node-RED `/mnt/docker/nodered-brygging/data:/data`; assistentdata under `/data/brewing-assistant`; delt HA-public `/mnt/docker/homeassistant/www/brygging:/data/brewing-assistant/ha-public`; tidssone `Europe/Oslo`. Ikke endre drift eller pågående brygging uten brukerens bestilling.

## 5. Avslutt onboardingen med en kort, kildebasert status

Oppgi hvilken commit/release du leste, hvilke dokumenter og moduler som er studert, teststatusens faktiske kilde, åpne avvik og foreslått neste arbeid. Skill fakta, antakelser og forslag. Ikke start en bred omskriving fordi den eldre historikken inneholder mange navn eller rester.

## Kort bestilling som kan limes i en ny chat

> Fortsett Bryggedagsassistent fra https://github.com/stboee/bryggeassistent. Les AGENTS.md og følg START-HERE.md på gjeldende main. Fastslå siste release, tag, eksakt commit og workflowstatus; les nåværende status, dokumenthierarki, relevante krav/kontrakter og åpne issues før du foreslår videre arbeid. Ikke bruk gamle samtalesammendrag som autoritativ kilde når repositoryet har nyere informasjon. Ikke bland med Gjæringsassistent. Rapporter kort hva du har verifisert og hva som gjenstår; ikke endre produksjonsmiljøet som del av onboardingen.
