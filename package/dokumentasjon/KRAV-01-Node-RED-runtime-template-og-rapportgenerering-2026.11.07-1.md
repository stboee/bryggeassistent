# Kravspesifikasjon 01 – Node-RED, runtime, template og rapportgenerering

## 1. Dokumentstatus

> **Styringsregel:** Node-RED-modulen skal ikke godkjennes bare fordi regresjonstesten består. Hvert normativt krav skal være koblet til implementasjon, automatisert verifikasjon eller begrunnet manuell akseptanse, og faktisk resultat.

| Felt | Verdi |
|---|---|
| System | Bryggedagsassistent |
| Modul | Node-RED, runtime, template og rapportgenerering |
| Kravgrunnlag | `2026.11.07-1` med implementasjonsbaseline `v1.0.0-rc3.3.2` |
| Template-, state- og hendelsesschema | `1.0` |
| Dokumenttype | Normativ kravspesifikasjon |
| Dokumentversjon | 2.0 |
| Dato | 2026-08-26 |
| Revisjonsstatus | Endelig normativt kravgrunnlag for 2026.11.07-1 |

Dokumentet beskriver den normative funksjonen og de tekniske grensesnittene for `2026.11.07-1`. Kravendringer skal oppdateres før senere funksjons- eller schemaendringer innføres.

Kravordene **skal**, **bør** og **kan** angir henholdsvis obligatorisk krav, anbefalt egenskap og tillatt mulighet. Kolonnen «Forklaring og praktisk betydning» avgrenser hvordan kravet skal forstås og avsluttes med en observerbar effekt og kontrollmåte. Denne teksten er del av fortolkningen av kravet, men oppretter ikke et ekstra krav ved siden av ID-en.

## 2. Formål og omfang

Modulen skal være den autoritative motoren for én bryggedag. Den skal:

- laste, validere, redigere og lagre en generell prosess-template
- styre bryggedagens tilstand, faser, fasepunkter, pauser og timere
- motta kommandoer fra Home Assistant og publisere et konsistent entitetsgrensesnitt tilbake
- lagre gjenopprettbar runtime-state og en separat hendelseslogg
- generere, arkivere og publisere HTML-bryggerapporter
- utføre systemkontroll og fersk start-preflight

Følgende er utenfor modulens omfang:

- innholdet i konkrete øloppskrifter og konkrete bryggeprosedyrer
- Home Assistant-dashboardets visuelle layout
- automatisk import av dashboard-YAML
- mobilvarsler, fysiske betjeningsorganer og støtte for flere samtidige bryggedager
- automatisk migrering av template- eller statefiler fra eldre schema enn 1.0

### 2.1 Ansvarsdeling

Node-RED-modulen er systemets autoritative motor. Home Assistant viser data og sender brukerhandlinger, mens installeren legger filene og kontrollerer miljøet. Ansvarsdelingen skal forstås slik:

| Del | Ansvar |
|---|---|
| Node-RED-runtime | Godkjenner kommandoer, eier bryggedagsstate, beregner tider, validerer template og oppdaterer Home Assistant-entiteter. |
| Lagringslaget i flowen | Skriver state, JSONL, template og rapport gjennom kontrollert filkø og håndterer retry/diagnostikk. |
| Rapportgeneratoren | Lager selvstendig HTML fra autoritativ state og publiserer en kontrollert kopi til HA-public. |
| Home Assistant | Presenterer de publiserte entitetene og sender kommandoer; det er ikke en egen bryggemotor. |
| Installeren | Validerer og plasserer releasefiler, oppretter runtime-konfigurasjon og kontrollerer container/mount; den bestemmer ikke bryggedagens runtimeforløp. |

Et synlig dashboardelement er derfor ikke autorisasjon til å endre state. Hver kommando kontrolleres på nytt av Node-RED i den tilstanden som gjelder når meldingen mottas.

### 2.2 Begreper

| Begrep | Betydning i dette dokumentet |
|---|---|
| Template | En generell prosessmal med 15 faseplasser, inntil 15 fasepunktplasser per fase og 15 generiske timerplasser. En konkret øloppskrift er ikke del av modulen. |
| Runtime-state | Det autoritative øyeblikksbildet av bryggedagen: status, aktiv fase, tider, resultater, kommentarer, historikk og innebygd template. |
| Session | Én bryggedag fra vellykket start til `completed` eller `ended`, identifisert med en unik session-ID. |
| Fase | Et hovedtrinn med permanent ID, redigerbar rekkefølge, navn, aktiv-status og planlagt varighet. |
| Fasepunkt | En tidsplassert aktivitet, tilsetning, måling, kontroll eller advarsel innenfor en bestemt fase. |
| Timer | En opptelling eller nedtelling mellom to templatedefinerte runtimehendelser. Dette er noe annet enn fasens egen fremdrift. |
| Statusprojeksjon | Det avgrensede bildet av runtime som publiseres til Home Assistant-sensorer og editorentiteter. |
| Commit | Punktet der en validert kommando blir en autoritativ stateendring og deretter sendes til lagring/publisering. |
| Atomisk skriving | Skriving til en midlertidig fil etterfulgt av rename, slik at målfilen enten er gammel eller komplett ny fil. |
| Restore | Automatisk gjenoppretting ved Node-RED-oppstart fra current-state, previous-state eller til slutt standardtemplate. |
| Preflight | En fersk systemkontroll som kjøres som del av hvert startforsøk og avgjør om starten kan godkjennes. |
| Public-kopi | Den faste rapportfilen under `ha-public` som Home Assistant tilbyr på `/local/brygging/siste-bryggerapport.html`. |

### 2.3 Grensesnitteierskap og entity-ID-er

Når et Node-RED-krav produserer eller mottar en bestemt Home Assistant-entitet, skal full entity-ID stå i kravet. Genererte familier bruker `FF=01`–`15` for permanente faser og `PP=01`–`15` for faste punktplasser.

Node-RED-dokumentet eier gyldighet, beregning, commit og publisering. Home Assistant-dokumentet eier visning og tjenestekall. Eksempelvis er `NR-HA-010` produsentkravet for de tre strukturerte oversiktssensorene, mens `HA-TL-003`, `HA-PKT-001` og `HA-TID-003` er forbrukerkrav. Slike par skal samsvare, men skal ikke slås sammen på tvers av modulgrensen.

Krav som ligner hverandre innen denne modulen er presisert etter livssyklus: schema-/templatekrav beskriver hva som er gyldig lagret modell, runtimekrav beskriver hva motoren gjør med modellen, og HA-krav beskriver hva som publiseres. Dermed får hvert krav én primær effekt.

### 2.4 Hovedforløp og datavei

| Trinn | Hva som skjer | Hva som ikke skjer ennå |
|---:|---|---|
| 1 | En HA-entitet, oppstartsrutine eller intern kontroll sender en melding. | Meldingen har ikke rett til å endre state bare fordi den er mottatt. |
| 2 | Inndata normaliseres og kontrolleres mot kjent kommando, verdi og livssyklus. | Ugyldig inndata når ikke commit. |
| 3 | Kommandomodulen beregner en komplett foreslått stateendring. | Home Assistant er fortsatt ikke autoritativ kilde. |
| 4 | Runtime valideres og endringen godkjennes som ny autoritativ state. | Persistens kan ikke endre hva kommandoen betydde. |
| 5 | Statusprojeksjon, filskriving og JSONL mottar resultatet. | En feil i rapport/public-kopi skal ikke omskrive gyldig runtime. |
| 6 | Home Assistant-klienter ser samme publiserte resultat. | Det opprettes ikke en separat state per bruker eller nettleser. |

## 3. Systemgrenser og forutsetninger

### 3.1 Driftsmodell

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-DRIFT-001 | Modulen skal støtte nøyaktig én aktiv bryggedag om gangen. | Det finnes bare ett autoritativt runtimeobjekt og én aktiv session-ID. En ny bryggedag kan derfor ikke startes før den forrige er avsluttet og klargjort.<br><br>**Observerbar effekt og kontroll:** Forsøk å starte en ny sesjon både mens en sesjon er aktiv og etter at den er avsluttet og nullstilt; bare det siste forsøket skal opprette ny session-ID. |
| NR-DRIFT-002 | Modulen skal ha én felles bryggedagsstate som kan vises samtidig i flere Home Assistant-klienter. Aktiv betjening og templateendringer skal koordineres fordi runtime ikke har operatørlås eller konfliktløsning for motstridende samtidige kommandoer. | Flere kan følge dashboardet samtidig, men alle ser og påvirker samme state. Det finnes ingen operatørlås eller konfliktbehandling, så aktive kommandoer og templateendringer må koordineres.<br><br>**Observerbar effekt og kontroll:** Åpne samme bryggedag i to HA-klienter, utfør en endring i den ene og kontroller at begge viser samme publiserte state uten klientspesifikk kopi. |
| NR-DRIFT-003 | Normal betjening skal skje gjennom Home Assistant-dashboardets dokumenterte `button.brygging_*`-, editor- og sensorentiteter; Node-RED-editoren skal ikke være en ordinær kommandoflate. | Produksjonsflowen kan vedlikeholdes i Node-RED, men operatøren skal ikke trenge inject-noder eller manuell context-endring for normal bryggedrift.<br><br>**Observerbar effekt og kontroll:** Gjennomfør normal oppstart, fasebetjening, kommentar, rapport og nullstilling fra HA-dashboardet; ingen inject-node eller manuell context-endring skal være nødvendig. |
| NR-DRIFT-004 | Brukerrettede tekster, statusmeldinger, loggbeskrivelser og rapporter skal være på norsk. Interne status- og kommandoverdier kan være engelske når de er del av grensesnittkontrakten. | Operatørtekst skal være forståelig på norsk. Engelske maskinverdier som `running` og `paused` beholdes når andre moduler er avhengige av nøyaktig skrivemåte.<br><br>**Observerbar effekt og kontroll:** Kontroller dashboardstate, feilmeldinger, JSONL-beskrivelser og rapport i en testsesjon; operatørteksten skal være norsk, mens avtalte maskinverdier skal beholde eksakt grensesnittverdi. |
| NR-DRIFT-005 | Modulen skal bruke konfigurert IANA-tidssone, normalt `Europe/Oslo`, for brukerrettede tidsstempler. | Samme tidssone skal brukes i dashboarddata, logg og rapport, slik at klokkeslett kan sammenlignes. UTC kan fortsatt brukes internt i lagrede ISO-tidsstempler.<br><br>**Observerbar effekt og kontroll:** Bruk en kontrollert UTC-tid og `Europe/Oslo`, også rundt et sommertidsskifte; publiserte, loggede og rapporterte lokale klokkeslett skal samsvare. |
| NR-DRIFT-006 | Modulen skal forutsette korrekt vertstid. Den skal ikke hevde at ekstern NTP-nøyaktighet er verifisert. | Kontrollen kan formatere containerens klokke i valgt tidssone, men kan ikke sammenligne den med en ekstern tidskilde. NTP og korrekt vertsklokke er et driftsansvar.<br><br>**Observerbar effekt og kontroll:** Kontroller systemtidsraden med gyldig containerklokke og tidssone; den skal vise observert systemtid, men ikke påstå at NTP eller ekstern klokkeavvik er målt. |

