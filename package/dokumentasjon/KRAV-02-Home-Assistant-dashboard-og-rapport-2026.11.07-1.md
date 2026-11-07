# Kravspesifikasjon 02 – Home Assistant-dashboard og rapporttilgang

## 1. Dokumentstatus

> **Styringsregel:** Home Assistant-modulen skal ikke godkjennes bare fordi regresjonstesten består. Hvert normativt krav skal være koblet til implementasjon, automatisert verifikasjon eller begrunnet manuell akseptanse, og faktisk resultat.

| Felt | Verdi |
|---|---|
| System | Bryggedagsassistent |
| Modul | Home Assistant-dashboard og rapporttilgang |
| Kravgrunnlag | `2026.11.07-1` med implementasjonsbaseline `v1.0.0-rc3.3.2` |
| Avhengig schema | `1.0` |
| Dokumenttype | Normativ kravspesifikasjon |
| Dokumentversjon | 2.0 |
| Dato | 2026-08-26 |
| Revisjonsstatus | Endelig normativt kravgrunnlag for 2026.11.07-1 |

Dokumentet beskriver 2026.11.07-1-målet for dashboardet som operatørens normale kommandoflate og Home Assistants tilgang til den ferdige bryggerapporten. Node-RED eier rapportmodell, HTML-generering, arkiv og public-kopi; denne modulen eier presentasjon, lenking og livssyklusavhengig tilgang.

Kravordene **skal**, **bør** og **kan** angir henholdsvis obligatorisk krav, anbefalt egenskap og tillatt mulighet. Kolonnen «Forklaring og praktisk betydning» avgrenser hvordan kravet skal forstås og avsluttes med en observerbar effekt og kontrollmåte. Denne teksten er del av fortolkningen av kravet, men oppretter ikke et ekstra krav ved siden av ID-en.

## 2. Formål og omfang

Dashboardet skal gjøre det mulig å:

- følge og styre en bryggedag uten å åpne Node-RED
- se aktiv fase, fremdrift, fasepunkter, timere, ETA og overtid
- konfigurere aktiv template i `idle`
- kontrollere systemhelse, rapportarkiv og loggarkiv
- åpne siste publiserte bryggerapport uten nettlesercache-problemer
- feilsøke alle eksponerte entiteter i en egen teknisk visning

### 2.1 Ansvarsdeling

Dashboardet er en presentasjons- og kommandoflate. Det er ikke en selvstendig bryggemotor. Ansvarsdelingen skal forstås slik:

| Del | Ansvar |
|---|---|
| Home Assistant-dashboardet | Bestemmer hvilke kort som vises, presenterer entity-state og sender knappetrykk eller redigerte felt til Companion-entitetene. |
| Home Assistant | Gjør de delte entitetene tilgjengelige for alle brukere som har tilgang, og gjør rapportfilen under `www` tilgjengelig via `/local/`. |
| Node-RED | Eier autoritativ bryggedagsstate, validerer alle kommandoer, beregner tider og status, lagrer template/state/logg og genererer rapport. |

Et synlig eller aktivt dashboardelement er derfor ikke bevis på at handlingen kan gjennomføres. Node-RED skal alltid gjøre den endelige kontrollen når kommandoen mottas.

### 2.2 Begreper

| Begrep | Betydning i dette dokumentet |
|---|---|
| Bryggedag eller sesjon | Én sammenhengende runtime fra «Start bryggedag» til `completed` eller `ended`, og fram til «Klargjør ny bryggedag». |
| Template | Den generelle prosessmalen med faser, fasepunkter, timere og template-notat. En konkret øloppskrift er ikke del av dashboardmodulen. |
| Fase | Et navngitt hovedtrinn med permanent ID, aktiv-status, rekkefølge og planlagt varighet. |
| Fasepunkt | En tidsplassert aktivitet, tilsetning, måling, kontroll eller varsel innenfor en fase. Punktet kan kreve manuell bekreftelse. |
| Hendelse/timer | En templatedrevet opptelling eller nedtelling mellom to definerte runtimehendelser. |
| Companion-entitet | En sensor, knapp, select, number eller text som Node-RED registrerer i Home Assistant gjennom websocket-integrasjonen. |
| Public-kopi | Den faste rapportfilen som Node-RED publiserer i Home Assistants `www/brygging`-katalog og som åpnes fra `/local/brygging/`. |
| Autoritativ state | Den tilstanden Node-RED har godkjent og lagret. Dashboardets lokale visning er bare en presentasjon av denne. |

### 2.3 Hvordan entity-ID-er og kravgrenser leses

Når et krav gjelder en konkret Home Assistant-entitet, skal full entity-ID stå i kravet. Når kravet gjelder en generert familie, brukes disse plassholderne:

| Plassholder | Omfang | Eksempel |
|---|---|---|
| `FF` | Permanent fase-ID `01`–`15` | `text.brygging_fase_FF_navn` betyr eksempelvis `text.brygging_fase_01_navn`. |
| `PP` | Fast fasepunkteditorplass `01`–`15` | Plassen brukes i `select`-, `text`- og `number`-familiene; runtimevisningen publiseres som én strukturert liste. |
| `button.brygging_*` | Bare når kravet gjelder alle operative knapper som klasse | Detaljkravet skal fortsatt navngi knappen når én bestemt handling omtales. |

Node-RED-dokumentet eier produksjon og validering av entity-state. Dette dokumentet eier plassering, synlighet, presentasjon og tjenestekall. To krav som beskriver hver sin side av samme entity-grensesnitt er derfor et bevisst produsent-/forbrukerpar, ikke et dobbelt funksjonskrav.

### 2.4 Felles state og flere Home Assistant-brukere

Flere brukere og nettlesere kan ha dashboardet åpent samtidig. De får ikke hver sin bryggedag eller hver sin editorkladd. Alle leser og skriver de samme HA-entitetene, og endringer blir derfor synlige på tvers av klientene.

Dette betyr ikke at systemet har flerbrukertransaksjoner. Det finnes ingen operatørlås, eier av aktiv redigering eller konfliktvarsling når to brukere sender forskjellige kommandoer samtidig. Slike kommandoer behandles av Node-RED i den rekkefølgen de mottas. Aktiv betjening må derfor koordineres, selv om samtidig visning er fullt støttet.

Følgende er utenfor modulens omfang:

- generering og lagring av rapport-HTML
- validering og persistens av template/state
- installasjon, backup og containerstyring
- automatisk varsling, fysiske knapper, brukerspesifikk bryggedagsstate, operatørlås og konfliktløsning for samtidige kommandoer
- innholdet i konkrete øloppskrifter

