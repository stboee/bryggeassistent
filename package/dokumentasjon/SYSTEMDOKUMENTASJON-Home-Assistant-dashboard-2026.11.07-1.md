# Systemdokumentasjon – Home Assistant-dashboard 2026.11.07-1

## Status

Beskrivende moduldokument. Normative krav ligger i KRAV-02-Home-Assistant-dashboard-og-rapport-2026.11.07-1.html og grensekontrakten.

## Leveranse og ressurs

Dashboardet leveres som `brygging-dashboard-2026.11.07-1.yaml`. Eventuelt eget Lovelace-kort skal registreres som separat HA-ressurs fra `/local/brygging/...`; Node-RED-mountet `/data/brewing-assistant/ha-public` peker til vertskatalogen `/mnt/docker/homeassistant/www/brygging`.

## Grensesnitt

Dashboard-YAML-en refererer til 230 unike Bryggedagsassistent-entiteter. Hele settet finnes i flowen. Sensorstates og strukturerte attributter er ferdig norsk visning fra Node-RED; dashboardet skal bare presentere og sortere etter dokumenterte regler.

## Prototypevisninger

Dashboard-v2-prototypen med parallelle faseeditorer er ikke del av denne releasen. Standarddashboardet videreføres uendret fra RC3.3.2. De endrer ikke Node-RED-grensesnittet og skal bruke de samme permanente editorentitetene. Stor skjerm er primært mål for tabell-/sections-variantene.

## Feil- og transporttilstander

`unknown` og `unavailable` skal gi tydelig utilgjengelighetsvisning. `checks_json` dekodes, men statusverdier som `Feil`, `Advarsel`, `OK` og `Informasjon` skal ikke oversettes eller repareres.

## Rapport

Dashboardet åpner Node-REDs publiserte rapport-URL-er. Rapportens egen HTML-renderer eier tabeller, farger og tidsformat; dashboardet skal ikke omformatere rapportinnholdet.