### 3.2 Tekniske avhengigheter og stier

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-INT-001 | Modulen skal kjøre i Node-RED med `node-red-contrib-home-assistant-websocket`. | Websocket-pakken er koblingen som oppretter entiteter, mottar knappetrykk og publiserer state til Home Assistant. Manglende pakke gjør HA-grensesnittet ubrukelig.<br><br>**Observerbar effekt og kontroll:** Start containeren med referansemounts og manglende/ugyldig variant i testmiljø; riktig sti skal fungere og avvik skal diagnostiseres før start. |
| NR-INT-002 | Vedvarende Node-RED-data skal være tilgjengelige under `/data`. | `/data` må være vedvarende lagring, ellers forsvinner flow, state og konfigurasjon når containeren erstattes.<br><br>**Observerbar effekt og kontroll:** Start containeren med referansemounts og manglende/ugyldig variant i testmiljø; riktig sti skal fungere og avvik skal diagnostiseres før start. |
| NR-INT-003 | Modulets dataområde skal være `/data/brewing-assistant`. | Alle modulspesifikke filer samles under én kjent rot. Dette gjør mount, backup og tilgangskontroll oversiktlig.<br><br>**Observerbar effekt og kontroll:** Start containeren med referansemounts og manglende/ugyldig variant i testmiljø; riktig sti skal fungere og avvik skal diagnostiseres før start. |
| NR-INT-004 | Home Assistants offentlige rapportkatalog skal være montert i containeren som `/data/brewing-assistant/ha-public`. | Stien er et bind-mount direkte til Home Assistants `www/brygging`. Skriving her publiserer rapporten uten et ekstra kopieringstrinn på verten.<br><br>**Observerbar effekt og kontroll:** Start containeren med referansemounts og manglende/ugyldig variant i testmiljø; riktig sti skal fungere og avvik skal diagnostiseres før start. |
| NR-INT-005 | Standard runtime-konfigurasjon skal leses fra `/data/brewing-assistant/config/runtime.json`. | Filen gir runtime faste opplysninger som ikke skal hardkodes spredt i flowen. Den opprettes og vedlikeholdes av installeren.<br><br>**Observerbar effekt og kontroll:** Start containeren med referansemounts og manglende/ugyldig variant i testmiljø; riktig sti skal fungere og avvik skal diagnostiseres før start. |
| NR-INT-006 | Runtime-konfigurasjonen skal minst angi `schema_version`, `default_template_filename` og `timezone`. | Disse tre feltene avgjør hvilket schema som godtas, hvilken template som lastes ved fallback og hvordan lokale klokkeslett vises.<br><br>**Observerbar effekt og kontroll:** Start containeren med referansemounts og manglende/ugyldig variant i testmiljø; riktig sti skal fungere og avvik skal diagnostiseres før start. |
| NR-INT-007 | Det skal ikke ligge passord, token, faste IP-adresser eller Home Assistant-porter i produksjonsflowen. | Miljøspesifikke tilkoblingsdata skal ligge i Node-RED/Home Assistant-konfigurasjonen. Flowfilen skal kunne deles og sikkerhetskopieres uten å røpe hemmeligheter.<br><br>**Observerbar effekt og kontroll:** Start containeren med referansemounts og manglende/ugyldig variant i testmiljø; riktig sti skal fungere og avvik skal diagnostiseres før start. |

## 4. Arkitektur og vedlikeholdbarhet

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-ARK-001 | Produksjonsflowen skal ha versjonsnøytral fane-ID `brygging_production` og versjonsnøytral etikett `Brygging – Produksjonsflow`. | Versjon hører hjemme i releasefil, statusattributt og manifest, ikke i et arbeidsfanenavn som ellers blir foreldet ved hver oppgradering.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-ARK-002 | Produksjonslogikken skal være visuelt gruppert etter ansvar, uten foreldede dokumentasjonsgrupper, overlappende grupper eller noder uten definert eier. | Flowen skal kunne revideres visuelt, men normativ dokumentasjon skal ligge i eksterne, versjonerte dokumenter.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-ARK-003 | Dataveien skal følge prinsippet inngang → normalisering/streng validering → kommandomodul → runtimekontroll/commit → statusprojeksjon → persistens og Home Assistant-publisering. | Bare validerte og normaliserte data skal nå state-commit. Publisering og lagring skjer etter at én autoritativ endring er godkjent.<br><br>**Observerbar effekt og kontroll:** Kjør statisk flowanalyse av faner, grupper, node-/wiretyper og tickbaner; alle strukturelle avvik skal gi mislykket releasetest. |
| NR-ARK-004 | Kommandoer skal rutes eksplisitt. Ukjente kommandoer skal avvises, diagnostiseres og logges. | En kommando skal alltid ende i en kjent handler eller et kontrollert avslag. Stavefeil eller gamle kommandoer skal ikke forsvinne lydløst.<br><br>**Observerbar effekt og kontroll:** Kjør statisk flowanalyse av faner, grupper, node-/wiretyper og tickbaner; alle strukturelle avvik skal gi mislykket releasetest. |
| NR-ARK-005 | Produksjonsflowen skal ikke inneholde TEST-inject-noder, debug-noder eller manuell restore-inject. | Produksjonsflowen skal ikke inneholde knapper som omgår dashboardets vern eller genererer uønsket testtrafikk.<br><br>**Observerbar effekt og kontroll:** Kjør statisk flowanalyse av faner, grupper, node-/wiretyper og tickbaner; alle strukturelle avvik skal gi mislykket releasetest. |
| NR-ARK-006 | Automatisk restore ved oppstart skal være eneste restorebane i normal produksjonsflow. | Gjenoppretting skjer deterministisk under oppstart. Operatøren skal ikke kunne laste en eldre state manuelt inn i en kjørende prosess.<br><br>**Observerbar effekt og kontroll:** Kjør statisk flowanalyse av faner, grupper, node-/wiretyper og tickbaner; alle strukturelle avvik skal gi mislykket releasetest. |
| NR-ARK-007 | Femsekunderstick skal avsluttes uten videre arbeid når brygging er passiv, ingen skrive-retry venter og Home Assistant-forbindelsen er klar. | Ticken brukes bare når noe faktisk må beregnes, republiseres eller forsøkes skrevet på nytt. Dette begrenser unødvendig CPU- og meldingsaktivitet i idle.<br><br>**Observerbar effekt og kontroll:** Kjør statisk flowanalyse av faner, grupper, node-/wiretyper og tickbaner; alle strukturelle avvik skal gi mislykket releasetest. |
| NR-ARK-008 | Produksjonsflowen skal ikke inneholde en egen dokumentasjonsfane. | Den tidligere kommentarfanen hadde ingen kjørbar funksjon og kunne ikke holdes synkron med krav- og systemdokumentasjonen.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-ARK-009 | Node-REDs interne meldings-, context-, runtime-, journal- og filgrensesnitt skal være dokumentert i en separat variabel- og dataflytkontrakt. | Kontrakten skal identifisere produsent, mottaker, databruk, levetid og valideringsgrense for hvert kontraktfestet felt.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-ARK-010 | En produsert variabel skal ha en dokumentert mottaker eller en uttrykkelig begrunnet intern funksjon. Skrivebare felt uten leser skal fjernes eller kobles til autoritativ diagnostikk. | Write-only contextnøkler og parallelle feilkanaler skal ikke bli liggende som tilsynelatende funksjonalitet.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 5. Template og schema 1.0

### 5.1 Overordnet modell

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-TPL-001 | En template skal være et JSON-objekt med nøyaktig toppnivåfeltene `schema_version`, `note`, `phases` og `timers`. Ekstra eller manglende felt skal avvises. | Streng toppnivåstruktur gjør at skrivefeil og gamle/private felt oppdages tidlig. En template med andre toppnivåfelt kan ikke tas i bruk.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-002 | `schema_version` skal være nøyaktig `1.0`. Eldre schema skal avvises uten skjult migrering. | Schemaet er en eksplisitt kontrakt. En fil med annet schema må konverteres utenfor runtime før den kan tas i bruk.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-TPL-003 | `note` skal være tekst og skal kunne være tom. | Notatet beskriver malen generelt og er ikke et runtime-notat for en konkret bryggedag. Tom tekst er derfor gyldig.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-004 | Filnavn skal reduseres til et sikkert basenavn og bare inneholde bokstaver, tall, punktum, understrek og bindestrek samt ende på `.json`. | Bare basenavnet brukes under templatekatalogen. Dette hindrer at et filnavn peker utenfor katalogen eller inneholder shell-/stiuttrykk.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-005 | Minst én fase skal være aktiv. | En bryggedag uten noen kjørbar fase gir ingen gyldig tidslinje og skal derfor avvises ved validering.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |

### 5.2 Faser

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-TPL-006 | Templaten skal inneholde nøyaktig 15 faseplasser. | De 15 plassene samsvarer med faste Home Assistant-editorentiteter. Også ubrukte plasser må finnes i JSON-modellen.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-007 | Fase-ID-ene `01`–`15` skal være permanente, unike og uavhengige av rekkefølge og navn. | ID-en er identiteten som historikk, punkt-ID-er og timerreferanser bygger på. Navn og plassering kan endres uten at identiteten endres.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-008 | Hver fase skal ha nøyaktig feltene `id`, `order_id`, `enabled`, `title`, `duration_min` og `items`. | En fase har en lukket datamodell. Manglende eller ekstra felt betyr at templaten ikke følger schemaet.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-009 | `order_id` skal være et unikt heltall fra 1 til 15. Alle 15 verdier skal forekomme. | Rekkefølgen uttrykkes som en komplett permutasjon. Det kan derfor ikke oppstå hull eller to faser på samme plass.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-010 | `enabled` skal være boolsk. Deaktiverte faser skal beholdes i templaten, men hoppes over i aktiv tidslinje og kjøring. | Deaktivert betyr «lagret, men ikke kjørt». Plassen kan fylles ut på forhånd uten å bli del av den aktuelle bryggeplanen.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-011 | Aktiv fase skal ha et ikke-tomt navn. Like fasenavn skal tillates med advarsel fordi ID, ikke navn, skiller fasene. | Tittelen er operatørens navn på fasen. Like navn er mulig, men permanente ID-er brukes for å skille dem teknisk.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-012 | `duration_min` skal være et heltall fra 0 til 1440. | Grensen tillater nullminuttersfaser og inntil ett døgn, samtidig som feilaktige negative eller ekstremt store verdier avvises.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-013 | Endring av faserekkefølge skal flytte valgt fase og automatisk reindeksere alle 15 `order_id`-verdier. Permanente ID-er skal ikke endres. | Flytting endrer bare visnings- og kjørerekkefølge. Historikk og timerreferanser skal fortsatt peke til samme permanente fase.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |

### 5.3 Fasepunkter

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-TPL-014 | Hver fase skal kunne inneholde 0–15 fasepunktobjekter. En generator kan skrive alle 15 permanente punktplasser, også når noen er deaktiverte. | Den kompakte og den fullt utfylte representasjonen skal begge være gyldige når permanente ID-er og øvrig struktur er korrekt.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-TPL-015 | Fasepunkt-ID skal være permanent og følge `FF_PP`, der `FF` er fase-ID og `PP` er `01`–`15`. | Første del identifiserer eierfasen, andre del den permanente punktplassen. ID-en påvirkes ikke av nytt navn eller ny rekkefølge.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-016 | Hvert fasepunkt skal ha nøyaktig feltene `id`, `order_id`, `enabled`, `type`, `name`, `description`, `expected_value`, `time` og `requires_confirmation`. | Den lukkede feltlisten sikrer at editor, runtime og rapport tolker hvert punkt likt.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-017 | `order_id` skal være unikt innen fasen og være et heltall fra 1 til 15. Når alle 15 punktplassene finnes, skal verdiene 1–15 forekomme nøyaktig én gang. | Rekkefølgen skal være deterministisk både for kompakte templates og for generatorer som skriver alle permanente plasser.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-TPL-018 | Tillatte typer skal være `activity`, `addition`, `measurement`, `control` og `warning`. | Typen styrer hvordan punktet beskrives og presenteres. Vilkårlige typeverdier ville gitt uforutsigbar visning.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-019 | Et aktivert fasepunkt skal ha ikke-tomt `name`. Et deaktivert fasepunkt kan ha tomt `name`. `description` og `expected_value` skal være tekst og kan være tomme. | Dette gjør tomme, deaktiverte generatorplasser gyldige uten kunstige plassholdernavn, samtidig som alle kjørbare punkter er identifiserbare.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-TPL-020 | `enabled` og `requires_confirmation` skal være boolske. | Feltene skal være ekte JSON-boolske verdier, ikke tekst som «ja» eller «false». Dette fjerner tvetydig konvertering.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-021 | `time` skal ha nøyaktig feltene `reference` og `offset_min`. | Tidspunktet defineres relativt til en referanse og et offset. Andre underfelt godtas ikke.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-022 | `reference` skal være `phase_start` eller `phase_end`. `offset_min` skal være et heltall fra −1440 til 1440. | Punktet kan plasseres fra fasens start eller slutt, også før referansen med negativt offset. Grensen beskytter mot åpenbare tastefeil.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-023 | Deaktiverte fasepunkter skal lagres, men ikke inngå i kjøring, tidslinje eller krav om bekreftelse. | Deaktivert punkt beholdes som konfigurert plass, men skal ikke kunne bli forfalt, kreve bekreftelse eller vises som runtimeoppgave.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |

### 5.4 Generiske timere

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-TPL-024 | Templaten skal inneholde nøyaktig 15 timerplasser med permanente ID-er `timer_01`–`timer_15`. | Timerplassene har samme faste kapasitet som HA-editoren. Permanente ID-er gjør referanser og rapportering stabile.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-025 | Hver timer skal ha nøyaktig feltene `id`, `order_id`, `enabled`, `text`, `mode`, `pause_behavior`, `start` og `end`. | Alle egenskaper som trengs for start, slutt, visning og pauseoppførsel skal ligge i den lukkede timermodellen.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-026 | `order_id` skal være en unik permutasjon av 1–15. Endret rekkefølge skal reindeksere alle timerne uten å endre permanent ID. | Flytting skal endre rekkefølgen, ikke timerens identitet eller historiske kobling.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-027 | Aktiv timer skal ha ikke-tom tekst. Like tekster kan tillates med advarsel. | En aktiv timer må kunne navngis i dashboard og rapport. Like navn advares det om, men ID-ene holder dem teknisk atskilt.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-028 | `mode` skal være `count_up` eller `count_down`. | Opptelling viser tid siden start; nedtelling viser tid fram til slutt. Ingen andre beregningsmodi er definert.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-029 | `pause_behavior` skal være `follow_pause` eller `continue`. | Operatøren velger uttrykkelig om pausetid skal trekkes fra timeren eller telle som vanlig veggklokketid.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-030 | Start- og sluttanker skal ha nøyaktig feltene `event`, `ref_id` og `offset_min`. Offset skal være et heltall fra −1440 til 1440. | Begge ankere har samme entydige struktur. Offset gjør det mulig å starte eller stoppe før eller etter selve hendelsen.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-031 | Tillatte ankerhendelser skal være `brew_start_actual`, `brew_end_effective`, `brew_end_actual`, `phase_start_planned`, `phase_start_actual`, `phase_end_effective`, `phase_end_actual`, `phasepoint_due`, `phasepoint_reached` og `phasepoint_confirmed`. | Listen er den komplette hendelseskontrakten timeren kan lytte til. En annen streng kan aldri bli utløst og skal avvises.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-032 | Bryggestart/-slutt skal ha tom `ref_id`. Fasehendelser skal referere en gyldig tosifret fase-ID. Fasepunkthendelser skal referere en gyldig `FF_PP`-ID. | `ref_id` er bare nødvendig når hendelsen gjelder en bestemt fase eller et bestemt punkt. Validatoren kontrollerer både format og måltype.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |
| NR-TPL-033 | Aktiv timer skal ikke kunne referere til en deaktivert eller ukjent fase eller et deaktivert eller ukjent fasepunkt. Deaktiverte timerplasser skal fortsatt valideres strukturelt. | En aktiv timer skal ikke vente på noe som aldri kan skje. Deaktivert konfigurasjon beholdes, men må fortsatt være teknisk lesbar.<br><br>**Observerbar effekt og kontroll:** Valider både en gyldig referansetemplate og en målrettet ugyldig variant; bare referansen skal kunne lastes, lagres og brukes ved start. |

## 6. Runtime-state og livssyklus

Runtime kan leses som følgende hovedlivssyklus:

| Status | Praktisk betydning | Tillatte hovedhandlinger |
|---|---|---|
| `idle` | Ingen aktiv eller avsluttet sesjon holdes åpen. Template kan redigeres. | Velg/rediger/lagre template, systemkontroll og start. |
| `running` | Aktiv fase kjører normalt. | Pause, neste/tilbake, punktbekreftelse/-kommentar, rapport og avslutt. |
| `waiting_event` | Et forfalt fasepunkt krever operatørhandling. | Samme aktive kontrollflate; aktuell bekreftelse får særlig betydning. |
| `waiting_confirmation` | Fasens planlagte varighet er utløpt og runtime venter på videre valg/bekreftelse. | Samme aktive kontrollflate; Node-RED avgjør konkret gyldighet. |
| `paused` | Aktiv prosess er satt på pause. | Fortsett, rapport og kontrollert avslutt; tidsberegning følger timerens pausemodell. |
| `completed` | Siste aktive fase er fullført normalt. | Rapport og klargjøring av ny bryggedag. |
| `ended` | Operatøren avsluttet før normal fullføring. | Rapport og klargjøring av ny bryggedag. |
| `error` | Autoritativ state eller sentral validering er ugyldig. | Feilsøking og systemkontroll; ordinære prosesskommandoer skal ikke antas trygge. |

Statusen styrer hva runtime godtar. Dashboardets synlighet er bare en første brukerhjelp og erstatter ikke kommandovernet.

### 6.1 Autoritativ tilstand

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-STATE-001 | Gyldige runtime-statuser skal være `idle`, `running`, `waiting_confirmation`, `waiting_event`, `paused`, `completed`, `ended` og `error`. | Statusverdiene er den felles livssykluskontrakten mot dashboard, restore og kommandovern. Andre verdier betyr ugyldig state.<br><br>**Observerbar effekt og kontroll:** Valider og restore et kontrollert stateobjekt samt én variant som bryter feltkravet; ugyldig state skal avvises uten delvis commit. |
| NR-STATE-002 | `active_phase_id` skal være autoritativ peker til aktiv fase. `phase_index` skal avledes for visning og bakoverkompatible rapportfelt. | Permanent fase-ID avgjør hvilken fase som faktisk kjører. Indeksen er bare en avledet posisjon og skal ikke brukes som identitet.<br><br>**Observerbar effekt og kontroll:** Valider og restore et kontrollert stateobjekt samt én variant som bryter feltkravet; ugyldig state skal avvises uten delvis commit. |
| NR-STATE-003 | Aktiv status skal kreve gyldig aktiv fase-ID, fasestarttid og session-ID. Pause skal i tillegg kreve pausetidspunkt. | Disse feltene er minste bevis på at en aktiv eller pauset prosess kan fortsettes og tidsberegnes etter restart.<br><br>**Observerbar effekt og kontroll:** Valider og restore et kontrollert stateobjekt samt én variant som bryter feltkravet; ugyldig state skal avvises uten delvis commit. |
| NR-STATE-004 | `batch_id` skal være identisk med aktivt templatefilnavn. | Batch-ID-en er i denne versjonen ikke et eget oppskriftsnummer. Den gjør rapport og state sporbare til templatefilen som ble brukt.<br><br>**Observerbar effekt og kontroll:** Valider og restore et kontrollert stateobjekt samt én variant som bryter feltkravet; ugyldig state skal avvises uten delvis commit. |
| NR-STATE-005 | State skal inneholde `state_schema_version` og `runtime_version`. | Schemafeltet beskriver datastrukturen; runtimeversjonen viser hvilken programversjon som skrev state. Begge er nødvendige ved restore og feilsøking.<br><br>**Observerbar effekt og kontroll:** Valider og restore et kontrollert stateobjekt samt én variant som bryter feltkravet; ugyldig state skal avvises uten delvis commit. |
| NR-STATE-006 | Lister for bekreftede/loggede punkter, punktresultater, fasehistorikk, pausehistorikk, kommentarer og sesjonslogg skal alltid være strukturelt gyldige lister. | Manglende lister skal normaliseres eller gi valideringsfeil, ikke føre til tilfeldige runtimefeil når data itereres.<br><br>**Observerbar effekt og kontroll:** Valider og restore et kontrollert stateobjekt samt én variant som bryter feltkravet; ugyldig state skal avvises uten delvis commit. |

### 6.2 Start, pause, fortsett, avslutt og nullstill

| Handling | Forutsetning | Resultat ved godkjent kommando |
|---|---|---|
| Start bryggedag | `idle`, lagret og verifisert template, fersk bestått preflight | Ny session og første aktive fase startes. |
| Pause | Aktiv kjøring eller ventestatus | Pause startes, og forrige aktive status huskes. |
| Fortsett | `paused` | Pausen lukkes og forrige aktive status gjenopptas. |
| Avslutt | Aktiv bryggedag | Aktiv fase lukkes og sesjonen settes til `ended`; rapportgrunnlaget beholdes. |
| Klargjør ny bryggedag | Ikke aktiv brygging | Sesjonsdata fjernes, mens aktiv og verifisert template beholdes i ren `idle`. |

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-CMD-001 | Hvert trykk på `button.brygging_start` skal utløse en fersk full systemkontroll; et eldre godkjent resultat på `sensor.brygging_systemkontroll` skal ikke være tilstrekkelig. | START-meldingen skal holdes tilbake til den nye kontrollen er ferdig. Resultatet publiseres både som kontrollstatus og som utført eller sperret kommando.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-002 | Start skal bare tillates fra `idle`, med gyldig og lagret template, godkjent templatefilidentitet og bestått start-preflight. | `idle` alene er ikke nok. Systemet kontrollerer også ulagrede endringer, backingfilens identitet og alle startkritiske driftsforhold.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-003 | Vellykket start skal opprette unik session-ID, tømme tidligere sesjonsdata, starte første aktive fase og logge knappetrykk, bryggestart og fasestart. | En ny session skal ikke arve kommentarer, historikk eller timerresultater fra forrige bryggedag. Oppstartshendelsene gir et komplett revisjonsspor.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-004 | Kommando fra `button.brygging_pause` skal bare godtas fra `running`, `waiting_confirmation` eller `waiting_event`. | Andre statuser skal gi sperret knappresultat uten stateendring. Ved godkjenning settes pausemarkør og status publiseres på `sensor.brygging_status`.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-005 | Kommando fra `button.brygging_fortsett` skal bare godtas fra `paused` og skal gjenopprette statusen som var aktiv før pausen. | Fortsett skal lukke gjeldende pauseperiode, oppdatere akkumulert pausetid og publisere ny runtime før dashboardet bytter knapp.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-006 | Pausehistorikk og samlet pausetid skal oppdateres slik at fase- og punktplanen forskyves korrekt. | Pause skal ikke gjøre planlagte hendelser kunstig forsinket eller tidlig; tidslinjen flyttes samlet etter avtalt pausemodell.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-007 | Kommando fra `button.brygging_avslutt` skal bare godtas under aktiv brygging, lukke aktiv fase, sette `ended` og bevare logg- og rapportgrunnlaget. | Avslutt er en tidlig slutt, ikke nullstilling. `sensor.brygging_status` skal bli `ended`, og rapportknappen skal fortsatt kunne brukes.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-008 | Når siste aktive fase fullføres, skal status bli `completed`. | Normal fullføring skjer først etter siste aktive fase. Deaktiverte faser påvirker ikke sluttstatusen.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-009 | Kommando fra `button.brygging_klargjor_ny_bryggedag` skal sperres under aktiv brygging og ellers opprette ren `idle`-state med aktiv, validert template og verifisert filidentitet beholdt. | Etter commit skal sesjonsdata være borte og editorene kunne åpnes igjen. Templatefilen skal ikke måtte velges på nytt.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-010 | Ugyldige kommandoer og kommandoer i feil tilstand skal sperres og logges; de skal ikke stille endre runtime. | Et avvist trykk skal ikke gi en delvis endring. Loggen skal forklare hva som ble forsøkt og hvorfor det ikke ble utført.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |
| NR-CMD-011 | To trykk på samme dashboardknapp innen 2000 ms skal behandles som dobbelttrykk. Det andre trykket skal ignoreres og logges som `button_ignored`. | Vernet reduserer doble faser, bekreftelser eller avslutninger fra treg nettleser eller gjentatt trykk. Første trykk behandles normalt.<br><br>**Observerbar effekt og kontroll:** Send kommandoen i både tillatt og sperret status; tillatt tilfelle skal gi én komplett stateendring, mens sperret tilfelle bare gir logg/diagnostikk. |