## 3. Overordnede brukerkrav

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-BRUK-001 | Dashboardet skal være på norsk. | Alle synlige titler, hjelpetekster, knappetekster, bekreftelser og feilmeldinger skal kunne forstås uten engelske systembegreper. Tekniske statusverdier kan fortsatt være engelske når de er en del av grensesnittet mot Node-RED.<br><br>**Observerbar effekt og kontroll:** Kontroller kravets brukerutfall i både mobil- og bred visning; handling eller informasjon skal være forståelig uten Node-RED-editoren. |
| HA-BRUK-002 | Dashboardet skal være den normale kommandoflaten for bryggedagen og skal sende alle prosesshandlinger gjennom de dokumenterte `button.brygging_*`-entitetene. | Operatøren skal ikke måtte åpne Node-RED-editoren for normal drift. Dashboardet endrer aldri runtime direkte; det kaller `button.press`, og Node-RED godkjenner eller sperrer kommandoen.<br><br>**Observerbar effekt og kontroll:** Kontroller kravets brukerutfall i både mobil- og bred visning; handling eller informasjon skal være forståelig uten Node-RED-editoren. |
| HA-BRUK-003 | Dashboardet skal være lesbart på mobil, nettbrett og bred skjerm uten horisontalt brede tabeller i hovedvisningene. | De viktigste opplysningene skal kunne leses uten sideveis rulling. Lange tekniske detaljer kan legges i egne blokker eller Teknisk-visningen.<br><br>**Observerbar effekt og kontroll:** Kontroller kravets brukerutfall i både mobil- og bred visning; handling eller informasjon skal være forståelig uten Node-RED-editoren. |
| HA-BRUK-004 | Dashboardet skal bruke Home Assistants innebygde korttyper og skal ikke kreve tredjeparts frontendkort. | Dashboardet skal fungere i en ordinær Home Assistant-installasjon uten HACS-kort eller andre frontendtillegg. Dette reduserer avhengigheter og gjør oppgraderinger enklere.<br><br>**Observerbar effekt og kontroll:** Kontroller kravets brukerutfall i både mobil- og bred visning; handling eller informasjon skal være forståelig uten Node-RED-editoren. |
| HA-BRUK-005 | Standard layout skal være responsivt masonry. Hovedkort skal være løse toppnivåkort, ikke låst i en fullbredde panel- eller trekolonne-gridvisning. | Home Assistant skal selv fordele toppnivåkortene etter tilgjengelig skjermbredde. Kortene skal ikke tvinges inn i smale, faste kolonner.<br><br>**Observerbar effekt og kontroll:** Kontroller kravets brukerutfall i både mobil- og bred visning; handling eller informasjon skal være forståelig uten Node-RED-editoren. |
| HA-BRUK-006 | På bred skjerm skal normal masonry-plassering kunne gi tre kolonner. På smal skjerm skal kortene stable naturlig. | Tre kolonner er et forventet resultat på en bred skjerm, ikke en absolutt pikselstyrt layout. På telefon skal samme kortrekkefølge bli én naturlig, vertikal strøm.<br><br>**Observerbar effekt og kontroll:** Kontroller kravets brukerutfall i både mobil- og bred visning; handling eller informasjon skal være forståelig uten Node-RED-editoren. |
| HA-BRUK-007 | Handlinger som i detaljkravene er klassifisert som destruktive eller som kan endre rapportgrunnlaget, skal ha en handlingsspesifikk bekreftelsesdialog. | Dette er en tverrgående presentasjonsregel. De konkrete kravene angir hvilke knapper som omfattes og hvilken konsekvens dialogen skal forklare; dette kravet oppretter ikke en ekstra dialog for samme knapp.<br><br>**Observerbar effekt og kontroll:** Åpne hver handling som detaljkravene klassifiserer som destruktiv; dialogen skal beskrive akkurat den handlingen, Avbryt skal sende null tjenestekall og Bekreft ett. |
| HA-BRUK-008 | Når funksjonskort skjules på grunn av livssyklus eller feil, skal dashboardet vise en forklarende tekst i stedet for et tomt område. | Operatøren skal forstå om et kort er skjult fordi bryggingen ikke er startet, er avsluttet, har feil, eller fordi entitetene ikke er tilgjengelige.<br><br>**Observerbar effekt og kontroll:** Kontroller kravets brukerutfall i både mobil- og bred visning; handling eller informasjon skal være forståelig uten Node-RED-editoren. |
| HA-BRUK-009 | Dashboardet skal presentere state fra `sensor.brygging_status` og de øvrige delte Companion-entitetene som én felles bryggedag for alle Home Assistant-klienter med tilgang. | Alle klienter leser og skriver de samme entitetene. En endring i eksempelvis `select.brygging_template` eller et knappresultat fra `button.brygging_pause` skal derfor bli synlig i de andre klientene etter Node-REDs publisering; det finnes ingen brukerspesifikk kladd.<br><br>**Observerbar effekt og kontroll:** Åpne dashboardet i to HA-klienter, endre `select.brygging_template` eller trykk `button.brygging_pause` i den ene; begge skal vise samme Node-RED-kvitterte resultat. |

## 4. Visningsstruktur

Dashboardet skal ha fire visninger i denne rekkefølgen:

| Rekkefølge | Visning | Path | Ikon | Hovedansvar |
|---:|---|---|---|---|
| 1 | Bryggedag | `bryggedag` | `mdi:beer` | Aktiv kjøring, status og rapport |
| 2 | Oppsett og template | `oppsett-template` | `mdi:tune-variant` | Template, faser, timere, system og arkiver |
| 3 | Fasepunkter | `fasepunkter` | `mdi:playlist-edit` | Redigering av inntil 15 punkter for valgt fase |
| 4 | Teknisk | `teknisk` | `mdi:tools` | Full entitetsoversikt og feilsøking |

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-STR-001 | Dashboardtittelen skal inneholde dashboardversjonen. | Tittelen gjør det mulig å se hvilken dashboardfil som faktisk er importert. Dette er nødvendig fordi Node-RED ikke kan lese versjonen på aktiv dashboard-YAML.<br><br>**Observerbar effekt og kontroll:** Parse YAML-en og åpne alle fire views; tittel, path, ikon og navigasjon skal samsvare med kontrakten. |
| HA-STR-002 | De fire visningstitlene og path-verdiene skal være stabile i 1.0-linjen. | Stabile paths gjør at bokmerker, mobilnavigasjon og dokumentasjon ikke brytes av mindre oppdateringer. Endring krever en bevisst grensesnittbeslutning.<br><br>**Observerbar effekt og kontroll:** Parse YAML-en og åpne alle fire views; tittel, path, ikon og navigasjon skal samsvare med kontrakten. |
| HA-STR-003 | Normal brukerflyt skal kunne gjennomføres i de tre første visningene. Teknisk-visningen skal ikke være nødvendig i normal drift. | Bryggedag, Oppsett og template og Fasepunkter skal dekke all ordinær bruk. Teknisk er en kontroll- og feilsøkingsflate.<br><br>**Observerbar effekt og kontroll:** Parse YAML-en og åpne alle fire views; tittel, path, ikon og navigasjon skal samsvare med kontrakten. |

### 4.1 Forventet brukerflyt

1. I `idle` velger eller redigerer operatøren template, faser, fasepunkter og timere.
2. Operatøren lagrer templaten og kontrollerer «System og arkiver».
3. «Start bryggedag» sender en forespørsel til Node-RED, som kjører en fersk start-preflight før sesjonen eventuelt starter.
4. Under aktiv brygging brukes visningen «Bryggedag» til fasebytte, kommentarer, bekreftelser, pause, timere og rapport.
5. Ved `completed` eller `ended` skjules prosesskontrollene. Operatøren genererer og kontrollerer rapporten.
6. «Klargjør ny bryggedag» nullstiller sesjonsvisningen og åpner editorene igjen.

«Teknisk» brukes bare når entity-state må kontrolleres direkte. Den skal ikke være et nødvendig trinn i normal brukerflyt.

## 5. Livssyklus og synlighet

### 5.1 Tilstander

Dashboardet skal forstå statusverdiene `idle`, `running`, `waiting_confirmation`, `waiting_event`, `paused`, `completed`, `ended`, `error`, `unknown` og `unavailable`. Norske fallbackverdier som `ukjent` og `ikke startet` skal behandles defensivt i synlighetsregler.

