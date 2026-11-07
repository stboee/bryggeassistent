# Systemdokumentasjon – Node-RED 2026.11.07-1

## Status

Beskrivende modul- og low-level-veiviser for releaseflow med SHA-256 `93e6ba95cc1f8793222728c35d7fd5f59da006c6de979890a91ca1f9d87291f2`. Normativ funksjon ligger i KRAV-01-Node-RED-runtime-template-og-rapportgenerering-2026.11.07-1.html.

## Struktur

| Fane-ID | Etikett |
|---|---|
| `brygging_production` | Brygging – Produksjonsflow |

Releaseflowen har 907 objekter, 198 Function-noder og én versjonsnøytral produksjonsfane. Dokumentasjonsfanen er fjernet; ekstern dokumentasjon er autoritativ.

## Hovedansvar

- Initialisering, streng template-/HA-validering og runtimekommandoer.
- Én autoritativ state og append-only sessionjournal med replay.
- Fase-, fasepunkt- og timerlogikk med journalførte overganger.
- Norsk HA-projeksjon og utgangsvalidator med siste gyldige verdi.
- Atomisk skrivekø, templatebackup, rapportarkiv og systemkontroll.

## Low-level referanse

`NODE-RED-VARIABEL-OG-DATAFLYTKONTRAKT-2026.11.07-1.html` og tilhørende JSON identifiserer `msg`-felt, flow-/global-context, runtimefelt, journalhendelser, kommandoer, noder og wires. Inventaret er statisk analyse: dynamiske oppslag og rammefelt skal tolkes med oppgitt sikkerhetsnivå.

## Restore

Ved oppstart leses aktiv sessionpeker og journal. Vellykket replay journalfører én `state_restored` med restorekilde, status, fase, forsøk, forløpt fasetid og nærmeste fasepunkt/tidsavvik. Automatiske lagringskontroller bruker systemopprinnelse og skal ikke rapporteres som dashboardknapp.

## Vedlikeholdsregel

En produsert variabel skal ha mottaker eller dokumentert intern funksjon. Kandidater som statisk ser write-only ut, skal verifiseres mot dynamiske lesere og sideeffekter før fjerning.
