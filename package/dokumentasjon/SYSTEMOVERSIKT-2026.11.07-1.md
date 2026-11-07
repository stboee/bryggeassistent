# Systemoversikt – Bryggedagsassistent 2026.11.07-1

## Status

Beskrivende high-level systemdokumentasjon. Normative krav ligger i KRAV-00–03 og grensekontraktene.

## Systemgrense

| Modul | Ansvar | Autoritativt grensesnitt |
|---|---|---|
| Home Assistant-dashboard | Operatørvisning og kommando-/editorflate | 230 HA-entiteter |
| Node-RED | Runtime, streng validering, journal, restore, statusprojeksjon, rapport og lagring | HA-kontrakt, schema 1.0 og interne dataflyter |
| Installer | Kontrollert validering og bytte av `flows.json` | CLI, Docker/Compose og filhash |
| Templateverktøy | Offline redigering og formelstyrt JSON-generering | schema 1.0 |

## Vedvarende data

Alt applikasjonsdata ligger under `/data/brewing-assistant`: `config`, `state`, `templates`, `template-backups`, `sessions`, `reports` og `ha-public`. Sessionjournalen er autoritativt restoregrunnlag.

## Versjonsmodell

Releaseversjon er 2026.11.07-1. Direkte implementasjonsbaseline er v1.0.0-rc3.3.2. State-, event- og templateschema er fortsatt 1.0. Disse rollene skal ikke blandes.

## Dokumentasjonsnivåer

High-level beskrives her og i tre moduldokumenter. Low-level beskrives av HA-kontrakten og det genererte variabel-/dataflytinventaret. Sporbarhetsmatrisen binder krav, implementasjon, test og akseptanse sammen.