| Status | Praktisk betydning | Hva dashboardet skal gjøre |
|---|---|---|
| `idle` | Ingen aktiv eller avsluttet sesjon venter på rapport/nullstilling. | Vise start, template- og editorfunksjoner. Skjule aktive prosesskort. |
| `running` | Aktiv fase kjører normalt. | Vise tidslinje, fasepunkter, Pause, fasehandlinger, timere og rapporthandlinger. |
| `waiting_confirmation` | Runtime venter på en eksplisitt kvittering før prosessen kan regnes som videreført. | Beholde aktiv visning og gjøre bekreftelsesinformasjonen tydelig. |
| `waiting_event` | En eldre eller kompatibel ventestatus som fortsatt skal behandles som aktiv brygging. | Behandle statusen defensivt som aktiv og la Node-RED avgjøre gyldige kommandoer. |
| `paused` | Bryggedagen er satt på pause. | Vise Fortsett i stedet for Pause. Øvrige tider og timere presenteres etter Node-REDs pauseberegning. |
| `completed` | Alle aktive faser er fullført normalt. | Skjule operative prosesskort og vise rapport/nullstilling for avsluttet sesjon. |
| `ended` | Operatøren har avsluttet bryggedagen før normal fullføring. | Behandle sesjonen som avsluttet, men bevare logg og rapportgrunnlag. |
| `error` | Node-RED har satt runtime i feiltilstand. | Skjule handlinger som kan forverre tilstanden og vise vei til Systemkontroll/Teknisk. |
| `unknown`, `unavailable`, `ukjent`, `ikke startet` | Home Assistant mangler en pålitelig status, ofte under oppstart eller reconnect. | Bruke sikker tomtilstand og ikke anta at brygging kan startes eller styres. |

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-LIV-001 | Kortene for aktiv bryggedag skal vises når `sensor.brygging_status` er `running`, `waiting_confirmation`, `waiting_event` eller `paused`. | Disse fire sensorverdiene betyr at samme sesjon fortsatt pågår. Verdien avgjør blant annet om `button.brygging_pause` eller `button.brygging_fortsett` presenteres.<br><br>**Observerbar effekt og kontroll:** Sett `sensor.brygging_status` til hver relevant normal- og fallbackverdi og verifiser at bare de avtalte kortene og knappene er synlige. |
| HA-LIV-002 | Når `sensor.brygging_status` er `idle`, skal aktive prosesskort skjules, mens `button.brygging_start` og templateeditorene skal vises når deres øvrige betingelser er oppfylt. | Operatøren skal se oppsett og startmulighet før sesjonen finnes, men ikke en tidslinje eller punktliste basert på gamle prosessdata.<br><br>**Observerbar effekt og kontroll:** Sett `sensor.brygging_status` til hver relevant normal- og fallbackverdi og verifiser at bare de avtalte kortene og knappene er synlige. |
| HA-LIV-003 | Når `sensor.brygging_status` er `completed` eller `ended`, skal aktive prosesskort skjules og ett sluttkort vise status, `sensor.brygging_aktiv_template`, rapportlenke, `button.brygging_generer_rapport` og `button.brygging_klargjor_ny_bryggedag`. | Prosesskommandoer fjernes, mens rapportering og kontrollert overgang til neste bryggedag beholdes.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-LIV-004 | Når `sensor.brygging_status` er `error`, `unknown`, `unavailable`, `ukjent` eller `ikke startet`, skal operative kort skjules og erstattes med forklaring og henvisning til `sensor.brygging_systemkontroll` eller Teknisk-visningen. | Manglende eller ugyldig livssyklusverdi skal gi en sikker tomtilstand. Dashboardet skal ikke vise gamle knapper eller data som om runtime var under kontroll.<br><br>**Observerbar effekt og kontroll:** Sett `sensor.brygging_status` til hver relevant normal- og fallbackverdi og verifiser at bare de avtalte kortene og knappene er synlige. |
| HA-LIV-005 | Template-, fase-, fasepunkt- og timereditorene skal bare vises når `sensor.brygging_status` er `idle`. | Synlighetsregelen gjelder alle editorfamiliene, blant annet `select.brygging_template`, `text.brygging_fase_FF_navn`, `select.brygging_rediger_fase` og `select.brygging_rediger_timer`.<br><br>**Observerbar effekt og kontroll:** Sett `sensor.brygging_status` til hver relevant normal- og fallbackverdi og verifiser at bare de avtalte kortene og knappene er synlige. |
| HA-LIV-006 | Ved `completed` eller `ended` på `sensor.brygging_status` skal editorene fortsatt være skjult frem til `button.brygging_klargjor_ny_bryggedag` er godkjent av Node-RED. | En avsluttet sesjon skal beholde samme template- og rapportgrunnlag. Editorene åpnes først når nullstilling faktisk har publisert `idle`.<br><br>**Observerbar effekt og kontroll:** Sett `sensor.brygging_status` til hver relevant normal- og fallbackverdi og verifiser at bare de avtalte kortene og knappene er synlige. |
| HA-LIV-007 | Alle synlighetsregler som avhenger av en entitet, særlig `sensor.brygging_status`, skal behandle `unknown` og `unavailable` som ikke-operativ tilstand. | En kort Home Assistant-restart eller reconnect skal gi forklaring og sikre tomtilstander, ikke gjøre start-, redigerings- eller prosessknapper synlige på grunn av manglende data.<br><br>**Observerbar effekt og kontroll:** Sett `sensor.brygging_status` til hver relevant normal- og fallbackverdi og verifiser at bare de avtalte kortene og knappene er synlige. |

## 6. Visningen «Bryggedag»

### 6.1 Kortrekkefølge

Under aktiv brygging skal de tre første toppnivåkortene være:

1. Tidslinje
2. Fasepunkter
3. Tidsstyring

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-BRY-001 | De tre kortene skal være separate toppnivåkort i masonry-layouten og beholde rekkefølgen over. | Rekkefølgen følger operatørens arbeidsflyt: først helheten, deretter neste konkrete oppgaver og til slutt tidsstyring og avslutningshandlinger.<br><br>**Observerbar effekt og kontroll:** Kjør en aktiv testsekvens fra dashboardet og verifiser at kortrekkefølge og tjenestekall gir én Node-RED-kommando per handling. |
| HA-BRY-002 | Hvert operativt dashboardkort skal kalle tjenesten `button.press` mot den konkrete Companion-knappen som er angitt i det tilhørende detaljkravet og i entitetskontrakten i punkt 10. | Dashboardet skal ikke bruke lokale stateendringer, generiske serviceskript eller gamle aliaser. Entity-ID-en i YAML skal være identisk med `ha-entity-config` i releaseflowen.<br><br>**Observerbar effekt og kontroll:** Kjør en aktiv testsekvens fra dashboardet og verifiser at kortrekkefølge og tjenestekall gir én Node-RED-kommando per handling. |

### 6.2 Tidslinje

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-TL-001 | Kortet skal ha fast overskrift «Tidslinje». | Fast navn gjør kortet lett å finne igjen på tvers av skjermstørrelser og dokumentasjon.<br><br>**Observerbar effekt og kontroll:** Publiser et kontrollert tidslinjedatasett og grensetilfeller for tid/overtid; kortet skal vise nøyaktig samme rekkefølge og tall. |
| HA-TL-002 | Tidslinjekortet skal vise `button.brygging_neste_fase` og `button.brygging_tilbake` øverst; Tilbake skal kreve bekreftelsen «Gå ett steg tilbake?».  | De to knappene er fasehandlingene for aktiv sesjon. Bekreftelsen skal redusere utilsiktet omkjøring, mens Node-RED fortsatt avgjør om handlingen er gyldig.<br><br>**Observerbar effekt og kontroll:** Trykk `button.brygging_neste_fase` og prøv både Avbryt og Bekreft for `button.brygging_tilbake`; knappene skal ligge øverst, og avbrutt dialog skal ikke sende tjenestekall. |
| HA-TL-003 | Tidslinjen skal bygges dynamisk fra `phases` på `sensor.brygging_faseoversikt`. | Dashboardet skal presentere rekkefølgen og de norske statusene Node-RED publiserer, uten en egen faseberegning.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TL-004 | Tidslinjen skal vise bare objektene Node-RED publiserer i `sensor.brygging_faseoversikt.attributes.phases`, i mottatt rekkefølge. | Deaktiverte templateplasser skal ikke gjenskapes lokalt i dashboardet.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TL-005 | Hvert faseobjekt skal vise de kontraktfestede feltene `title`, `duration_min` og `status`. | Dashboardet skal ikke oversette tekniske statuskoder; Node-RED leverer norsk visningsprojeksjon.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TL-006 | Aktiv fase skal vises fra state og attributtene `planned_duration_min`, `elapsed_min`, `remaining_min`, `overtime_min` og `progress_percent` på `sensor.brygging_aktiv_fase`. | Fasefremdrift skal ha én autoritativ sensorskriver; dashboardet skal ikke kombinere parallelle enkeltsensorer.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TL-007 | Det visuelle minuttfeltet skal bygges fra de fire aktive fasesensorene i `HA-TL-006`, bruke 15 minutter per rad og markere brukt plantid blått, gjenstående plantid lyst og overtid grønt. | Feltet er en visualisering av publiserte minutter, ikke en egen klokke. Ved overtid skal grønne posisjoner legges etter planfeltet uten å endre sensordataene.<br><br>**Observerbar effekt og kontroll:** Publiser et kontrollert tidslinjedatasett og grensetilfeller for tid/overtid; kortet skal vise nøyaktig samme rekkefølge og tall. |