### 6.3 Faser og «Tilbake»

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-FAS-001 | Kommando fra `button.brygging_neste_fase` skal kunne fullføre aktiv fase selv om planlagt tid eller bekreftelser ikke er ferdige; ikke nådde punkter skal registreres som avvik. | Knappen er en operatørstyrt overgang. Runtime skal lukke forsøket, logge hopp og starte neste aktive fase eller fullføre sesjonen.<br><br>**Observerbar effekt og kontroll:** Kjør faseovergangen med deaktiverte faser og minst ett Tilbake-forløp; state, historikk, punktresultater og rapportforsøk skal være konsistente. |
| NR-FAS-002 | Deaktiverte faser skal hoppes over automatisk. | Bare aktiverte faser deltar i den faktiske kjøringen, uansett at alle 15 plasser finnes i templaten.<br><br>**Observerbar effekt og kontroll:** Kjør faseovergangen med deaktiverte faser og minst ett Tilbake-forløp; state, historikk, punktresultater og rapportforsøk skal være konsistente. |
| NR-FAS-003 | Kommando fra `button.brygging_tilbake` skal bare godtas i en aktiv fase som har en tidligere aktiv fase. | Trykk i første fase eller uten aktiv brygging skal sperres og logges uten å endre fasehistorikken.<br><br>**Observerbar effekt og kontroll:** Kjør faseovergangen med deaktiverte faser og minst ett Tilbake-forløp; state, historikk, punktresultater og rapportforsøk skal være konsistente. |
| NR-FAS-004 | «Tilbake» skal lukke gjeldende gjennomføring, starte forrige aktive fase fra null og nullstille runtime-resultatene for fasen som startes på nytt. | Den avbrutte gjennomføringen lukkes som historikk. Fasen som åpnes igjen får nye startdata og nye punktresultater.<br><br>**Observerbar effekt og kontroll:** Kjør faseovergangen med deaktiverte faser og minst ett Tilbake-forløp; state, historikk, punktresultater og rapportforsøk skal være konsistente. |
| NR-FAS-005 | Tidligere fasehistorikk og fasepunktkommentarer skal bevares kronologisk etter «Tilbake». | «Tilbake» skal ikke omskrive det som faktisk skjedde. Tidligere forsøk og kommentarer forblir dokumentasjon av bryggedagen.<br><br>**Observerbar effekt og kontroll:** Kjør faseovergangen med deaktiverte faser og minst ett Tilbake-forløp; state, historikk, punktresultater og rapportforsøk skal være konsistente. |
| NR-FAS-006 | Timere skal bruke den nye gjennomføringen. Gamle resultater fra en fase som igjen er framtidig, skal ikke starte eller avslutte timeren. | Timerankere skal følge den nye kronologien. Ellers kunne gamle punkt- eller fasehendelser fullføre en timer i det nye forsøket.<br><br>**Observerbar effekt og kontroll:** Kjør faseovergangen med deaktiverte faser og minst ett Tilbake-forløp; state, historikk, punktresultater og rapportforsøk skal være konsistente. |
| NR-FAS-007 | Gjentatte fasegjennomføringer skal vises separat i rapporten med `(forsøk 1)`, `(forsøk 2)` osv. når det finnes mer enn ett forsøk. | Nummereringen gjør planlagt-versus-reell-tabellen entydig når samme permanente fase-ID forekommer flere ganger i historikken.<br><br>**Observerbar effekt og kontroll:** Kjør faseovergangen med deaktiverte faser og minst ett Tilbake-forløp; state, historikk, punktresultater og rapportforsøk skal være konsistente. |

### 6.4 Fasepunkter og kommentarer

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-PKT-001 | Aktive fasepunkter skal sorteres etter beregnet tidspunkt og deretter `order_id`. | Tidspunkt er primær arbeidsrekkefølge; `order_id` løser likt tidspunkt deterministisk.<br><br>**Observerbar effekt og kontroll:** Kjør punktet før og etter forfall, med og uten bekreftelse/kommentar; permanente ID-er, tider og statusprojeksjon skal samsvare. |
| NR-PKT-002 | Ikke-bekreftbare punkter skal registreres som nådd når første tick etter forfall behandles. Normal tickforsinkelse skal rapporteres som `Fasepunkt nådd ihht tidsplan`, ikke som et prosessavvik. | Tick er en teknisk samplingsmekanisme. Bare et eksplisitt fasehopp skal vise beregnet før-/etter-avvik for punktet.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-PKT-003 | Bekreftbare punkter skal forbli ventende til operatøren bekrefter dem eller fasen hoppes/avsluttes. | Et bekreftbart punkt dokumenterer operatørens faktiske kvittering. Det blir ikke automatisk ferdig bare fordi klokkeslettet passeres.<br><br>**Observerbar effekt og kontroll:** Kjør punktet før og etter forfall, med og uten bekreftelse/kommentar; permanente ID-er, tider og statusprojeksjon skal samsvare. |
| NR-PKT-004 | Runtime skal kunne gå til `waiting_event` når et bekreftelsespunkt er forfalt, og til `waiting_confirmation` når fasevarigheten er utløpt. | `waiting_event` markerer at et punkt krever handling, mens `waiting_confirmation` markerer at fasens planlagte slutt er passert og må håndteres.<br><br>**Observerbar effekt og kontroll:** Kjør punktet før og etter forfall, med og uten bekreftelse/kommentar; permanente ID-er, tider og statusprojeksjon skal samsvare. |
| NR-PKT-005 | Kommando fra `button.brygging_bekreft_fasepunkt` skal bare godtas ved aktiv brygging når runtime har et aktuelt bekreftelsespunkt. | Ved godkjenning lagres punktets permanente ID og bekreftelsestid. Uten aktuelt punkt skal trykket bli et sperret knappresultat.<br><br>**Observerbar effekt og kontroll:** Kjør punktet før og etter forfall, med og uten bekreftelse/kommentar; permanente ID-er, tider og statusprojeksjon skal samsvare. |
| NR-PKT-006 | Kommentar fra `text.brygging_fasepunktkommentar` og mål fra `select.brygging_fasepunkt_for_kommentar` skal bare lagres etter `button.brygging_lagre_fasepunktkommentar`, under aktiv brygging, med ikke-tom tekst og gyldig punkt i aktiv fase. | De tre entitetene utgjør én kommando. Runtime skal lese de ferske HA-verdiene, løse målet til permanent punkt-ID og enten lagre hele kommentaren eller sperre uten delresultat.<br><br>**Observerbar effekt og kontroll:** Kjør punktet før og etter forfall, med og uten bekreftelse/kommentar; permanente ID-er, tider og statusprojeksjon skal samsvare. |
| NR-PKT-007 | Kommentar skal lagre tidspunkt, fase-ID/-navn, punkt-ID/-navn, beskrivelse, forventet verdi og tidsavvik. | Sammen med kommentarteksten lagres nok kontekst til at rapporten kan forstås selv om templaten senere endres.<br><br>**Observerbar effekt og kontroll:** Kjør punktet før og etter forfall, med og uten bekreftelse/kommentar; permanente ID-er, tider og statusprojeksjon skal samsvare. |
| NR-PKT-008 | Statusprojeksjonen skal publisere inntil 15 aktive fasepunktobjekter i `sensor.brygging_fasepunktoversikt.attributes.phasepoints` med de ni kontraktfestede feltene. | Ubrukte eller deaktiverte templateplasser skal ikke projiseres. Dashboardet skal få én strukturert, validert liste og ikke 15 separate sensorskrivere.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

### 6.5 Fremdrift og timere

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-TID-001 | Fasefremdrift skal kunne overstige 100 prosent, og overtid skal beregnes separat. | Over 100 prosent betyr at fasen fortsatt kjører etter planlagt slutt. Separat overtid gjør avviket tydelig uten å stoppe prosessen.<br><br>**Observerbar effekt og kontroll:** Bruk kontrollerte klokketider, pause og ny fasegjennomføring; beregnede sensor- og timerverdier skal matche forventet millisekundgrunnlag. |
| NR-TID-002 | Estimert bryggeslutt skal publiseres som varighet på `sensor.brygging_tid_til_ferdig_bryggedag` og lokalt klokkeslett på `sensor.brygging_estimert_ferdig_bryggedag`, basert på aktiv og senere aktive faser. | Begge sensorene skal beregnes fra samme tidsgrunnlag. Dashboardet skal derfor kunne vise konsistente svar på hvor lenge og når.<br><br>**Observerbar effekt og kontroll:** Bruk kontrollerte klokketider, pause og ny fasegjennomføring; beregnede sensor- og timerverdier skal matche forventet millisekundgrunnlag. |
| NR-TID-003 | Pause skal forskyve planlagt faseslutt og fasepunkter. | Punkter og faseslutt som følger prosessen skal beholde sin relative plassering når bryggedagen pauses.<br><br>**Observerbar effekt og kontroll:** Bruk kontrollerte klokketider, pause og ny fasegjennomføring; beregnede sensor- og timerverdier skal matche forventet millisekundgrunnlag. |
| NR-TID-004 | En `follow_pause`-timer skal fryse under pause og trekke pausetid fra målingen. | `follow_pause` måler aktiv prosesstid. En pause øker derfor ikke timerens viste forløp.<br><br>**Observerbar effekt og kontroll:** Bruk kontrollerte klokketider, pause og ny fasegjennomføring; beregnede sensor- og timerverdier skal matche forventet millisekundgrunnlag. |
| NR-TID-005 | En `continue`-timer skal følge veggklokken under pause. | `continue` måler faktisk klokketid. Den fortsetter selv om selve bryggedagsruntime er satt på pause.<br><br>**Observerbar effekt og kontroll:** Bruk kontrollerte klokketider, pause og ny fasegjennomføring; beregnede sensor- og timerverdier skal matche forventet millisekundgrunnlag. |
| NR-TID-006 | Nedtelling skal kunne vise overtid etter passert sluttanker. | En nedtelling forsvinner ikke ved null. Etter sluttankeret går den over til å vise hvor mye tiden er overskredet.<br><br>**Observerbar effekt og kontroll:** Bruk kontrollerte klokketider, pause og ny fasegjennomføring; beregnede sensor- og timerverdier skal matche forventet millisekundgrunnlag. |
| NR-TID-007 | Timerstatus skal minst skille `waiting`, `waiting_end`, `active`, `overdue` og `completed`. | Statusen forklarer om timeren venter på start, har startet uten kjent slutt, kjører, er overskredet eller er ferdig.<br><br>**Observerbar effekt og kontroll:** Bruk kontrollerte klokketider, pause og ny fasegjennomføring; beregnede sensor- og timerverdier skal matche forventet millisekundgrunnlag. |
| NR-TID-008 | Bare aktiverte timere skal inngå i `timers` på `sensor.brygging_timeroversikt` og i rapportens tidsmålinger. | Deaktiverte timerplasser forblir i templaten og editoren, men skal ikke gi runtimeobjekt, dashboardlinje eller rapportresultat.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 7. Templatevalg og redigering

