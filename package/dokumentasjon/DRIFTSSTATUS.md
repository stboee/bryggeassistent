# Driftsstatus og åpne avvik – 2026.11.07-1

Denne releasen er første GitHub-publisering fra RC3.3.2, uten funksjonell motor- eller dashboardendring. Det er kontrollert produksjonsutprøving, ikke avsluttet målmiljøakseptanse.

## Åpne forhold

1. Installerforenklingen er ikke implementert. Installerens 16 operative valg og hjelp videreføres. Standard er **ikke** automatisk rollback. KRAV-03 beskriver arvet kode, ikke godkjent sluttgrensesnitt.
2. Reell Node-RED/Home Assistant, alle 230 entiteter, restart/reconnect, state_restored med fasepunkt/tid, templatelagring, rapportvisning, timere, backup/rollback og full bryggedag må dokumenteres i målmiljø.
3. 342 krav har rader i sporbarhetsmatrisen, men flere rader har generelt modulbevis. ID-likhet er ikke full funksjonell kravdekning. Ingen målmiljøport lukkes av automatiske kontrolltall.
4. Dashboard-v2 med alternative faseeditorer er en separat prototype og inngår ikke. Standarddashboardet videreføres.

## Proveniens

Original RC3.3.2 ZIP: `61f8e2655852ccf55cbb2273dc52b243d60d11ba715818cc01f12365160cd952`. Originalen ble kjørt på nytt og bestod begge lokale testsuiter. Testene i denne releasen kontrollerer ny versjon og direkte importbaseline. XLSX er kopiert uendret; innebygget source_release angir RC3.3.2 som opphav.

Oppdatert prosjektstatus og åpne issues: https://github.com/stboee/bryggeassistent

Se [onboarding](NY-CHAT-ONBOARDING.md) og den komplette dokumentoversikten før videre arbeid.