### 6.3 Fasepunkter

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-PKT-001 | Fasepunktkortet skal vise `button.brygging_bekreft_fasepunkt` under aktiv brygging. Node-RED skal avvise trykket kontrollert når `sensor.brygging_neste_fasepunkt` ikke angir et bekreftbart, forfalt punkt. | Knappesynlighet er ikke autorisasjon; runtimevalideringen er siste sperre.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-PKT-002 | Neste fasepunkt skal vises fra state og attributtene `phasepoint_name` og `requires_confirmation` på `sensor.brygging_neste_fasepunkt`. | Tomtilstanden `Ingen` skal bruke `null` i alle fire attributter.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-PKT-003 | Fasepunktets tidsstatus skal styres av state `Ingen`, `Kommende` eller `Forfalt`, og tiden skal hentes fra `time_until_due` på `sensor.brygging_neste_fasepunkt`. | Dashboardet skal ikke beregne forfall lokalt fra veggklokken.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-PKT-004 | Kortet skal vise inntil 15 kronologiske objekter fra `sensor.brygging_fasepunktoversikt.attributes.phasepoints`. | En tom liste skal gi en lesbar tomtilstand; det finnes ingen separate fasepunktsensorer i 2026.11.07-1-kontrakten.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-PKT-005 | Hvert synlig fasepunktobjekt skal formidle `type`, `name`, `description`, `expected_value`, `timing`, `time_until_due`, `status` og `requires_confirmation` uten lokal kodeoversettelse. | Dashboardet skal presentere den norske Node-RED-projeksjonen direkte.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-PKT-006 | Operatøren skal velge kommentarmål i `select.brygging_fasepunkt_for_kommentar`, som skal tilby de permanente punkt-ID-ene i aktiv fase. | Node-RED løser valget til permanent `FF_PP`-ID og avviser foreldet eller ugyldig valg.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-PKT-007 | Kommentar skal skrives i `text.brygging_fasepunktkommentar`, mål velges i `select.brygging_fasepunkt_for_kommentar`, og lagring skal utløses med `button.brygging_lagre_fasepunktkommentar`. | Tekst og mål er en kladd fram til knappetrykket og skal valideres atomisk av Node-RED.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-PKT-008 | Kvitteringsblokken skal lese `sensor.brygging_siste_fasepunktkommentar` og vise sensorstate som tidspunkt samt attributtene `fase`, `fasepunkt` og `kommentar`. | Operatøren skal kunne kontrollere at riktig kommentar ble lagret på riktig punkt. `unknown`, `unavailable` og `-` skal gi teksten om at ingen kommentar er lagret i sesjonen.<br><br>**Observerbar effekt og kontroll:** Publiser punkter før og etter forfall og prøv både gyldig og ugyldig handling; visning, kvittering og Node-RED-logg skal samsvare. |

### 6.4 Tidsstyring og rapport

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-TID-001 | Tidsstyringskortet skal vise `button.brygging_pause` når `sensor.brygging_status` er aktiv og ikke `paused`, og `button.brygging_fortsett` bare når status er `paused`. | Bare den relevante pausehandlingen skal være synlig. Overgangen skal følge den publiserte statusen etter Node-REDs godkjenning og ikke endres optimistisk i dashboardet.<br><br>**Observerbar effekt og kontroll:** Test normal kjøring, pause, overtid og tom timerliste; de synlige verdiene og knappene skal følge publiserte entiteter uten lokal tidsberegning. |
| HA-TID-002 | Tidsstyringskortet skal vise `sensor.brygging_tid_til_ferdig_bryggedag` og `sensor.brygging_estimert_ferdig_bryggedag`. | Den første sensoren viser beregnet gjenstående varighet, og den andre viser forventet lokalt klokkeslett. Kortet skal ikke vise eller beregne en tredje verdi for «tid til neste hendelse».<br><br>**Observerbar effekt og kontroll:** Test normal kjøring, pause, overtid og tom timerliste; de synlige verdiene og knappene skal følge publiserte entiteter uten lokal tidsberegning. |
| HA-TID-003 | Aktiverte timere skal bygges dynamisk fra `timers` på `sensor.brygging_timeroversikt`. | Dashboardet skal ikke hardkode timerne eller parse en parallell JSON-streng.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TID-004 | Bare timerobjekter publisert i `sensor.brygging_timeroversikt.attributes.timers` skal vises; hvert objekt skal presentere `name`, `display_text` og `status`. | En tom liste skal gi en dokumentert tomtilstand uten lokal reparasjon av produsentdata.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TID-005 | Tidsstyringskortet skal vise `button.brygging_generer_rapport` og `button.brygging_avslutt` under aktiv brygging. | Rapportknappen lager et øyeblikksbilde; avslutt er forskjellig fra klargjør ny bryggedag.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TID-006 | `button.brygging_avslutt` skal ha en bekreftelsesdialog som forklarer at aktiv prosess og aktive timere stoppes, mens logg og rapportgrunnlag beholdes. | Dialogen skal beskrive konsekvensen før `button.press` sendes. Et avbrutt dialogvalg skal ikke sende noen kommando.<br><br>**Observerbar effekt og kontroll:** Åpne bekreftelsen for `button.brygging_avslutt`; Avbryt skal bevare aktiv state uten tjenestekall, mens Bekreft skal sende nøyaktig ett `button.press`. |

### 6.5 Start og avsluttet bryggedag

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-SLU-001 | Når `sensor.brygging_status` er `idle`, skal startkortet vise `button.brygging_start` sammen med en tydelig statusindikasjon basert på `sensor.brygging_systemkontroll` eller tilsvarende publisert systemstatus. | Operatøren skal se både startmuligheten og om siste kontroll antyder et problem. Knappen er likevel bare en forespørsel; fersk preflight avgjør utfallet.<br><br>**Observerbar effekt og kontroll:** Test start, fullført og manuelt avsluttet livssyklus; riktig handling skal vises og et avslag skal ikke endre dashboardets state optimistisk. |
| HA-SLU-002 | Trykk på `button.brygging_start` skal alltid sendes til Node-RED, som skal kjøre en fersk preflight og publisere resultatet gjennom `sensor.brygging_systemkontroll` og `sensor.brygging_status`. | Dashboardet skal ikke lagre et lokalt «klart»-flagg. Et gammelt grønt kontrollresultat kan vises som informasjon, men kan ikke godkjenne START.<br><br>**Observerbar effekt og kontroll:** Test start, fullført og manuelt avsluttet livssyklus; riktig handling skal vises og et avslag skal ikke endre dashboardets state optimistisk. |
| HA-SLU-003 | `button.brygging_klargjor_ny_bryggedag` skal ha en bekreftelsesdialog som minner operatøren om å generere rapport før sesjonsdata nullstilles. | Knappen skal først vises i avsluttet livssyklus og skal ikke sende kommando når dialogen avbrytes. Node-RED avgjør om nullstilling er tillatt.<br><br>**Observerbar effekt og kontroll:** Vis avsluttet sesjon og prøv begge dialogvalg for `button.brygging_klargjor_ny_bryggedag`; bare bekreftet valg skal sende tjenestekall, og dialogen skal nevne rapport før nullstilling. |

### 6.6 Hva hovedhandlingene betyr

| Handling | Forventet betydning for operatøren |
|---|---|
| Start bryggedag | Ber Node-RED kontrollere systemet på nytt og starte første aktive fase dersom alle startkritiske kontroller er bestått. Et trykk er ikke garanti for at start godtas. |
| Neste fase | Avslutter gjeldende gjennomføring og starter neste aktive fase. Ikke nådde eller ubekreftede punkter kan bli dokumentert som avvik av Node-RED. |
| Tilbake | Avslutter gjeldende gjennomføring og starter forrige aktive fase på nytt fra null. Tidligere gjennomføring og kommentarer beholdes som historikk. |
| Bekreft fasepunkt | Kvitterer det bekreftelsespunktet Node-RED anser som aktuelt. Knappen skal ikke brukes som en generell «utført»-knapp for vilkårlige punkter. |
| Pause | Fryser den pausefølsomme prosessberegningen. Timere som er konfigurert til å følge virkelig klokke kan fortsatt gå. |
| Fortsett | Avslutter pausen og lar Node-RED forskyve relevante frister med akkumulert pausetid. |
| Generer rapport | Ber Node-RED bygge en ny HTML-rapport fra gjeldende session, logg og historikk. Den erstatter public-kopien når publiseringen lykkes. |
| Avslutt | Stopper en aktiv bryggedag uten å late som alle faser ble fullført. Logg og rapportgrunnlag beholdes. |
| Klargjør ny bryggedag | Nullstiller den avsluttede sesjonsvisningen og går tilbake til `idle`. Handlingen er ikke det samme som «Avslutt». |

## 7. Visningen «Oppsett og template»

