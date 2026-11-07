# Template schema 1.0 og XLSX-generator – 2026.11.07-1

## Status

Beskrivende bruker- og verktøydokumentasjon. Normative schema-/validatorregler ligger i KRAV-01 og HA-kontrakten.

## Arbeidsbok

[Last ned XLSX-templategeneratoren](../verktoy/templategenerator/bryggedagsassistent-templategenerator-schema-1.0-2026.11.07-1.xlsx)

Arbeidsboken er makrofri og har fem faner: Forside, Faser, Fasepunkter, Timere og Template JSON. Den inneholder 15 permanente faser, 15 fasepunktplasser per fase (225 totalt) og 15 timerplasser. Deaktiverte punkt kan ha tomt navn; aktive punkt krever navn.

## Bruk

1. Rediger bare de markerte inndatafeltene og behold permanente ID-er.
2. Flytt rekkefølge med `order_id`.
3. Kontroller at alle valideringsceller viser `OK`.
4. Kopier linjene fra `Template JSON` til filnavnet på Forside som UTF-8.
5. Kjør alltid full runtimevalidering før templaten legges i `/data/brewing-assistant/templates`.

## Begrensninger

Excel-formlene gir tidlig strukturkontroll, men erstatter ikke Node-RED-validatoren. Tekst gjennom Home Assistant er begrenset til 120 eller 255 Unicode-tegn; generatoren lager ingen omvei rundt dette.