Node-RED holder både en runtimekopi av templaten og en backingfil. Når et HA-editorfelt endres i `idle`, endres runtimekopien og `template_dirty` settes. Først «Lagre template» validerer hele modellen, kontrollerer at backingfilen ikke er endret utenfra og skriver ny fil atomisk. «Forkast endringer» gjør det motsatte og leser backingfilen inn på nytt.

| Tilstand | Templatevalg og redigering | Bryggestart |
|---|---|---|
| `idle`, ingen ulagrede endringer | Tillatt | Mulig etter fersk preflight. |
| `idle`, `template_dirty=true` | Videre redigering, lagring eller eksplisitt forkasting | Sperret. |
| Aktiv bryggedag | Sperret | Allerede startet. |
| `completed` eller `ended` | Sperret til «Klargjør ny bryggedag» | Sperret. |

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-EDIT-001 | Templatebytte og alle permanente templateendringer skal bare tillates i `idle`. | Endring under aktiv eller avsluttet, ikke-nullstilt sesjon kunne gjort state og rapportgrunnlag selvmotsigende og er derfor sperret.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |
| NR-EDIT-002 | Templatebytte skal sperres når det finnes ulagrede endringer, med mindre operatøren eksplisitt forkaster dem. | Et templatebytte skal ikke stille forkaste operatørens uskrevede arbeid. Forkasting må være en egen, synlig beslutning.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |
| NR-EDIT-003 | Endringer i notat, faseegenskaper, fasepunkter og timere skal sette `template_dirty=true`. | Dirty-flagget er systemets bevis på at runtimekopien og backingfilen kan være ulike.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |
| NR-EDIT-004 | Ulagrede endringer skal sperre bryggestart. | Bryggingen skal starte fra en etterprøvbar fil, ikke fra en kladd som går tapt ved restart.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |
| NR-EDIT-005 | «Forkast endringer» skal laste aktiv fil på nytt og bare kunne brukes i `idle`. | Forkasting gjenoppretter sist lagrede filinnhold og er bare trygt når ingen bryggedag pågår.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |
| NR-EDIT-006 | Templatekatalogen skal valideres med samme strenge validator som lasting og lagring; bare gyldige filer skal publiseres som valg i `select.brygging_template`. | En ugyldig ikke-aktiv fil skal utelates og rapporteres i systemkontrollen, men skal ikke alene sperre start med en annen frisk aktiv template.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |
| NR-EDIT-007 | Templateverdier skal synkroniseres til `text.brygging_fase_FF_navn`, `number.brygging_fase_FF_*`, `select.brygging_fase_FF_status`, fasepunkteditoren og timereditoren ved lasting, restore, nullstilling, start, editorvalg og full reconnect-resynk. | Alle klienter skal se runtimekopien etter en overgang. Gamle HA-feltverdier skal ikke kunne bli liggende og senere overskrive riktig template ved et knappetrykk.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |
| NR-EDIT-008 | Forventede Home Assistant-ekko fra programmatisk oppdatering av editorentitetene skal filtreres én gang og utløpe etter 60 sekunder. | Når Node-RED setter eksempelvis `text.brygging_timer_navn`, skal returekkoet ikke tolkes som brukerendring eller sette `template_dirty`; et reelt senere brukerinput skal fortsatt behandles.<br><br>**Observerbar effekt og kontroll:** Endre felt i `idle`, prøv samme endring i aktiv status og utfør reconnect; bare tillatt endring skal sette dirty og alle klientfelt skal resynkroniseres. |

### 7.1 Sikker templatelagring

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-SAVE-001 | Før kommando fra `button.brygging_lagre_template` skriver fil, skal hele runtime-templaten valideres strengt; ugyldig template skal ikke skrives. | Et avslag skal beholde `template_dirty`, publisere valideringsfeil på `sensor.brygging_status` og la backingfilen være byteidentisk.<br><br>**Observerbar effekt og kontroll:** Test gyldig lagring, ekstern hashendring og skrivefeil; bare fullført atomisk skriving skal fjerne dirty og oppdatere filidentiteten. |
| NR-SAVE-002 | Aktiv backing-fil skal identifiseres med SHA-256. Endring utenfor systemet skal oppdages uavhengig av filsystemets tidsoppløsning. | Hash oppdager enhver innholdsendring, også når filens tidsstempel er likt eller filsystemet har grov tidsoppløsning.<br><br>**Observerbar effekt og kontroll:** Test gyldig lagring, ekstern hashendring og skrivefeil; bare fullført atomisk skriving skal fjerne dirty og oppdatere filidentiteten. |
| NR-SAVE-003 | Filens endringstid skal også kontrolleres og leses tilbake etter vellykket lagring. | Endringstid gir lesbar diagnostikk og en ekstra identitetskontroll etter skriving, men erstatter ikke SHA-256.<br><br>**Observerbar effekt og kontroll:** Test gyldig lagring, ekstern hashendring og skrivefeil; bare fullført atomisk skriving skal fjerne dirty og oppdatere filidentiteten. |
| NR-SAVE-004 | Template skal skrives atomisk via unik midlertidig fil og rename, med forrige fil som `.prev`. | Den nye filen blir synlig i ett rename-steg. `.prev` gir en lokal forrige versjon dersom siste fil viser seg å være problematisk.<br><br>**Observerbar effekt og kontroll:** Test gyldig lagring, ekstern hashendring og skrivefeil; bare fullført atomisk skriving skal fjerne dirty og oppdatere filidentiteten. |
| NR-SAVE-005 | `template_dirty` skal først fjernes når filskriving og etterkontroll er bekreftet. | Først en kontrollert ferdig fil betyr at dashboardet kan vise «lagret» og tillate start.<br><br>**Observerbar effekt og kontroll:** Test gyldig lagring, ekstern hashendring og skrivefeil; bare fullført atomisk skriving skal fjerne dirty og oppdatere filidentiteten. |
| NR-SAVE-006 | Feil skal gi eksplisitt lagringsfeil, diagnostikk og hendelseslogg. Midlertidig fil skal ryddes. | Operatøren skal få en varig og sporbar feil, og en mislykket tempfil skal ikke bli liggende som mulig templatekandidat.<br><br>**Observerbar effekt og kontroll:** Test gyldig lagring, ekstern hashendring og skrivefeil; bare fullført atomisk skriving skal fjerne dirty og oppdatere filidentiteten. |

## 8. Persistens, restore og logging

State og JSONL har forskjellige roller. State er siste komplette gjenopprettingsbilde; JSONL er et appendbasert hendelsesspor. De skrives separat, og rapport kan genereres fra runtime/state selv om public-kopien eller en rapportskriving tidligere har feilet.

| Filtype | Formål | Oppførsel ved feil |
|---|---|---|
| `current_state.json` | Primær restorekilde | Vedvarende kritisk diagnostikk og kontrollert retry. |
| `current_state.prev.json` | Forrige komplette state | Brukes automatisk når current-state ikke kan valideres. |
| `<session>-brewday.jsonl` | Kronologiske hendelser og knappresultater | Feilen registreres separat; siste event kan i et smalt strømbruddsvindu finnes bare i state eller logg. |
| Templatefil og `.prev` | Permanent prosessmal og forrige filversjon | Dirty fjernes ikke før fil og etterkontroll har lyktes. |
| Rapport og public-kopi | Arkivoriginal og stabil HA-lenke | Runtime beholdes; generering/publisering kan forsøkes på nytt. |

### 8.1 State

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-PER-001 | Primær state skal lagres som `/data/brewing-assistant/state/current_state.json`. | Dette er filen oppstart forsøker først. Den inneholder siste godkjente, persistente runtimebilde.<br><br>**Observerbar effekt og kontroll:** Simuler raske stateendringer og en kontrollert skrivefeil; køen skal serialisere skriv, slå sammen ventende state og beholde feilen til vellykket retry. |
| NR-PER-002 | Forrige atomiske state skal lagres som `/data/brewing-assistant/state/current_state.prev.json`. | Forrige fil er reserve dersom primærfilen er korrupt eller ufullstendig etter en hendelse.<br><br>**Observerbar effekt og kontroll:** Simuler raske stateendringer og en kontrollert skrivefeil; køen skal serialisere skriv, slå sammen ventende state og beholde feilen til vellykket retry. |
| NR-PER-003 | State skal skrives ved meningsfulle endringer, ikke uendret hvert femte sekund. | Tidsvisning kan oppdateres ofte i minnet uten å slite lagring eller fylle skrivekøen med identiske states.<br><br>**Observerbar effekt og kontroll:** Simuler raske stateendringer og en kontrollert skrivefeil; køen skal serialisere skriv, slå sammen ventende state og beholde feilen til vellykket retry. |
| NR-PER-004 | State-, template- og rapportskriving skal gå gjennom én serialisert atomisk skrivekø. Flere ventende stateoppdateringer skal kunne slås sammen. | Én skriver hindrer konkurrerende rename-operasjoner. Sammenslåing gjør at bare nyeste state trenger å vente når flere endringer kommer raskt.<br><br>**Observerbar effekt og kontroll:** Simuler raske stateendringer og en kontrollert skrivefeil; køen skal serialisere skriv, slå sammen ventende state og beholde feilen til vellykket retry. |
| NR-PER-005 | Mislykket state-skriving skal gi vedvarende diagnostikk og kontrollert retry. Feilen skal først kvitteres når samme filtype senere er skrevet vellykket. | En skrivefeil skal være synlig til en reell ny skriving lykkes. En vanlig tick eller annen kommando kan ikke kvittere den.<br><br>**Observerbar effekt og kontroll:** Simuler raske stateendringer og en kontrollert skrivefeil; køen skal serialisere skriv, slå sammen ventende state og beholde feilen til vellykket retry. |
| NR-PER-006 | State skal være primær gjenopprettingskilde. | Rapport og JSONL er støttedata; restore bygger først og fremst på den atomiske statefilen.<br><br>**Observerbar effekt og kontroll:** Simuler raske stateendringer og en kontrollert skrivefeil; køen skal serialisere skriv, slå sammen ventende state og beholde feilen til vellykket retry. |