### 7.1 Lagring og templatebytte

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-TPL-001 | Første kort skal hete «Lagring og templatebytte». | Kortet skal være lett å finne og ligge før de mange fasekortene fordi templatevalg og lagringsstatus gjelder hele oppsettet.<br><br>**Observerbar effekt og kontroll:** I `idle` endres den navngitte entiteten og aktuell knapp trykkes; status, dirty-flagg, filkvittering og feilmelding skal vise det faktiske Node-RED-resultatet. |
| HA-TPL-002 | Kortet skal inneholde `button.brygging_lagre_template`, `button.brygging_oppdater_templateliste` og `button.brygging_forkast_templateendringer`. | De tre konkrete entitetene har hvert sitt ansvar: atomisk lagring, ny katalogskanning og gjenlasting av aktiv fil. De skal ikke erstattes av én tvetydig generisk templateknapp.<br><br>**Observerbar effekt og kontroll:** I `idle` endres den navngitte entiteten og aktuell knapp trykkes; status, dirty-flagg, filkvittering og feilmelding skal vise det faktiske Node-RED-resultatet. |
| HA-TPL-003 | `button.brygging_lagre_template` og `button.brygging_forkast_templateendringer` skal ha hver sin konsekvensspesifikke bekreftelsesdialog. | Lagring endrer backingfilen, mens forkasting fjerner den lokale templatekladden. `button.brygging_oppdater_templateliste` skanner bare katalogen og omfattes ikke av dette dialogkravet.<br><br>**Observerbar effekt og kontroll:** I `idle` endres den navngitte entiteten og aktuell knapp trykkes; status, dirty-flagg, filkvittering og feilmelding skal vise det faktiske Node-RED-resultatet. |
| HA-TPL-004 | `sensor.brygging_aktiv_template` skal vises i samme kort som og umiddelbart ved `select.brygging_template`. | Sensoren er kvitteringen på hva Node-RED faktisk har lastet; selectverdien er brukerens valgflate. De to skal kunne sammenholdes før et templatebytte.<br><br>**Observerbar effekt og kontroll:** I `idle` endres den navngitte entiteten og aktuell knapp trykkes; status, dirty-flagg, filkvittering og feilmelding skal vise det faktiske Node-RED-resultatet. |
| HA-TPL-005 | `select.brygging_template` skal bare inneholde templatefilnavn som Node-RED har godkjent med den strenge validatoren. | Dashboardet skal ikke parse JSON eller legge til egne alternativer. En ugyldig fil skal være fraværende fra selectlisten og forklares i system-/templatestatus.<br><br>**Observerbar effekt og kontroll:** I `idle` endres den navngitte entiteten og aktuell knapp trykkes; status, dirty-flagg, filkvittering og feilmelding skal vise det faktiske Node-RED-resultatet. |
| HA-TPL-006 | Templateblokken skal bruke state og attributtene `status`, `dirty`, `saved_at`, `validation_errors` og `validation_warnings` på `sensor.brygging_aktiv_template`. Skrivefeil skal vises gjennom `sensor.brygging_driftsmeldinger`. | Templateinformasjonen skal ha én autoritativ sensorskriver og eksplisitte tomverdier.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-TPL-007 | `text.brygging_template_notat` skal være beholdt som templatefelt. | Notatet lagres som en del av templaten og følger den til senere bryggedager. Det er ikke en kommentar til den aktive sesjonen.<br><br>**Observerbar effekt og kontroll:** I `idle` endres den navngitte entiteten og aktuell knapp trykkes; status, dirty-flagg, filkvittering og feilmelding skal vise det faktiske Node-RED-resultatet. |

### 7.2 Fasekonfigurasjon

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-FAS-001 | Visningen skal ha en introduksjon med tittelen «Fasekonfigurasjon». | Introduksjonen skal forklare at kortene er permanente plasser, og at aktiv-status og rekkefølge bestemmer hvilke faser som brukes.<br><br>**Observerbar effekt og kontroll:** Rediger første, midtre og siste faseplass og kontroller resynk av alle berørte editorentiteter og uendret permanent fase-ID. |
| HA-FAS-002 | Det skal finnes 15 separate kort «Fase 01»–«Fase 15». | De 15 kortene er fast editor-kapasitet. En template kan bruke færre ved å deaktivere de øvrige plassene.<br><br>**Observerbar effekt og kontroll:** Rediger første, midtre og siste faseplass og kontroller resynk av alle berørte editorentiteter og uendret permanent fase-ID. |
| HA-FAS-003 | Hvert fasekort `FF=01`–`15` skal vise `text.brygging_fase_FF_navn`, `number.brygging_fase_FF_varighet_min`, `select.brygging_fase_FF_status` og `number.brygging_fase_FF_rekkefolge`. | De fire entitetene er hele faseeditoren: navn, planlagt tid, aktiv/deaktivert og ønsket plassering. Ingen av feltene skal erstattes av lokal YAML-state.<br><br>**Observerbar effekt og kontroll:** Rediger første, midtre og siste faseplass og kontroller resynk av alle berørte editorentiteter og uendret permanent fase-ID. |
| HA-FAS-004 | Endring i `number.brygging_fase_FF_rekkefolge` skal kunne flytte fasen uten å endre den permanente fase-ID-en `FF` eller entity-ID-ene i samme fasekort. | Etter Node-REDs reindeksering skal alle 15 rekkefølgefeltene resynkroniseres. Timere, historikk og punkt-ID-er skal fortsatt referere samme fase.<br><br>**Observerbar effekt og kontroll:** Rediger første, midtre og siste faseplass og kontroller resynk av alle berørte editorentiteter og uendret permanent fase-ID. |
| HA-FAS-005 | Kortene skal stå som løse masonry-kort og ikke i en tvungen bred tabell. | Hvert fasekort skal være lesbart på mobil. En sammenhengende 15-raders tabell ville blitt for bred og vanskelig å betjene.<br><br>**Observerbar effekt og kontroll:** Rediger første, midtre og siste faseplass og kontroller resynk av alle berørte editorentiteter og uendret permanent fase-ID. |

### 7.3 Hendelser/timere

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-HEN-001 | Det skal finnes ett kort med tittelen «Hendelser». | Alle timerfeltene samles i én editor fordi bare én timerplass redigeres om gangen.<br><br>**Observerbar effekt og kontroll:** Velg minst to timerplasser, bytt mellom dem og bruk én kladd; riktig timer skal endres og feltverdiene skal overleve full resynk. |
| HA-HEN-002 | Kortet skal forklare forskjellen på start, slutt, planlagt, faktisk, passert, bekreftet, opptelling, nedtelling og pauseoppførsel. | Hjelpeteksten skal gjøre det mulig å konfigurere en timer uten kjennskap til de interne eventnavnene. Den må særlig forklare forskjellen mellom løpende og faktisk slutt.<br><br>**Observerbar effekt og kontroll:** Velg minst to timerplasser, bytt mellom dem og bruk én kladd; riktig timer skal endres og feltverdiene skal overleve full resynk. |
| HA-HEN-003 | `select.brygging_rediger_timer` skal la operatøren velge permanent timer-ID `timer_01`–`timer_15` for den felles timereditoren. | Når valget endres, skal de øvrige timerentitetene fylles med akkurat den valgte timerens konfigurasjon, også når timeren er deaktivert.<br><br>**Observerbar effekt og kontroll:** Velg minst to timerplasser, bytt mellom dem og bruk én kladd; riktig timer skal endres og feltverdiene skal overleve full resynk. |
| HA-HEN-004 | Timereditoren skal bruke `select.brygging_timer_status`, `text.brygging_timer_navn`, `number.brygging_timer_rekkefolge`, `select.brygging_timer_retning`, `select.brygging_timer_pauseoppforsel`, start-/slutthendelse og -referanse samt de to offsetfeltene. | Alle felt skal tilhøre timeren valgt i `select.brygging_rediger_timer` og resynkroniseres ved valg og reconnect.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-HEN-005 | Hver gyldig timereditorendring skal valideres atomisk mot valgt permanent timerplass, oppdatere runtimekopien og sette `template_dirty`; det skal ikke finnes en separat `Bruk`-knapp. | Ugyldig eller foreldet editorverdi skal avvises uten delvis endring og etterfølges av autoritativ resynk.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-HEN-006 | Programmatisk resynk av `select.brygging_timer_*`, `number.brygging_timer_*` og `text.brygging_timer_navn` skal ikke tolkes som nye brukerendringer. | Etter loading eller reconnect skal feltene vise runtimeverdiene uten feedback-løkke, utilsiktet `template_dirty` eller at en annen timerkladd overskrives.<br><br>**Observerbar effekt og kontroll:** Velg minst to timerplasser, bytt mellom dem og bruk én kladd; riktig timer skal endres og feltverdiene skal overleve full resynk. |

Timerbegrepene skal forstås slik:

