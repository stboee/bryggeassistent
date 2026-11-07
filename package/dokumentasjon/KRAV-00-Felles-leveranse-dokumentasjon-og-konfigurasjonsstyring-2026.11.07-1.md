# Kravspesifikasjon 00 – Felles leveranse, dokumentasjon og konfigurasjonsstyring

## Dokumentstatus

| Felt | Verdi |
|---|---|
| System | Bryggedagsassistent |
| Omfang | Felles release-, dokument- og konfigurasjonsstyring |
| Release | 2026.11.07-1 |
| Direkte baseline | v1.0.0-rc3.3.2 |
| Dokumenttype | Normativ kravspesifikasjon |
| Status | Endelig byggegrunnlag |
| Dato | 2026-11-07 |

## Formål

Dokumentet gjør komplett, sporbar og verifiserbar dokumentasjon til en obligatorisk del av hver release. Modulkrav kan presisere, men ikke svekke, disse felles kravene.

## Normative krav

| ID | Presist krav | Verifikasjon og akseptansekriterium |
|---|---|---|
| DOC-PKG-001 | Hver komplett releasepakke skal inneholde versjonert dokumentasjon som en integrert del av leveransen. | Pakketesten skal avvise release uten dokumentasjonskatalog eller obligatoriske dokumenter. |
| DOC-PKG-002 | Alle releasefiler og normative dokumenter skal ha samme releaseversjon; schema- og baselineversjoner skal skilles eksplisitt fra releaseversjonen. | Versjonsskann skal kontrollere filnavn, titler, runtimeattributt, dashboardtittel og manifest. |
| DOC-PKG-003 | Pakkens README skal peke til den klikkbare dokumentoversikten og beskrive installerens reelle endringsgrense. | Lenken skal løses lokalt; teksten skal si at installeren bare bytter Node-RED-flow. |
| DOC-PKG-004 | Pakken skal ha én autoritativ SHA-256-fil som dekker alle andre leveransefiler. | Ren utpakking skal bestå `sha256sum -c SHA256SUMS`. |
| DOC-PKG-005 | Normative dokumentfilnavn skal ikke være merket `utkast` eller `arbeidsgrunnlag`. | Pakketesten skal avvise slike markører i dokumentfilnavn. |
| DOC-PKG-006 | Den makrofrie XLSX-templategeneratoren skal følge hver release så lenge schema 1.0-editoren inngår i produktet. | Filen skal finnes under `verktoy/templategenerator` og rundturstestes mot runtimevalidatoren. |
| DOC-HIE-001 | Dokumentoversikten skal beskrive dokumenthierarki, normativ status, modulansvar og avhengigheter. | Alle dokumentlenker skal være relative og kunne åpnes fra utpakket pakke. |
| DOC-HIE-002 | Felles dokumenter skal skilles fra dokumenter for Node-RED, Home Assistant-dashboard, installer og templateverktøy. | Dokumentmatrisen skal ha en eksplisitt modulkolonne. |
| DOC-HIE-003 | Kravdokumenter og grensekontrakter skal være normative; systemdokumentasjon, genererte inventarer og rapporter skal angi om de er beskrivende eller avledet. | Dokumentstatus skal stå i hvert dokument og kontrolleres i oversikten. |
| DOC-TRC-001 | Hvert normativt krav skal ha unik og stabil krav-ID. | Automatisk kontroll skal samle alle kravtabeller og avvise duplikater. |
| DOC-TRC-002 | Hvert krav skal finnes nøyaktig én gang i krav–implementasjon–test–akseptanse-matrisen. | ID-settet i kravdokumentene og matrisen skal være identisk. |
| DOC-TRC-003 | Tekniske assertions, navngitte tester og normative krav skal telles og rapporteres separat. | Bygge- og testdokumenter skal ikke omtale assertiontallet som funksjonelle krav. |
| DOC-TRC-004 | Hvert krav skal ha automatisert verifikasjon eller et eksplisitt målmiljøkriterium med forventet bevis. | Matrisen skal aldri bruke grønn status uten dokumentert test eller akseptanseresultat. |
| DOC-CON-001 | HA–Node-RED-kontrakten skal dekke alle 230 entiteter, 15 sensorstates, 51 toppnivåattributter og 27 felt i strukturerte listeobjekter. | Kontrakttesten skal sammenligne dokumentert sett og telling mot faktisk flow. |
| DOC-CON-002 | Kontrakten skal angi synlig navn, retning, produsent/forbruker, dashboardbruk, datatype, grenser, enum og tomtilstand der dette gjelder. | Stikkprøver er utilstrekkelige; alle entitetsrader skal ha utfylte kontraktkolonner. |
| DOC-CON-003 | Variabel- og dataflytinventaret skal genereres fra releaseflowen og bære flowens SHA-256. | Kilden i inventaret skal samsvare byte-for-byte med pakket flow. |
| DOC-SYS-001 | Systemoversikten og tre moduldokumenter skal følge pakken og peke til normative krav og kontrakter. | Dokumentoversikten skal ha fungerende lenker til alle fire systemdokumenter. |
| DOC-VER-001 | Alle lokale lenker i HTML- og Markdown-dokumenter skal løses innen releasepakken. | Automatisk lenkekontroll skal avvise manglende mål og katalogtraversering utenfor pakken. |
| DOC-VER-002 | Releasepakken skal verifiseres fra en ny utpakking uten skjulte byggekilder. | Runtime-, dokument-, manifest- og installerens validate-only-kontroll skal kjøres i den rene kopien. |
| DOC-VER-003 | Dokumentrevisjonen skal ikke endre motor- eller dashboardatferd uten et særskilt krav og regresjonstest. | Normalisert RC3.3.2→2026.11.07-1-diff skal bare vise versjonsmarkører i flow og dashboard. |

## Godkjenning

Release kan ikke godkjennes når et krav over mangler implementasjon eller kontroll. Målmiljøkriterier kan stå som åpne, men skal være synlige i akseptanseplan og sporbarhetsmatrise.