### 8.2 Oppstartsrekkefølge og restore

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-RES-001 | Oppstart skal først lese runtime-konfigurasjon og standardtemplate og deretter avgjøre restore uten å overskrive eksisterende state på forhånd. | Oppstartslogikken må vite schema, tidssone og fallback før den vurderer filene. Den skal aldri lage tom state foran en mulig gyldig restore.<br><br>**Observerbar effekt og kontroll:** Start med gyldig current, korrupt current/gyldig previous og begge ugyldige; restorekilden og diagnostikken skal følge den dokumenterte prioritetskjeden. |
| NR-RES-002 | Restorekjeden skal være: gyldig current-state → gyldig previous-state → strengt validert standardtemplate. | Kjeden prioriterer nyeste state, deretter sikkerhetskopien og til slutt en ren idle fra template. Hvert trinn må valideres før bruk.<br><br>**Observerbar effekt og kontroll:** Start med gyldig current, korrupt current/gyldig previous og begge ugyldige; restorekilden og diagnostikken skal følge den dokumenterte prioritetskjeden. |
| NR-RES-003 | Kun state med `state_schema_version=1.0` og gyldig innebygd template 1.0 skal kunne gjenopprettes. | Restore skal ikke forsøke en skjult migrering av strukturer den ikke kjenner.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RES-004 | Ved restore skal aktiv templatefils eksistens og SHA-256 sammenholdes med state. | State inneholder templateinnhold, men backingfilen må fortsatt være den samme som da sesjonen ble lagret.<br><br>**Observerbar effekt og kontroll:** Start med gyldig current, korrupt current/gyldig previous og begge ugyldige; restorekilden og diagnostikken skal følge den dokumenterte prioritetskjeden. |
| NR-RES-005 | Manglende eller endret templatefil skal sperre ny start i `idle`. En allerede aktiv, gjenopprettet bryggedag skal ikke avbrytes av dette avviket, men avviket skal vises og logges. | En pågående sesjon bevares for å unngå datatap, men avviket må løses før en ny sesjon kan starte.<br><br>**Observerbar effekt og kontroll:** Start med gyldig current, korrupt current/gyldig previous og begge ugyldige; restorekilden og diagnostikken skal følge den dokumenterte prioritetskjeden. |
| NR-RES-006 | Tidsberegninger etter restart skal fortsette fra lagrede tidsstempler. Nedetid skal telle som reell prosesstid. | Restart nullstiller ikke veggklokken. Et fem minutters avbrudd øker derfor reell fase- og timertid med fem minutter etter avtalt pausemodell.<br><br>**Observerbar effekt og kontroll:** Start med gyldig current, korrupt current/gyldig previous og begge ugyldige; restorekilden og diagnostikken skal følge den dokumenterte prioritetskjeden. |
| NR-RES-007 | Vellykket restore av en aktiv eller avsluttet sesjon skal produsere én varig `state_restored`-hendelse for den aktuelle oppstarten. | Hendelsen skal minst angi restorekilde, restarttid, gjenopprettet status, fase-ID/-navn, forsøksnummer, aktuelt eller neste fasepunkt og tidsposisjon både i fasen og relativt til punktets planlagte tidspunkt. Manglende punkt skal uttrykkes eksplisitt som tomtilstand.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RES-008 | Mislykket restore skal registreres i autoritativ oppstartsdiagnostikk. Dersom en gyldig sesjonsjournal er tilgjengelig, skal feilen også kunne spores der uten å fremstilles som en dashboardhandling. | Operatøren skal kunne skille gjenopprettet state, fallback til previous og ren idle-fallback fra hverandre.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

### 8.3 Hendelseslogg

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-LOG-001 | Hver bryggedag skal ha én append-basert JSONL-fil med session-ID i filnavnet: `<session-id>-brewday.jsonl`. | Append-formatet gir et kronologisk revisjonsspor som kan leses linje for linje selv om siste append skulle feile.<br><br>**Observerbar effekt og kontroll:** Parse hver JSONL-linje og kontroller arkivklassifisering/rydding med filer i alle kategorier; aktive eller uferdige logger skal aldri slettes. |
| NR-LOG-002 | Hver JSONL-rad skal være gyldig JSON og inneholde minst tidsstempel, hendelse, status, `flow_version` og `state_schema_version`. | Versjonsfeltene gjør hver linje fortolkbar uten å måtte gjette hvilken flow eller datamodell som skrev den.<br><br>**Observerbar effekt og kontroll:** Parse hver produserte JSONL-linje og kontroller at minimumsfeltene finnes med gyldige verdier, også etter restart. |
| NR-LOG-003 | Loggen skal skille utførte, sperrede, feilede og ignorerte dobbelttrykk. | Rapport og feilsøking skal kunne skille en gjennomført handling fra et kontrollert avslag, en feil og et filtrert dobbelttrykk.<br><br>**Observerbar effekt og kontroll:** Utløs én utført, sperret, feilet og dobbeltfiltrert kommando; JSONL og rapportgrunnlag skal skille de fire resultatklassene. |
| NR-LOG-004 | Runtime-sesjonsloggen skal begrenses til de 3000 nyeste postene. | Begrensningen gjelder kopien som holdes i runtime-state. Selve appendfilen er det varige og komplette hendelsessporet.<br><br>**Observerbar effekt og kontroll:** Legg inn mer enn 3000 runtimeposter og kontroller at state beholder nøyaktig de 3000 nyeste, mens JSONL-filen fortsatt inneholder hele appendhistorikken. |
| NR-LOG-005 | State og JSONL skal behandles som separate skriv. Det skal dokumenteres at siste hendelse ved strømbrudd i et svært smalt intervall kan finnes bare ett av stedene. | De to filene kan ikke godkjennes som én samlet filtransaksjon. State er restorekilden dersom strømmen forsvinner mellom skrivene.<br><br>**Observerbar effekt og kontroll:** Simuler avbrudd mellom state- og JSONL-skriv i testmiljø; restore skal velge atomisk state som autoritet og dokumentasjonen skal ikke love en felles transaksjon. |
| NR-LOG-006 | Loggarkivet skal klassifisere filer gjensidig utelukkende som aktiv, avsluttet, gjenkjennelig uferdig eller legacy/uklassifisert. | Hver fil får én kategori, slik at antall og ryddevalg ikke overlapper eller dobbeltteller.<br><br>**Observerbar effekt og kontroll:** Parse hver JSONL-linje og kontroller arkivklassifisering/rydding med filer i alle kategorier; aktive eller uferdige logger skal aldri slettes. |
| NR-LOG-007 | Produksjonsgrensesnittet skal ikke tilby generell sletting av sesjonsjournaler. `sensor.brygging_sesjonsarkiv` skal klassifisere og summere journalene, mens oppbevaring og eventuell sletting håndteres som en separat driftsoppgave. | Aktive eller uferdige journaler skal aldri kunne slettes ved et ordinært dashboardtrykk.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-LOG-008 | Bare reelle Home Assistant-knappetrykk skal registreres som dashboardknapper. Automatiske oppstarts-, systemkontroll- og lagringsmeldinger skal ha eksplisitt systemopprinnelse og skal ikke sette `dashboard_button`. | En automatisk `STORAGE_REFRESH` etter restart skal kunne spores som systemaktivitet, men aldri vises som om operatøren trykket «Oppdater systemkontroll».<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-LOG-009 | Hendelsestyper som kan vises i rapport eller arkiv skal ha en faktisk produsent. Renderergrener uten mulig produsent skal fjernes eller fullføres med en dokumentert produsent. | Den lukkede hendelseslisten skal kontrolleres begge veier: produsert men ikke konsumert, og konsumert men ikke produsert.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 9. Home Assistant-grensesnitt

Home Assistant-grensesnittet er en projeksjon og kommandokanal, ikke en ekstra state-database. Alle HA-brukere med tilgang ser de samme Companion-entitetene. Dersom to klienter sender ulike handlinger nær samtidig, behandles meldingene sekvensielt i mottatt rekkefølge og hvert forsøk valideres mot state som gjelder akkurat da.

De viktigste faste entity-rollene er:

| Sensor/familie | Eierdata | Bruk |
|---|---|---|
| `sensor.brygging_status` | Livssyklus og fire versjonsattributter | Overordnet status og versjonskontroll. |
| `sensor.brygging_aktiv_fase` | Fasetittel, planlagt/forløpt/gjenstående/overtid og fremdrift | Aktiv fasevisning. |
| `sensor.brygging_faseoversikt` | Strukturert liste over aktive faser | Dashboardets tidslinje. |
| `sensor.brygging_fasepunktoversikt` | Strukturert liste over aktive fasepunkter | Kronologisk arbeidsliste. |
| `sensor.brygging_timeroversikt` | Strukturert liste over aktiverte timere | Generiske tidsmålinger. |
| `sensor.brygging_aktiv_template` | Templatefil, validering, dirty og lagringstid | Templatevalg og editorstatus. |
| `sensor.brygging_driftsmeldinger` | Aktive feil og advarsler | Operatørdiagnostikk. |
| `sensor.brygging_systemkontroll`, `sensor.brygging_rapportarkiv`, `sensor.brygging_sesjonsarkiv` | Prober og arkivsummer | Teknisk visning og startgrunnlag. |
| Editorentiteter | Runtimekopien av templatefelt | Redigering i `idle`; Node-RED validerer og publiserer ekko tilbake. |
| De 17 knappene | Navngitte kommandoforespørsler | Node-RED avgjør om handlingen er gyldig og publiserer resultatet. |

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-HA-001 | Alle `sensor.brygging_*`, `button.brygging_*`, `select.brygging_*`, `number.brygging_*` og `text.brygging_*` i releasekontrakten skal registreres under én felles Bryggedagsassistent-enhet i Home Assistant. | Entitetsregisteret skal vise én enhet med den dokumenterte domenefordelingen. En releaseentitet uten samme devicekonfigurasjon skal oppdages ved grensesnittkontroll.<br><br>**Observerbar effekt og kontroll:** Sammenlign alle Companion-entity-ID-er, domener, states og attributtmappinger mot dashboardkontrakten; avvik eller tom udefinert state skal stoppe releasegodkjenning. |
| NR-HA-002 | Releaseflowen skal opprette nøyaktig 230 Companion-entiteter: 17 `button`, 48 `number`, 87 `select`, 15 `sensor` og 63 `text`. | Flow, dashboard og entitets-/attributtkontrakt skal telles uavhengig og ha samme komplette sett av entity-ID-er.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-HA-003 | Entitets-ID-er som brukes av dashboardet skal være stabile i 1.0-linjen. | Dashboard-YAML refererer konkrete entity-ID-er. Endring uten samtidig dashboardoppdatering ville gi `unavailable` eller ødelagte kort.<br><br>**Observerbar effekt og kontroll:** Sammenlign alle Companion-entity-ID-er, domener, states og attributtmappinger mot dashboardkontrakten; avvik eller tom udefinert state skal stoppe releasegodkjenning. |
| NR-HA-004 | Publiserte sensorstates skal aldri være tomme. Meningsfulle fallbackverdier skal brukes ved manglende data. | Home Assistant-kort skal få en uttrykkelig verdi som `ukjent`, `-` eller tom JSON-liste i stedet for en ugyldig blank sensorstate.<br><br>**Observerbar effekt og kontroll:** Publiser manglende/nullverdier for hver sensortype i en testprojeksjon; Home Assistant skal motta avtalt fallback og aldri tom sensorstate. |
| NR-HA-005 | Uendrede sensorverdier skal ikke republiseres unødvendig. | Publisering skal være endringsdrevet slik at websocket, database og frontend ikke får identiske oppdateringer hvert femte sekund.<br><br>**Observerbar effekt og kontroll:** Hold runtime uendret gjennom flere femsekunderstick og tell HA-publiseringer; identisk sensorstate skal ikke sendes på nytt. |
| NR-HA-006 | Ved oppstart skal HA-publisering bufres i 30 sekunder. Ved manglende Companion-klarhet skal nytt forsøk gjøres etter 15 sekunder. | Bufferen lar Node-RED og Companion bli klare før massepublisering. Retry håndterer normal oppstartsrekkefølge uten å miste initiering.<br><br>**Observerbar effekt og kontroll:** Start Node-RED med Companion utilgjengelig og gjør den deretter klar; første massepublisering og nytt forsøk skal følge de avtalte 30/15-sekundersvinduene. |
| NR-HA-007 | Etter reconnect skal alle runtime-, fase-, fasepunkt- og timereditorverdier resynkroniseres. | Resynk gjør Home Assistant til et riktig speil etter nettverksbrudd, også for editorfelt som ikke nylig har endret seg.<br><br>**Observerbar effekt og kontroll:** Endre representative runtime- og editorverdier, bryt HA-forbindelsen og koble til igjen; alle entitetsfamilier skal resynkroniseres til autoritativ state. |
| NR-HA-008 | Start skal sperres uten verifisert Home Assistant-forbindelse. En reconnect-feil under aktiv brygging skal diagnostiseres uten å ødelegge state. | En start uten fungerende kommandoflate er uforsvarlig. Ved brudd under drift fortsetter den persistente motoren og varsler om manglende grensesnitt.<br><br>**Observerbar effekt og kontroll:** Prøv start uten verifisert HA-forbindelse og bryt deretter forbindelsen under aktiv testsesjon; start skal sperres, mens aktiv state skal bevares og feilen diagnostiseres. |
| NR-HA-009 | `sensor.brygging_status` skal publisere nøyaktig de kontraktfestede versjonsattributtene `flow_version`, `expected_dashboard_version`, `session_schema_version` og `event_schema_version`. | Restore og driftsdiagnostikk publiseres gjennom de kontraktfestede sensorene og skal ikke gjeninnføres som uavtalte statusattributter.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-HA-010 | Strukturerte lister skal publiseres som `phases` på `sensor.brygging_faseoversikt`, `phasepoints` på `sensor.brygging_fasepunktoversikt` og `timers` på `sensor.brygging_timeroversikt`. | Dashboardet skal konsumere ferdig validerte listeobjekter og skal ikke parse parallelle JSON-strenger eller reparere produsentdata.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 10. Systemkontroll og start-preflight