| Felt eller begrep | Betydning |
|---|---|
| Start | Hendelsen som oppretter timerens starttid. Det kan være bryggestart, fasehendelse eller fasepunkt. |
| Slutt | Hendelsen som oppretter timerens sluttid. For en nedtelling er dette normalt tidspunktet det telles mot. |
| Planlagt | Tidspunkt beregnet fra template og offsets, uavhengig av når operatøren faktisk utfører handlingen. |
| Faktisk | Tidspunkt registrert da en fase eller bryggedag virkelig startet eller sluttet. |
| Passert | Tidspunktet et tidsstyrt fasepunkt ble nådd av klokken. |
| Bekreftet | Tidspunktet operatøren kvitterte et bekreftelsespunkt. Dette kan avvike fra plantid. |
| Referanse | Den permanente fase- eller punkt-ID-en hendelsen gjelder. Feltet er bare relevant for hendelser som trenger en slik ID. |
| Offset | Antall minutter før eller etter den valgte hendelsen. Negativ verdi betyr før, positiv verdi betyr etter. |
| Tell opp | Viser tiden som har gått siden start. |
| Tell ned | Viser tiden som gjenstår til slutt. |
| Følg bryggepause | Timeren fryses og forskyves med akkumulert pausetid. |
| Fortsett etter klokke | Timeren følger virkelig tid selv om bryggedagen er satt på pause. |

### 7.4 System og arkiver

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-SYS-001 | `sensor.brygging_systemkontroll`, `sensor.brygging_rapportarkiv` og `sensor.brygging_sesjonsarkiv` skal presenteres i ett vertikalt hovedkort «System og arkiver». | Systemhelse og lagringsarkiver hører sammen som driftsinformasjon. Vertikal stabling gjør at detaljene kan leses på telefon.<br><br>**Observerbar effekt og kontroll:** Åpne Oppsett-visningen på mobil og bred skjerm; data fra de tre navngitte arkiv-/kontrollsensorene skal stå i samme vertikale hovedkort og forbli lesbare uten sideveis rulling. |
| HA-SYS-002 | `button.brygging_oppdater_systemkontroll` skal utløse en ny systemkontroll og oppdatere `sensor.brygging_systemkontroll`, `sensor.brygging_rapportarkiv` og `sensor.brygging_sesjonsarkiv`. | Et knappetrykk skal gi et nytt `checked_at` og nye observerte resultater, ikke bare rendere forrige JSON på nytt.<br><br>**Observerbar effekt og kontroll:** Kjør manuell systemkontroll og en relevant arkivhandling; sensorens tidsstempel, detaljer og summer skal oppdateres og vises uten dobbelttelling. |
| HA-SYS-003 | Systemoversikten skal lese state og attributtene `start_summary`, `checked_at`, `ok_count`, `warning_count` og `error_count` fra `sensor.brygging_systemkontroll`. | Operatøren skal kunne se samlet helse, om start er tillatt og om resultatet er ferskt før detaljlisten leses.<br><br>**Observerbar effekt og kontroll:** Kjør manuell systemkontroll og en relevant arkivhandling; sensorens tidsstempel, detaljer og summer skal oppdateres og vises uten dobbelttelling. |
| HA-SYS-004 | Elementer med `status=Feil` eller `Advarsel` i `checks_json` på `sensor.brygging_systemkontroll` skal vises før øvrige kontrollelementer. | Prioriteringen skal bare endre presentasjonsrekkefølgen. Innhold, status og `blocks_start` fra Node-RED skal beholdes.<br><br>**Observerbar effekt og kontroll:** Kjør manuell systemkontroll og en relevant arkivhandling; sensorens tidsstempel, detaljer og summer skal oppdateres og vises uten dobbelttelling. |
| HA-SYS-005 | Hvert element i `checks_json` på `sensor.brygging_systemkontroll` skal vises som en vertikal blokk med `method`, `target`, `result`, `conclusion` og eventuelt `remediation`. | Dashboardet skal gjøre hvert testresultat lesbart på mobil og forklare både hva som ble prøvd og hva operatøren bør gjøre. Det skal ikke bygges en bred resultattabell.<br><br>**Observerbar effekt og kontroll:** Kjør manuell systemkontroll og en relevant arkivhandling; sensorens tidsstempel, detaljer og summer skal oppdateres og vises uten dobbelttelling. |
| HA-SYS-006 | Rapportarkivet skal lese de ti kontraktfestede attributtene på `sensor.brygging_rapportarkiv` og vise separate ordinære og historiske summer, URL-er og public-kopistatus. | Dashboardet skal bruke ferdige URL-er fra Node-RED og skal ikke bygge cacheversjon eller filklassifisering selv.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-SYS-007 | `button.brygging_behold_siste_100_rapporter` skal kreve bekreftelse som sier at eldre rapporter slettes permanent og bare de 100 nyeste beholdes. | Avbrutt dialog skal ikke sende `button.press`. Etter utføring skal `sensor.brygging_rapportarkiv` vise nytt antall og størrelse.<br><br>**Observerbar effekt og kontroll:** Kjør manuell systemkontroll og en relevant arkivhandling; sensorens tidsstempel, detaljer og summer skal oppdateres og vises uten dobbelttelling. |
| HA-SYS-008 | Loggarkivet skal lese `total_count`, `total_size`, `active_count`, `completed_count`, `ended_count`, `unfinished_count` og `unclassified_count` fra `sensor.brygging_sesjonsarkiv`. | Kategoriene skal vises separat og ikke summeres på en måte som dobbeltteller samme JSONL-fil. Operatøren skal se hva som kan slettes før handlingen tilbys.<br><br>**Observerbar effekt og kontroll:** Kjør manuell systemkontroll og en relevant arkivhandling; sensorens tidsstempel, detaljer og summer skal oppdateres og vises uten dobbelttelling. |
| HA-SYS-009 | Teknisk-visningen skal ikke tilby generell sletting av sesjonsjournaler. Den skal vise klassifisering og summer fra `sensor.brygging_sesjonsarkiv`. | Oppbevaring og eventuell journalrydding er en separat driftsoppgave utenfor ordinær dashboardbetjening.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 8. Visningen «Fasepunkter»

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-RED-001 | Første kort skal hete «Velg fase». | Fase må velges før punktkortene tolkes. Kortet skal derfor stå først og fungere som kontekst for hele editoren.<br><br>**Observerbar effekt og kontroll:** Velg en kjent fase, rediger flere punktplasser og bruk kladden; Node-REDs template og resynk skal vise samme permanente fase og punktinnhold. |
| HA-RED-002 | `select.brygging_rediger_fase` skal velge én permanent fase `01`–`15` og laste alle 15 faste fasepunkteditorplasser for denne fasen. | En senere feltendring skal fortsatt kontrolleres mot valgt fase, slik at et foreldet eller skiftet valg ikke endrer feil fase.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RED-003 | Det skal finnes 15 separate kort «Fasepunkt 01»–«Fasepunkt 15». | De 15 kortene er maksimal editor-kapasitet for valgt fase. En template kan bruke færre aktive punkter.<br><br>**Observerbar effekt og kontroll:** Velg en kjent fase, rediger flere punktplasser og bruk kladden; Node-REDs template og resynk skal vise samme permanente fase og punktinnhold. |
| HA-RED-004 | Hvert punktkort `PP=01`–`15` skal bruke `select.brygging_punkt_PP_aktiv`, `_type`, `_tid_ref` og `_bekreftelse`, `text.brygging_punkt_PP_navn`, `_beskrivelse` og `_forventet` samt `number.brygging_punkt_PP_tid_min`. | De åtte entitetene beskriver ett editorpunkt. Dashboardet skal ikke generere permanent punkt-ID; Node-RED kombinerer valgt fase og punktplass til `FF_PP`.<br><br>**Observerbar effekt og kontroll:** Velg en kjent fase, rediger flere punktplasser og bruk kladden; Node-REDs template og resynk skal vise samme permanente fase og punktinnhold. |
| HA-RED-005 | Tomt fasepunktnavn skal godtas bare når den aktuelle editorplassen er `Deaktivert`; `Aktiv` med tomt navn skal avvises atomisk. | Dette gjør alle 15 statiske Excel-generatorplasser brukbare uten å tillate navnløse runtimepunkter.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RED-006 | Hver gyldig fasepunkteditorendring skal valideres atomisk og oppdatere runtimekopien direkte; det skal ikke finnes en separat samlet `Bruk fasepunkter`-knapp. | Et avvist felt skal ikke committe andre synlige felt eller endre permanente ID-er.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RED-007 | Fasepunkteditoren skal bare vises når `sensor.brygging_status` er `idle`; andre statuser skal gi et forklaringskort. | Node-RED skal i tillegg sperre editorinput i alle andre livssyklustilstander.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RED-008 | `sensor.brygging_aktiv_template` og `select.brygging_rediger_fase` skal vises samlet over punktkortene. | Operatøren skal se både backingfil og permanent fasekontekst før Bruk-knappen trykkes, slik at feil mål oppdages visuelt.<br><br>**Observerbar effekt og kontroll:** Velg en kjent fase, rediger flere punktplasser og bruk kladden; Node-REDs template og resynk skal vise samme permanente fase og punktinnhold. |

