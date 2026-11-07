# Systemdokumentasjon – Installer 2026.11.07-1

## Status

Beskrivende modul- og driftsdokumentasjon. Normative krav ligger i KRAV-03-Installer-2026.11.07-1.html.

## Endringssekvens

1. Parse argumenter og finn flow/manifest.
2. Verifiser hash, JSON-struktur, Node-RED-markører, HA-entiteter og Function-syntaks.
3. Les måltilstand og avvis aktiv session.
4. Velg Compose eller Docker og kontroller målparametere.
5. Stopp Node-RED, ta backup av eksisterende `flows.json`, skriv og hashkontroller ny fil.
6. Start Node-RED og kjør stabilitets- og containerprobe.
7. Ved feil: følg valgt rollbackpolicy.

## Ikke omfattet

Installeren endrer ikke dashboard, templates, rapporter, sessionjournaler, katalogstruktur, mounts, Composefil eller tidssone. Disse leveransefilene brukes manuelt eller av runtime etter egne krav.

## Driftsbevis

Installerloggen, før-/etterhash, backupsti, containerstatus og probeutfall er akseptansebevis. `--validate-only` er mottakskontroll, ikke full installasjonsakseptanse.