### 10.1 Kjøring

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-SYS-001 | Utover den obligatoriske start-preflighten i `NR-CMD-001` skal systemkontroll kjøres etter oppstart, fra `button.brygging_oppdater_systemkontroll`, etter relevante arkiv-/publiseringsoperasjoner og etter fil- eller HA-feil. | Dette kravet eier de øvrige triggerne og dupliserer ikke startkravet. Hver kjøring skal publisere nytt `checked_at` på `sensor.brygging_systemkontroll`.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |
| NR-SYS-002 | Systemkontrollen skal være hendelsesstyrt og skal ikke innføre en ny fast 30-sekunders skann. | En tung fil- og katalogskann hvert 30. sekund er unødvendig. Femsekunderstick og systemkontroll har ulike oppgaver.<br><br>**Observerbar effekt og kontroll:** Observer flowen i idle over flere minutter og utløs deretter én manuell kontroll; ingen periodisk tung probe skal kjøre, mens knappetrykket skal gi nøyaktig én ny kontroll. |
| NR-SYS-003 | Hver kontrollrad skal inneholde gruppe, navn, status, om feilen sperrer start, testmetode, mål, observert resultat, konklusjon og eventuelt tiltak. | Hver rad skal forklare hva som faktisk ble testet, ikke bare vise rødt eller grønt. Tiltaket skal være konkret når noe feiler.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |
| NR-SYS-004 | Samlet kontrollstatus skal være `OK`, `ADVARSEL` eller `FEIL`, og kontrollradene skal publiseres som `checks_json` med opptellinger og startbeslutning på `sensor.brygging_systemkontroll`. | Dashboardet skal kunne vise både sammendrag og full forklaring fra samme kontrollresultat uten en egen beregningsmodell.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |

### 10.2 Kontroller og sperreregler

| Kontroll | Skal sperre start ved feil |
|---|---:|
| Runtime/state/schema-konsistens | Ja |
| Gyldig IANA-tidssone og lesbar systemtid | Ja |
| Verifisert Home Assistant-forbindelse | Ja |
| Skrive/lese/slette-probe i statekatalog | Ja |
| Skrive/lese/slette-probe i loggkatalog | Ja |
| Gyldig current-state | Ja |
| Aktiv templatefil, streng validering og SHA-256 | Ja |
| Ulagrede templateendringer | Ja |
| Kritisk lite plass i Node-RED-dataområdet | Ja |
| Templatekatalog, rapportkatalog og HA-public | Nei, advarsel |
| Previous-state mangler | Nei, informasjon |
| Ugyldige ikke-aktive templatefiler | Nei, advarsel |
| Publisert rapport mangler eller avviker | Nei, advarsel |
| Kritisk lite plass i HA-public | Nei, advarsel |
| Historisk/uavklart skriverfeil uten aktuell kritisk probe | Nei, advarsel |

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-SYS-005 | Katalogprobe skal faktisk opprette, lese og slette en kontrollfil og kontrollere oppryddingen. | En ren rettighets- eller eksistenskontroll er ikke nok. Proben beviser at den konkrete containerprosessen kan gjennomføre hele filoperasjonen.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |
| NR-SYS-006 | Aktiv template skal kontrolleres mot SHA-256 og streng runtimevalidering. | Både runtimeobjektet og filen må være gyldige og identiske. Dette oppdager ekstern filendring og strukturfeil før start.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |
| NR-SYS-007 | Nyeste originalrapport og public-kopi skal sammenlignes med SHA-256. | Samme hash betyr at filen Home Assistant tilbyr er bit-identisk med nyeste arkivoriginal.<br><br>**Observerbar effekt og kontroll:** Publiser en identisk og deretter manipulert public-kopi; SHA-256-raden skal skifte fra godkjent til avvik uten å sperre en ellers gyldig start. |
| NR-SYS-008 | Aktiv JSONL-logg skal ved aktiv brygging ha forventet sessionfil, startmarkør og gyldig siste JSON-linje. | Under aktiv drift skal den forventede sessionloggen finnes, ha en start og slutte med en parsebar JSON-rad.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |
| NR-SYS-009 | Diskadvarsel skal gis under 250 MiB ledig eller ved minst 95 % bruk. Node-RED-dataområdet skal sperre start under 50 MiB ledig eller ved minst 99 % bruk. | Advarsel gir tid til vedlikehold; den strengere dataområdegrensen hindrer start når state og logg står i umiddelbar fare for å ikke kunne skrives.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |
| NR-SYS-010 | Systemkontrollen skal vise flowversjon, forventet dashboardversjon, state-writerversjon, schema, Node.js-, Node-RED- og HA-nodeversjon når tilgjengelig. | Versjonsbildet gjør det mulig å finne blandede installasjoner og relevante avhengighetsversjoner uten å åpne flere systemer.<br><br>**Observerbar effekt og kontroll:** Kjør kontrollen med ett kjent avvik per probe og deretter frisk tilstand; status, blokkeringsbeslutning, tiltak og kvittering skal følge samme kilde. |

## 11. Rapportgenerering og arkiv

### 11.1 Generering og innhold

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-RAP-001 | Kommando fra `button.brygging_generer_rapport` skal godtas under aktiv brygging og i `completed` eller `ended`, men sperres i `idle`. | Godkjent kommando oppretter en ny rapportjobb; sperret kommando skal logges uten filendring.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RAP-002 | Rapporten skal genereres som komplett HTML på norsk med UTF-8 og utskriftsvennlig CSS. | Rapportfilen skal kunne åpnes selvstendig i nettleser og skrives ut uten avhengighet til Home Assistant-frontend.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-003 | Alt template-, kommentar- og logginnhold skal HTML-escapes før innsetting. | Bruker- og templateinnhold behandles som tekst. Dette hindrer at HTML-tegn eller innlimt kode endrer rapportstrukturen.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-004 | Rapportens metadata skal vise template, status, start, slutt, genereringstid og generatorversjon. | Metadataene identifiserer grunnlag, livssyklus og hvilken generator som produserte akkurat denne filen.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-005 | Rapporten skal inneholde seksjonene «Template-notat», «Plan», «Faser: planlagt vs. reell tidsbruk», «Kronologisk logg», «Tidsmålinger» og «Knappetrykk fra dashboard». | Fast seksjonssett gjør rapporter sammenlignbare og sikrer at både plan, faktisk forløp og operatørhandlinger blir med.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-006 | Planen skal vise alle 15 faser med ID, rekkefølge, aktiv/deaktivert, navn, planlagt tid og antall lagrede/aktive punkter. | Planseksjonen dokumenterer også deaktiverte plasser og skiller lagret konfigurasjon fra det som faktisk var aktivt.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-007 | Fasetabellen skal sorteres kronologisk etter faktisk starttid. `Start/slutt` skal være første kolonne og vises som `HH:MM:SS – HH:MM:SS`. Gjentatte gjennomføringer skal nummereres som forsøk. | Komplette tidsstempler skal fortsatt brukes internt til sortering og beregning, også ved A → B → A-forløp.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RAP-008 | Kronologisk logg skal vise klokkeslett, fase, fasepunktnavn, beskrivelse, forventet verdi/kommentar og tidsplan. Når en fase har flere forsøk, skal alle dens punkt- og kommentarrader merkes `(forsøk n)`. | Faser med bare ett forsøk skal ikke nummereres.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RAP-009 | Automatisk nådde fasepunkter skal vise `Fasepunkt nådd ihht tidsplan`. Fasehoppede punkter skal vise beregnet avvik, for eksempel `Fasepunkt fasehoppet 1:31 før tidsplan`. Kommentarer skal fortsatt ha egen lys gul radmarkering. | Teknisk tickforsinkelse skal ikke framstilles som prosessavvik.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RAP-010 | Tidsmålinger skal vise timertekst, start, slutt, resultat og status for aktiverte timere. Start og slutt skal vises som `HH:MM:SS`. | Komplette tidsstempler beholdes i modell og journal; bare rapportvisningen forkortes.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RAP-011 | Knappetabellen skal vise alle reelle dashboardknappetrykk med klokkeslett, fase, fasepunktkontekst, knapp, kommando og resultat. Automatiske systemhandlinger skal ikke forekomme som knappetrykk. | Utførte, sperrede, ignorerte dobbelttrykk og feilede handlinger skal være komplette, inkludert nødavslutnings- og klargjøringsforsøk.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