Fasepunktfeltene skal forstås slik:

| Felt | Betydning |
|---|---|
| Aktiv | Bestemmer om editorplassen blir med som et faktisk punkt i templaten. |
| Type | Klassifiserer punktet som aktivitet, tilsetning, måling, kontroll eller varsel. Typen påvirker presentasjon og rapporttekst, men erstatter ikke navnet. |
| Navn | Kort operatørtekst, for eksempel «Mål pH» eller «Tilsett bitterhumle». Tomt navn betyr ubrukt plass. |
| Beskrivelse | Utfyllende instruksjon eller kontekst for handlingen. |
| Forventet verdi | Det planlagte resultatet eller mengden, for eksempel `5,3 pH`, `90 g` eller `78 °C`. Feltet er tekst og er ikke en automatisk måling. |
| Tidsreferanse | Angir om offset regnes fra fasestart eller faseslutt. |
| Offset | Minutter fra valgt referanse. Ved faseslutt brukes normalt negativ verdi for et punkt før slutt. |
| Bekreftelse | Angir om punktet bare passeres av klokken, eller om operatøren må kvittere det. |

## 9. Visningen «Teknisk»

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-TEK-001 | Teknisk-visningen skal inneholde domenedelte entities-kort som til sammen viser alle Companion-entitetene i releasekontrakten: `sensor`, `select`, `number`, `button` og `text`. | Det skal ikke finnes tekniske aliaser; de samme entity-ID-ene som brukes i normalvisningene, skal listes i Teknisk-visningen.<br><br>**Observerbar effekt og kontroll:** Sammenlign entity-ID-settet i Teknisk-visningen med releaseflowens `ha-entity-config`; ingen ID skal mangle eller være et gammelt alias. |
| HA-TEK-002 | Teknisk-visningen kan være tettere enn normalvisningene, men skal ikke erstatte forklarende Systemkontroll. | Rå entity-state er nyttig for feilsøking, men forklarer ikke hva som ble testet eller hva operatøren bør gjøre. Det ansvaret ligger i Systemkontroll.<br><br>**Observerbar effekt og kontroll:** Sammenlign entity-ID-settet i Teknisk-visningen med releaseflowens `ha-entity-config`; ingen ID skal mangle eller være et gammelt alias. |

## 10. Entitetskontrakt

### 10.1 Antall og familier

| Domene | Antall | Kontrakt |
|---|---:|---|
| `button` | 17 | Kjøring, template, rapport, system og arkiv |
| `number` | 48 | 30 fasefelt, 15 punkt-offset og 3 timerfelt |
| `select` | 87 | Template/fasevalg, 15 fasestatuser, 60 punktvalg, 9 timer-/historikk-/kommentarvalg |
| `sensor` | 15 | Runtime, faser, fasepunkter, timere, template, diagnostikk og arkiver |
| `text` | 63 | 15 fasenavn, 45 punktfelt, kommentar, templatenotat og timernavn |
| **Totalt** | **230** | Alle skal finnes i Node-RED og være referert i dashboardet |

### 10.2 Obligatoriske knapper

`button.brygging_avslutt`, `button.brygging_behold_siste_100_rapporter`, `button.brygging_bekreft_fasepunkt`, `button.brygging_forkast_templateendringer`, `button.brygging_fortsett`, `button.brygging_generer_historisk_rapport`, `button.brygging_generer_rapport`, `button.brygging_klargjor_ny_bryggedag`, `button.brygging_lagre_fasepunktkommentar`, `button.brygging_lagre_template`, `button.brygging_neste_fase`, `button.brygging_nodavslutt_ved_systemfeil`, `button.brygging_oppdater_systemkontroll`, `button.brygging_oppdater_templateliste`, `button.brygging_pause`, `button.brygging_start` og `button.brygging_tilbake`.

### 10.3 Sensoransvar

De 15 sensorene og deres 51 toppnivåattributter er normative i den separate entitets- og attributtkontrakten. Særlig gjelder:

- `sensor.brygging_faseoversikt.attributes.phases`
- `sensor.brygging_fasepunktoversikt.attributes.phasepoints`
- `sensor.brygging_timeroversikt.attributes.timers`
- `sensor.brygging_driftsmeldinger.attributes.messages`
- `sensor.brygging_systemkontroll.attributes.checks_json`

### 10.4 Genererte editorfamilier

`FF` og `PP` er `01`–`15`. Fasefamilien består av navn, varighet, status og rekkefølge. Fasepunktfamilien består av aktiv, type, navn, beskrivelse, forventet verdi, tidsreferanse, offset og bekreftelse. Timereditoren bruker de kontraktfestede enkeltentitetene for valgt permanent timerplass.

### 10.5 Grensesnittkonsistens

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-INT-001 | Hver konkrete `sensor.*`, `button.*`, `select.*`, `number.*` og `text.*` som dashboard-YAML refererer, skal finnes som tilsvarende `ha-entity-config` i releaseflowen. | Hele entity-ID-en, inkludert domene, skal sammenlignes automatisk.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-INT-002 | Hver av de 230 Companion-entitetene i releaseflowen skal forekomme i dashboard-YAML eller være uttrykkelig begrunnet som backend-only i entitetskontrakten. 2026.11.07-1 har ingen planlagte backend-only-entiteter. | En ekstra ubrukt eller manglende entitet skal stoppe releasegodkjenning.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-INT-003 | Dashboardet skal bruke `sensor.brygging_status` som primær livssykluskilde og lese de fire kontraktfestede versjonsattributtene uten lokale reservefelt. | Et blandet flow-/dashboardbygg skal kunne identifiseres entydig.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-INT-004 | Dashboardet skal lese templatefil, status, dirty, lagringstid, valideringsfeil og advarsler fra `sensor.brygging_aktiv_template`. | Dashboardet skal ikke gjette alternative attributtnavn eller flytte templatevalidering tilbake til statussensoren.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-INT-005 | Tidslinje, fasepunkter og timere skal lese strukturerte lister fra henholdsvis `sensor.brygging_faseoversikt`, `sensor.brygging_fasepunktoversikt` og `sensor.brygging_timeroversikt`. | Parallelle JSON-attributter og lokal kodeoversettelse skal ikke gjeninnføres.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 11. Rapporttilgang og presentasjon

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-RAP-001 | Home Assistant skal gjøre public-kopien tilgjengelig som `/local/brygging/siste-bryggerapport.html`. | URL-en tilsvarer filen `www/brygging/siste-bryggerapport.html` på Home Assistant-siden av det bekreftede mountet.<br><br>**Observerbar effekt og kontroll:** Generer to rapporter etter hverandre og åpne lenken fra alle avtalte plasseringer; siste public-kopi skal åpnes uten gammel cache. |
| HA-RAP-002 | Rapportlenker skal bruke `ordinary_latest_url` eller `historical_latest_url` fra `sensor.brygging_rapportarkiv` etter konteksten. | Alle plasseringer skal åpne samme ferdige URL som Node-RED publiserer.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RAP-003 | Dashboardet skal bruke rapportarkivets ferdige URL-er uendret; cacheversjon skal produseres av Node-RED. | En ny rapport skal gi ny URL-verdi uten at dashboardet kombinerer filnavn og mtime selv.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RAP-004 | Alle rapportlenker skal åpnes i ny fane med `target="_blank"` og `rel="noopener noreferrer"`. | Dashboardfanen skal forbli åpen, og den nye rapportfanen skal ikke få tilgang til opprinnelig vindusobjekt.<br><br>**Observerbar effekt og kontroll:** Aktiver en rapportlenke og kontroller både YAML/DOM og nettleserutfall; rapporten skal åpnes i ny fane, og lenken skal ha `noopener noreferrer`. |
| HA-RAP-005 | Når relevant rapporttall er null eller relevant `*_latest_url` er `null`, skal rapportområdet vise en forklarende tomtilstand uten lenke. | Tomtilstanden skal følge den eksplisitte kontrakten, ikke Home Assistants `unknown` som normal verdi.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RAP-006 | Rapportarkivet skal vise `ordinary_public_copy_ok` og `historical_public_copy_ok` fra `sensor.brygging_rapportarkiv`. | Dashboardet skal presentere sann/usann/ukjent status, men ikke beregne hash selv.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-RAP-007 | Dashboardet skal ikke forsøke å bygge eller endre rapportinnholdet; det skal presentere filen Node-RED har generert. | Rapportens innhold og escaping skal ha én eier. Dashboardet skal bare lenke til den ferdige filen.<br><br>**Observerbar effekt og kontroll:** Sammenlign rapportfilen på public-mountet med filen som åpnes fra dashboardet; dashboardet skal bare lenke til filen og ikke inneholde en alternativ rapportmal. |

## 12. Feilhåndtering og robusthet

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-FEIL-001 | Alle kort som leser Companion-entiteter, særlig `sensor.brygging_status`, skal håndtere `unknown`, `unavailable`, tom state og manglende attributter med dokumentert sikker fallback. | Fallback skal være bindestrek, tom liste eller forklaringskort etter datatypen. Manglende data skal aldri gjøre en operativ handling mer tilgjengelig.<br><br>**Observerbar effekt og kontroll:** Sett berørte entiteter til manglende, ugyldige og gjenopprettede verdier; dashboardet skal forbli lesbart og aldri eksponere en farligere handling. |
| HA-FEIL-002 | Dashboardet skal bruke de strukturerte listeattributtene og kontraktfestede tomverdiene direkte. Det skal ikke parse parallelle JSON-strenger eller reparere ugyldige produsentverdier. | En kontraktfeil skal stanses ved Node-REDs utgangsvalidator og vises gjennom driftsmeldinger; dashboardet skal ikke skjule feilen.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-FEIL-003 | Dashboardet skal ikke lokalt omgå Node-REDs kommandovern. En synlig knapp kan sende kommandoen, men Node-RED skal fortsatt være autoritativ for om den godtas. | Dashboardet kan redusere feiltrykk med synlighet og dialog, men bare Node-RED kjenner autoritativ state og kan godta eller avvise kommandoen.<br><br>**Observerbar effekt og kontroll:** Gjør en prosessknapp synlig i en tilstand der Node-RED skal sperre kommandoen; dashboardet kan sende forespørselen, men state skal være uendret og avslaget skal komme fra Node-RED. |
| HA-FEIL-004 | Feilstatus fra `sensor.brygging_status`, `sensor.brygging_systemkontroll` eller `sensor.brygging_driftsmeldinger` skal lede operatøren til Systemkontroll eller Teknisk-visningen med konkret forklaring. | Feilteksten skal angi kilde og tiltak, ikke bare en farge eller generell feiltekst.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| HA-FEIL-005 | Dashboardet skal forbli lesbart når Home Assistant gjenoppretter entiteter etter restart eller reconnect. | Under reconnect kan verdier kort være ukjente. Layouten skal fortsatt kunne rendres og senere fylle inn data uten manuell omlasting.<br><br>**Observerbar effekt og kontroll:** Sett berørte entiteter til manglende, ugyldige og gjenopprettede verdier; dashboardet skal forbli lesbart og aldri eksponere en farligere handling. |

## 13. Ikke-funksjonelle krav

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| HA-NF-001 | YAML-filen skal kunne importeres manuelt i Home Assistant uten egendefinerte kortressurser. | Leveransen er én YAML-fil som kan legges inn i råkonfigurasjonseditoren. Ingen separat frontendinstallasjon skal være nødvendig.<br><br>**Observerbar effekt og kontroll:** Valider YAML statisk og test minst mobil og bred nettleser; ingen skjult frontend-, nettverks- eller miljøavhengighet skal kreves. |
| HA-NF-002 | Dashboardet skal ikke inneholde hardkodet IP-adresse, vertsport eller autentiseringsdata. | YAML-en skal være flyttbar mellom miljøer som bruker samme entity-kontrakt. Tilkoblingsdetaljer og hemmeligheter hører hjemme i integrasjonene.<br><br>**Observerbar effekt og kontroll:** Valider YAML statisk og test minst mobil og bred nettleser; ingen skjult frontend-, nettverks- eller miljøavhengighet skal kreves. |
| HA-NF-003 | Korttitler, navn og entitets-ID-er skal være konsekvente med Node-RED-grensesnittet. | Samme handling skal ha samme norske navn og samme entity-ID i normalvisning, Teknisk og dokumentasjon.<br><br>**Observerbar effekt og kontroll:** Valider YAML statisk og test minst mobil og bred nettleser; ingen skjult frontend-, nettverks- eller miljøavhengighet skal kreves. |
| HA-NF-004 | Versjonen i dashboardtittelen skal samsvare med forventet dashboardversjon publisert av flowen. Denne sammenhengen må kontrolleres ved release eller installasjon fordi flowen ikke kan lese hvilken YAML som faktisk er aktiv i Home Assistant. | Flowen publiserer hvilken dashboardversjon den forventer, men kan ikke inspisere brukerens aktive YAML. Releasekontrollen må derfor sammenligne dem eksplisitt.<br><br>**Observerbar effekt og kontroll:** Ved release skal dashboardtittelen sammenlignes med forventet `dashboard_version` fra flowen; et avvik skal dokumenteres og stoppe godkjenning selv om begge filer ellers parser. |
| HA-NF-005 | Mobilvisning skal prioriteres fremfor tvungen symmetri på bred skjerm. | Kort skal først og fremst være lesbare og trygge å betjene på telefon. Ulik kolonnehøyde på stor skjerm er akseptabelt.<br><br>**Observerbar effekt og kontroll:** Valider YAML statisk og test minst mobil og bred nettleser; ingen skjult frontend-, nettverks- eller miljøavhengighet skal kreves. |

## 14. Akseptansekriterier

Dashboardmodulen kan godkjennes når:

1. YAML kan parses og inneholder de fem avtalte visningene.
2. Alle entitetsreferanser i dashboardet finnes i releaseflowen, og alle Companion-entiteter i releasekontrakten er brukt eller uttrykkelig dokumentert. Begge sider skal telle 230.
3. Bryggedag-visningen er kontrollert i `idle`, alle aktive statuser, `completed`, `ended`, `error`, `unknown` og `unavailable`.
4. Tidslinje viser dynamisk rekkefølge, 15-minutters rader og grønn overtid.
5. Ordinære og bekreftbare fasepunkter vises korrekt før og etter forfall.
6. Pause/fortsett, neste, tilbake, bekreftelse, kommentar, rapport, avslutt og nullstill kan betjenes fra dashboardet.
7. Template-, fase-, fasepunkt- og timereditor er tilgjengelig bare i `idle`.
8. Home Assistant reconnect gjenoppretter alle editorfelt uten feedback-løkke.
9. Systemkontrollen viser alle detaljer mobilvennlig og med problemer først.
10. Rapportlenker åpnes i ny fane og viser nyeste rapport etter ny generering uten gammel cache.
11. Mobilvisningen er testet gjennom en komplett akselerert bryggedag.
12. Én komplett live-bryggedag er gjennomført før endelig `v1.0.0`.
13. To samtidige HA-klienter viser samme state, og en endring fra den ene blir synlig i den andre uten at det opprettes brukerspesifikke editorverdier.
14. Releasevalideringen kontrollerer at alle deklarerte attributtmappinger på `sensor.brygging_status` har en faktisk produsert kildeverdi.

RC3.3.2 består den tekniske regresjonssuiten, men målmiljøscenariene i sporbarhetsmatrisen må dokumenteres separat. Full live-bryggedag og langtidstest gjenstår før endelig v1.0.0.

## 15. Kjente avgrensninger

- Dashboardet kan ikke selv kontrollere at YAML-versjonen som faktisk er limt inn, samsvarer med flowversjonen.
- Den faste grensen på 15 fase-, fasepunkt- og timerplasser gir mange entiteter, men er bevisst valgt for Home Assistant-integrasjonen.
- Rapportarkivet viser siste public-kopi; individuelle arkivrapporter gjøres ikke direkte tilgjengelige som egne dashboardlenker.
- Flere nettlesere kan vise og endre samme delte state, men systemet har ingen operatørlås, brukerspesifikk kladd eller konfliktvarsling for samtidige, motstridende kommandoer.
- Home Assistant-tilgang og hvilke brukere som får åpne dashboardet administreres av Home Assistant og er ikke en egen tilgangskontroll i Bryggedagsassistenten.

### 15.1 2026.11.07-1-status

2026.11.07-1 er første GitHub-publisering med datobasert versjon fra RC3.3.2. Modulfunksjonen er uendret; kravstatus og releasebevis fremgår av sporbarhetsmatrisen.

## 16. Sporbarhet

Kravene spores i `KRAV-SPORBARHET-2026.11.07-1-matrise` mot RC3.3.2-dashboardet, den komplette 230-entitetskontrakten, navngitte tester og manuelle målmiljøscenarier.