### 11.2 Lagring og publisering

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-RAP-012 | Originalrapport skal lagres atomisk under `/data/brewing-assistant/reports`. | Arkivfilen bruker samme sikre skrivemønster som andre kritiske filer, slik at en halv HTML-fil ikke blir stående som gyldig rapport.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-013 | Filnavnet skal inneholde lokalt tidsstempel, sikkert batch/template-stem og suffikset `brewday-report.html`. | Navnet gjør rapporten sorterbar og gjenkjennelig uten å åpne den, samtidig som templatekomponenten renses for usikre tegn.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-014 | Nyeste rapport skal kopieres atomisk til `/data/brewing-assistant/ha-public/siste-bryggerapport.html`, som Home Assistant eksponerer på `/local/brygging/siste-bryggerapport.html`. | Den faste filen er målet alle dashboardlenker bruker. En ufullstendig kopi skal aldri bli synlig som ferdig public-rapport.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-015 | Publisert kopi skal SHA-256-verifiseres mot originalen. Avvik skal kunne utløse automatisk republisering. | Verifisering oppdager manglende eller avbrutt publisering. Automatisk republisering kan rette kopien uten å regenerere rapporten.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-016 | Rapportskrivingsfeil skal gi vedvarende diagnostikk og logghendelse, men skal ikke i seg selv ødelegge bryggedagens state. | Rapporttap skal varsles, men en ellers pågående bryggedag skal kunne fortsette og senere generere rapport på nytt fra state.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-017 | Kommando fra `button.brygging_behold_siste_100_rapporter` skal slette alle arkivrapporter unntatt de 100 nyeste og deretter oppdatere `sensor.brygging_rapportarkiv`. | Sletting skal bare skje etter eksplisitt operatørhandling. Nyeste rapport og public-kopi skal fortsatt kunne identifiseres etter ny skann.<br><br>**Observerbar effekt og kontroll:** Generer rapport med HTML-tegn, flere faseforsøk, kommentarer og knappresultater; innhold, escaping, arkivfil, public-hash og opprydding skal verifiseres. |
| NR-RAP-018 | Alle tabellheadere i rapporten skal bruke en tydelig grå bakgrunn, `#bfbfbf`, med tilstrekkelig kontrast mot tekst og datarader. | Tidligere lys gul header skal erstattes; øvrige semantiske radfarger beholdes med mindre et eget krav endrer dem.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |
| NR-RAP-019 | En `state_restored`-rad i kronologisk logg skal umiddelbart vise hvor prosessen fortsatte etter restart. | Raden skal vise fase/forsøk, aktuelt eller neste fasepunkt, restartklokkeslett, forløpt fasetid og før-/etter-posisjon relativt til punktets planlagte tidspunkt.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 12. Feilhåndtering og diagnostikk

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-FEIL-001 | Diagnostikk skal skille aktive feil/advarsler fra historisk siste feil/advarsel. | «Aktiv» beskriver et problem som fortsatt gjelder; «siste» bevarer historikk etter at problemet er rettet. Begrepene skal ikke blandes.<br><br>**Observerbar effekt og kontroll:** Fremkall og rett én feil per kilde; aktiv feil skal bestå gjennom irrelevante handlinger og først forsvinne etter vellykket kontroll av samme kilde. |
| NR-FEIL-002 | En aktiv feil skal beholdes gjennom vanlige ticks og kommandoer og bare fjernes når samme kilde senere består kontroll eller operasjon. | Feilkilden selv må bevise bedring. En vellykket, irrelevant handling skal ikke skjule en fortsatt skrive- eller forbindelsesfeil.<br><br>**Observerbar effekt og kontroll:** Fremkall og rett én feil per kilde; aktiv feil skal bestå gjennom irrelevante handlinger og først forsvinne etter vellykket kontroll av samme kilde. |
| NR-FEIL-003 | Runtimevalideringsfeil skal sette status `error` og logges. | Ugyldig autoritativ state gjør videre kommandoer usikre. `error` og logg gir en kontrollert stopp for feilsøking.<br><br>**Observerbar effekt og kontroll:** Fremkall og rett én feil per kilde; aktiv feil skal bestå gjennom irrelevante handlinger og først forsvinne etter vellykket kontroll av samme kilde. |
| NR-FEIL-004 | Feil i state, JSONL, template, rapport, public-kopi og HA-inndata skal registreres per kilde. | Kildeinndeling gjør at en vellykket rapportskriving ikke kvitterer en statefeil, og omvendt.<br><br>**Observerbar effekt og kontroll:** Fremkall og rett én feil per kilde; aktiv feil skal bestå gjennom irrelevante handlinger og først forsvinne etter vellykket kontroll av samme kilde. |
| NR-FEIL-005 | `sensor.brygging_status` skal publisere aktuell systemhelse, aktiv feil/advarsel, historisk siste feil, antall feil/advarsler, restore-resultat og siste vellykkede kommando. | Dette er diagnostikkinnholdet som forbrukes av dashboard og feilsøking. Det supplerer, men erstatter ikke detaljradene på `sensor.brygging_systemkontroll`.<br><br>**Observerbar effekt og kontroll:** Fremkall og rett én feil per kilde; aktiv feil skal bestå gjennom irrelevante handlinger og først forsvinne etter vellykket kontroll av samme kilde. |
| NR-FEIL-006 | Lagringsfeil skal ikke skrives til en intern sidekanal uten leser. Hver feil skal enten oppdatere autoritativ diagnostikk per kilde eller dokumenteres som allerede fullstendig håndtert av den aktuelle skrivebanen. | `storage_operation_error` og tilsvarende write-only felt skal fjernes når de ikke inngår i faktisk feilhåndtering.<br><br>**Observerbar effekt og kontroll:** Kravet skal ha en navngitt automatisert kontroll når dette er teknisk mulig, og ellers en eksplisitt målmiljøtest i sporbarhetsmatrisen. |

## 13. Ikke-funksjonelle krav

| ID | Presist krav | Forklaring og praktisk betydning |
|---|---|---|
| NR-NF-001 | Flowen skal tåle Node-RED-restart og Home Assistant-reconnect uten tap av gyldig, allerede persistert state. | Allerede bekreftet og lagret arbeid skal kunne rekonstrueres etter prosess- eller nettverksavbrudd.<br><br>**Observerbar effekt og kontroll:** Kjør statisk syntaks-, restart-, reconnect- og ressursregresjon; persistert state skal overleve og meldings-/minnegrenser skal forbli avgrenset. |
| NR-NF-002 | Atomisk lagring og forrige state skal begrense risikoen for korrupt primær state ved strømbrudd. | Rename og previous-state reduserer skadeomfanget ved strømbrudd, men erstatter ikke ordinær backup av vertslagringen.<br><br>**Observerbar effekt og kontroll:** Kjør statisk syntaks-, restart-, reconnect- og ressursregresjon; persistert state skal overleve og meldings-/minnegrenser skal forbli avgrenset. |
| NR-NF-003 | Publisering og editorsynk skal være avgrenset slik at feedback-løkker og ukontrollert heapvekst unngås. | Meldingstrafikk og datastrukturer må ha eksplisitte grenser for å unngå selvforsterkende HA-ekko eller ubegrenset minnebruk.<br><br>**Observerbar effekt og kontroll:** Kjør statisk syntaks-, restart-, reconnect- og ressursregresjon; persistert state skal overleve og meldings-/minnegrenser skal forbli avgrenset. |
| NR-NF-004 | Alle Function-noder skal ha gyldig JavaScript-syntaks i aktuell Node.js/Node-RED-runtime. | En syntaksfeil i én Function-node kan hindre sentral logikk i å lastes. Derfor valideres alle funksjoner som del av leveransen.<br><br>**Observerbar effekt og kontroll:** Kjør statisk syntaks-, restart-, reconnect- og ressursregresjon; persistert state skal overleve og meldings-/minnegrenser skal forbli avgrenset. |
| NR-NF-005 | Produksjonsmiljøet bør bruke eksplisitt pinnede versjoner av Node-RED-image og HA-nodepakken, ikke `latest`. | Pinned image- og pakkeversjon gjør produksjonsmiljøet reproduserbart. Dette styres i drifts-/Compose-konfigurasjonen, ikke i flowen.<br><br>**Observerbar effekt og kontroll:** Kontroller produksjonens Compose-/driftskonfigurasjon; image og HA-nodepakke skal ha eksplisitte versjoner og ingen produksjonsavhengighet skal bruke `latest`. |
| NR-NF-006 | Entitets- og filgrensesnitt skal være versjonssporbart gjennom flow-, runtime- og schemaversjon. | Filer og publiserte metadata skal vise både produkt- og dataschemaversjon slik at avvik kan spores ved support og restore.<br><br>**Observerbar effekt og kontroll:** Kjør statisk syntaks-, restart-, reconnect- og ressursregresjon; persistert state skal overleve og meldings-/minnegrenser skal forbli avgrenset. |

## 14. Akseptansekriterier

Modulen kan godkjennes for 1.0 når:

1. Alle 159 navngitte runtime-/regresjonstester fra RC3.3.2 består.
2. Streng validator godtar referansetemplaten og avviser eldre/ugyldige schema.
3. Start-preflight sperrer alle startkritiske feil og slipper gjennom et friskt system.
4. En akselerert full syklus med pause, fortsett, bekreftelse, kommentar, dobbelttrykk, «Tilbake», fasehopp, timere, rapport og nullstilling består.
5. Restore består fra current-state, previous-state og templatefallback.
6. Restart under `running`, `paused` og `waiting_confirmation` bevarer prosessen.
7. Home Assistant-frakobling og reconnect gir kontrollert retry og full resynk.
8. Skrivefeil i state og logg gir vedvarende feil og ryddes etter vellykket ny operasjon.
9. Rapporten inneholder alle avtalte seksjoner og korrekt forsøksnummerering.
10. 24–48 timers idle-test og én komplett, reell bryggedag er gjennomført på produksjonsmaskinen.

RC3.3.2-baselinen og 2026.11.07-1 består samme runtime-regresjon: 7154 tekniske assertions i 159 navngitte tester, men dette beviser fortsatt ikke alle funksjonelle krav. Bare dokumenterte test- og målmiljøresultater i matrisen skal brukes som godkjenningsstatus. Langtidstest og full live-brygging gjenstår før endelig `v1.0.0`.

## 15. Kjente avgrensninger

- Template- og stateschema `1.0` er uavhengig av applikasjonsversjon `1.0.0`.
- Faste 15 fase-, fasepunkt- og timerplasser er en bevisst Home Assistant-integrasjonsgrense.
- Flowen kan oppgi containerens systemtid, men kan ikke bevise ekstern NTP-korrekthet.
- Flere Home Assistant-klienter kan vise samme state samtidig, men runtime har ingen operatørlås, brukerspesifikk editorkladd eller konfliktvarsling for motstridende samtidige kommandoer.
- State og JSONL er separate skriv. Atomisk state er den primære restorekilden dersom strømmen forsvinner mellom de to operasjonene.

### 15.1 RC3.3.2-avvik som 2026.11.07-1 lukker

- automatisk oppstartsrefresh er feilklassifisert som dashboardknapp
- vellykket restore produserer ikke `state_restored`
- restore-resultatet mangler fasepunkt og tidsposisjon i rapporten
- rapportheadere har for svak lys gul bakgrunn
- produksjonsfanens etikett er foreldet, og dokumentasjonsfanen skal fjernes
- fire flow-contextnøkler og én lagringsfeilkanal er write-only
- rapportmotoren har produsent-/konsumentavvik i hendelseslisten
- deaktivert fasepunkt med tomt navn avvises, noe som hindrer en statisk Excel-generator med alle 15 plasser

Disse punktene er implementert i 2026.11.07-1 og har krav-ID-merkede automatiske kontroller. Målmiljøakseptansen står separat i sporbarhetsmatrisen.

## 16. Sporbarhet

Kravene skal spores gjennom dokumentet `KRAV-SPORBARHET-2026.11.07-1.html`. Normative kilder er:

- faktisk 2026.11.07-1-flow, dashboard, installer og template med 7154 kontroller i 159 navngitte tester
- urørt RC3.3.2-regresjonsgrunnlag med 7154 kontroller i 159 navngitte tester
- entitets- og attributtkontrakten for RC3.3.2
- Node-RED variabel- og dataflytkontrakt for RC3.3.2
- verifiserte målmiljøfunn fra templatekatalog, templatelagring, rapport og restart
- godkjente prosjektbeslutninger fram til 26. august 2026
