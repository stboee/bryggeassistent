# Home Assistant–Node-RED entitets- og attributtkontrakt – 2026.11.07-1

## 1. Dokumentstatus

| Felt | Verdi |
|---|---|
| Dokumenttype | Normativ teknisk grensekontrakt |
| Kilde | Faktisk pakket 2026.11.07-1-flow og dashboard |
| Flow SHA-256 | `93e6ba95cc1f8793222728c35d7fd5f59da006c6de979890a91ca1f9d87291f2` |
| Release | 2026.11.07-1 |
| Schema | state/event/template 1.0 |
| Status | Komplett og verifiserbar |

Denne kontrakten erstatter tidligere reduserte kontraktutgaver. Gyldige datatype- og tomtilstandsregler er konsolidert, mens alle ID-er, navn, produsenter og dashboardreferanser er regenerert fra denne releasen.

## 2. Omfang og grenseregler

- Node-RED er autoritativ produsent for de 15 sensorskjemaene; Home Assistant sender de 215 kontrollentitetene inn til streng validering.
- Tekstgrenser er 120 eller 255 Unicode-kodepunkter. For lange verdier avvises; de trunkeres ikke.
- Norske synlige enumverdier brukes ved HA-grensen. Tekniske koder beholdes i template, runtime og journal.
- Alle utgående state-/attributtobjekter valideres før publisering. Ugyldig kandidat skal ikke erstatte siste gyldige verdi.
- Dashboardet skal ikke oversette, typekonvertere eller reparere ugyldige produsentdata.
- `unknown` og `unavailable` er HA-transporttilstander og ikke gyldige Node-RED-verdier.

## 3. Fullstendighet

| Målepunkt | Antall |
|---|---:|
| Totalt | 230 |
| Sensorer | 15 |
| Knapper | 17 |
| Selecter | 87 |
| Tall | 48 |
| Tekster | 63 |
| Kontrollentiteter | 215 |
| Toppnivåattributter | 51 |
| Strukturerte objektfelt | 27 |

## 4. Komplett entitetsinventar

| Entity-ID | Retning | Synlig HA-navn | Type, grense eller initialt valg | Node-RED-eier | Dashboardreferanser |
|---|---|---|---|---|---:|
| `button.brygging_avslutt` | HA ↔ Node-RED | Avslutt | Diskret trykk; ingen applikasjons-state | brygging_avslutt | 1 |
| `button.brygging_behold_siste_100_rapporter` | HA ↔ Node-RED | Behold siste 100 rapporter | Diskret trykk; ingen applikasjons-state | Behold siste 100 rapporter | 1 |
| `button.brygging_bekreft_fasepunkt` | HA ↔ Node-RED | Bekreft fasepunkt | Diskret trykk; ingen applikasjons-state | brygging_bekreft_fasepunkt | 1 |
| `button.brygging_forkast_templateendringer` | HA ↔ Node-RED | Forkast templateendringer | Diskret trykk; ingen applikasjons-state | brygging_forkast_templateendringer | 3 |
| `button.brygging_fortsett` | HA ↔ Node-RED | Fortsett | Diskret trykk; ingen applikasjons-state | brygging_fortsett | 1 |
| `button.brygging_generer_historisk_rapport` | HA ↔ Node-RED | Generer historisk rapport | Diskret trykk; ingen applikasjons-state | brygging_generer_historisk_rapport | 1 |
| `button.brygging_generer_rapport` | HA ↔ Node-RED | Generer rapport | Diskret trykk; ingen applikasjons-state | brygging_generer_rapport | 2 |
| `button.brygging_klargjor_ny_bryggedag` | HA ↔ Node-RED | Klargjør ny bryggedag | Diskret trykk; ingen applikasjons-state | brygging_klargjor_ny_bryggedag | 1 |
| `button.brygging_lagre_fasepunktkommentar` | HA ↔ Node-RED | Lagre fasepunktkommentar | Diskret trykk; ingen applikasjons-state | brygging_lagre_fasepunktkommentar | 1 |
| `button.brygging_lagre_template` | HA ↔ Node-RED | Lagre template | Diskret trykk; ingen applikasjons-state | brygging_lagre_template | 3 |
| `button.brygging_neste_fase` | HA ↔ Node-RED | Neste fase | Diskret trykk; ingen applikasjons-state | brygging_neste_fase | 1 |
| `button.brygging_nodavslutt_ved_systemfeil` | HA ↔ Node-RED | Nødavslutt ved systemfeil | Diskret trykk; ingen applikasjons-state | brygging_nodavslutt_ved_systemfeil | 1 |
| `button.brygging_oppdater_systemkontroll` | HA ↔ Node-RED | Oppdater systemkontroll | Diskret trykk; ingen applikasjons-state | brygging_oppdater_systemkontroll | 1 |
| `button.brygging_oppdater_templateliste` | HA ↔ Node-RED | Oppdater templateliste | Diskret trykk; ingen applikasjons-state | Oppdater templateliste | 1 |
| `button.brygging_pause` | HA ↔ Node-RED | Pause | Diskret trykk; ingen applikasjons-state | brygging_pause | 1 |
| `button.brygging_start` | HA ↔ Node-RED | Start | Diskret trykk; ingen applikasjons-state | brygging_start | 1 |
| `button.brygging_tilbake` | HA ↔ Node-RED | Tilbake | Diskret trykk; ingen applikasjons-state | brygging_tilbake | 1 |
| `number.brygging_fase_01_rekkefolge` | HA ↔ Node-RED | Fase 01 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_01_rekkefolge | 1 |
| `number.brygging_fase_01_varighet_min` | HA ↔ Node-RED | Fase 01 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_01_varighet_min | 1 |
| `number.brygging_fase_02_rekkefolge` | HA ↔ Node-RED | Fase 02 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_02_rekkefolge | 1 |
| `number.brygging_fase_02_varighet_min` | HA ↔ Node-RED | Fase 02 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_02_varighet_min | 1 |
| `number.brygging_fase_03_rekkefolge` | HA ↔ Node-RED | Fase 03 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_03_rekkefolge | 1 |
| `number.brygging_fase_03_varighet_min` | HA ↔ Node-RED | Fase 03 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_03_varighet_min | 1 |
| `number.brygging_fase_04_rekkefolge` | HA ↔ Node-RED | Fase 04 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_04_rekkefolge | 1 |
| `number.brygging_fase_04_varighet_min` | HA ↔ Node-RED | Fase 04 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_04_varighet_min | 1 |
| `number.brygging_fase_05_rekkefolge` | HA ↔ Node-RED | Fase 05 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_05_rekkefolge | 1 |
| `number.brygging_fase_05_varighet_min` | HA ↔ Node-RED | Fase 05 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_05_varighet_min | 1 |
| `number.brygging_fase_06_rekkefolge` | HA ↔ Node-RED | Fase 06 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_06_rekkefolge | 1 |
| `number.brygging_fase_06_varighet_min` | HA ↔ Node-RED | Fase 06 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_06_varighet_min | 1 |
| `number.brygging_fase_07_rekkefolge` | HA ↔ Node-RED | Fase 07 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_07_rekkefolge | 1 |
| `number.brygging_fase_07_varighet_min` | HA ↔ Node-RED | Fase 07 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_07_varighet_min | 1 |
| `number.brygging_fase_08_rekkefolge` | HA ↔ Node-RED | Fase 08 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_08_rekkefolge | 1 |
| `number.brygging_fase_08_varighet_min` | HA ↔ Node-RED | Fase 08 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_08_varighet_min | 1 |
| `number.brygging_fase_09_rekkefolge` | HA ↔ Node-RED | Fase 09 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_09_rekkefolge | 1 |
| `number.brygging_fase_09_varighet_min` | HA ↔ Node-RED | Fase 09 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_09_varighet_min | 1 |
| `number.brygging_fase_10_rekkefolge` | HA ↔ Node-RED | Fase 10 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_10_rekkefolge | 1 |
| `number.brygging_fase_10_varighet_min` | HA ↔ Node-RED | Fase 10 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_10_varighet_min | 1 |
| `number.brygging_fase_11_rekkefolge` | HA ↔ Node-RED | Fase 11 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_11_rekkefolge | 1 |
| `number.brygging_fase_11_varighet_min` | HA ↔ Node-RED | Fase 11 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_11_varighet_min | 1 |
| `number.brygging_fase_12_rekkefolge` | HA ↔ Node-RED | Fase 12 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_12_rekkefolge | 1 |
| `number.brygging_fase_12_varighet_min` | HA ↔ Node-RED | Fase 12 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_12_varighet_min | 1 |
| `number.brygging_fase_13_rekkefolge` | HA ↔ Node-RED | Fase 13 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_13_rekkefolge | 1 |
| `number.brygging_fase_13_varighet_min` | HA ↔ Node-RED | Fase 13 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_13_varighet_min | 1 |
| `number.brygging_fase_14_rekkefolge` | HA ↔ Node-RED | Fase 14 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_14_rekkefolge | 1 |
| `number.brygging_fase_14_varighet_min` | HA ↔ Node-RED | Fase 14 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_14_varighet_min | 1 |
| `number.brygging_fase_15_rekkefolge` | HA ↔ Node-RED | Fase 15 – rekkefølge | heltall 1…15, steg 1 | brygging_fase_15_rekkefolge | 1 |
| `number.brygging_fase_15_varighet_min` | HA ↔ Node-RED | Fase 15 – varighet (min) | heltall 0…1440, steg 1 min | brygging_fase_15_varighet_min | 1 |
| `number.brygging_punkt_01_tid_min` | HA ↔ Node-RED | Punkt 01 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_01_tid_min | 1 |
| `number.brygging_punkt_02_tid_min` | HA ↔ Node-RED | Punkt 02 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_02_tid_min | 1 |
| `number.brygging_punkt_03_tid_min` | HA ↔ Node-RED | Punkt 03 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_03_tid_min | 1 |
| `number.brygging_punkt_04_tid_min` | HA ↔ Node-RED | Punkt 04 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_04_tid_min | 1 |
| `number.brygging_punkt_05_tid_min` | HA ↔ Node-RED | Punkt 05 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_05_tid_min | 1 |
| `number.brygging_punkt_06_tid_min` | HA ↔ Node-RED | Punkt 06 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_06_tid_min | 1 |
| `number.brygging_punkt_07_tid_min` | HA ↔ Node-RED | Punkt 07 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_07_tid_min | 1 |
| `number.brygging_punkt_08_tid_min` | HA ↔ Node-RED | Punkt 08 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_08_tid_min | 1 |
| `number.brygging_punkt_09_tid_min` | HA ↔ Node-RED | Punkt 09 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_09_tid_min | 1 |
| `number.brygging_punkt_10_tid_min` | HA ↔ Node-RED | Punkt 10 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_10_tid_min | 1 |
| `number.brygging_punkt_11_tid_min` | HA ↔ Node-RED | Punkt 11 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_11_tid_min | 1 |
| `number.brygging_punkt_12_tid_min` | HA ↔ Node-RED | Punkt 12 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_12_tid_min | 1 |
| `number.brygging_punkt_13_tid_min` | HA ↔ Node-RED | Punkt 13 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_13_tid_min | 1 |
| `number.brygging_punkt_14_tid_min` | HA ↔ Node-RED | Punkt 14 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_14_tid_min | 1 |
| `number.brygging_punkt_15_tid_min` | HA ↔ Node-RED | Punkt 15 tid min | heltall -1440…1440, steg 1 min | brygging_punkt_15_tid_min | 1 |
| `number.brygging_timer_rekkefolge` | HA ↔ Node-RED | Timer rekkefølge | heltall 1…15, steg 1 | brygging_timer_rekkefolge | 1 |
| `number.brygging_timer_slutt_offset_min` | HA ↔ Node-RED | Timer slutt offset min | heltall -1440…1440, steg 1 min | brygging_timer_slutt_offset_min | 1 |
| `number.brygging_timer_start_offset_min` | HA ↔ Node-RED | Timer start offset min | heltall -1440…1440, steg 1 min | brygging_timer_start_offset_min | 1 |
| `select.brygging_fase_01_status` | HA ↔ Node-RED | Fase 01 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_01_status | 1 |
| `select.brygging_fase_02_status` | HA ↔ Node-RED | Fase 02 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_02_status | 1 |
| `select.brygging_fase_03_status` | HA ↔ Node-RED | Fase 03 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_03_status | 1 |
| `select.brygging_fase_04_status` | HA ↔ Node-RED | Fase 04 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_04_status | 1 |
| `select.brygging_fase_05_status` | HA ↔ Node-RED | Fase 05 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_05_status | 1 |
| `select.brygging_fase_06_status` | HA ↔ Node-RED | Fase 06 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_06_status | 1 |
| `select.brygging_fase_07_status` | HA ↔ Node-RED | Fase 07 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_07_status | 1 |
| `select.brygging_fase_08_status` | HA ↔ Node-RED | Fase 08 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_08_status | 1 |
| `select.brygging_fase_09_status` | HA ↔ Node-RED | Fase 09 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_09_status | 1 |
| `select.brygging_fase_10_status` | HA ↔ Node-RED | Fase 10 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_10_status | 1 |
| `select.brygging_fase_11_status` | HA ↔ Node-RED | Fase 11 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_11_status | 1 |
| `select.brygging_fase_12_status` | HA ↔ Node-RED | Fase 12 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_12_status | 1 |
| `select.brygging_fase_13_status` | HA ↔ Node-RED | Fase 13 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_13_status | 1 |
| `select.brygging_fase_14_status` | HA ↔ Node-RED | Fase 14 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_14_status | 1 |
| `select.brygging_fase_15_status` | HA ↔ Node-RED | Fase 15 – status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_fase_15_status | 1 |
| `select.brygging_fasepunkt_for_kommentar` | HA ↔ Node-RED | Fasepunkt for kommentar | Enum/dynamisk valg: ["Neste aktuelle fasepunkt","Forrige aktuelle fasepunkt"] | brygging_fasepunkt_for_kommentar; Oppdater brygging_fasepunkt_for_kommentar | 1 |
| `select.brygging_historisk_sesjon` | HA ↔ Node-RED | Historisk sesjon | Enum/dynamisk valg: ["Ingen sesjoner"] | brygging_historisk_sesjon; Oppdater historiske sesjoner | 1 |
| `select.brygging_punkt_01_aktiv` | HA ↔ Node-RED | Punkt 01 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_01_aktiv | 1 |
| `select.brygging_punkt_01_bekreftelse` | HA ↔ Node-RED | Punkt 01 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_01_bekreftelse | 1 |
| `select.brygging_punkt_01_tid_ref` | HA ↔ Node-RED | Punkt 01 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_01_tid_ref | 1 |
| `select.brygging_punkt_01_type` | HA ↔ Node-RED | Punkt 01 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_01_type | 1 |
| `select.brygging_punkt_02_aktiv` | HA ↔ Node-RED | Punkt 02 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_02_aktiv | 1 |
| `select.brygging_punkt_02_bekreftelse` | HA ↔ Node-RED | Punkt 02 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_02_bekreftelse | 1 |
| `select.brygging_punkt_02_tid_ref` | HA ↔ Node-RED | Punkt 02 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_02_tid_ref | 1 |
| `select.brygging_punkt_02_type` | HA ↔ Node-RED | Punkt 02 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_02_type | 1 |
| `select.brygging_punkt_03_aktiv` | HA ↔ Node-RED | Punkt 03 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_03_aktiv | 1 |
| `select.brygging_punkt_03_bekreftelse` | HA ↔ Node-RED | Punkt 03 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_03_bekreftelse | 1 |
| `select.brygging_punkt_03_tid_ref` | HA ↔ Node-RED | Punkt 03 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_03_tid_ref | 1 |
| `select.brygging_punkt_03_type` | HA ↔ Node-RED | Punkt 03 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_03_type | 1 |
| `select.brygging_punkt_04_aktiv` | HA ↔ Node-RED | Punkt 04 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_04_aktiv | 1 |
| `select.brygging_punkt_04_bekreftelse` | HA ↔ Node-RED | Punkt 04 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_04_bekreftelse | 1 |
| `select.brygging_punkt_04_tid_ref` | HA ↔ Node-RED | Punkt 04 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_04_tid_ref | 1 |
| `select.brygging_punkt_04_type` | HA ↔ Node-RED | Punkt 04 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_04_type | 1 |
| `select.brygging_punkt_05_aktiv` | HA ↔ Node-RED | Punkt 05 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_05_aktiv | 1 |
| `select.brygging_punkt_05_bekreftelse` | HA ↔ Node-RED | Punkt 05 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_05_bekreftelse | 1 |
| `select.brygging_punkt_05_tid_ref` | HA ↔ Node-RED | Punkt 05 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_05_tid_ref | 1 |
| `select.brygging_punkt_05_type` | HA ↔ Node-RED | Punkt 05 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_05_type | 1 |
| `select.brygging_punkt_06_aktiv` | HA ↔ Node-RED | Punkt 06 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_06_aktiv | 1 |
| `select.brygging_punkt_06_bekreftelse` | HA ↔ Node-RED | Punkt 06 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_06_bekreftelse | 1 |
| `select.brygging_punkt_06_tid_ref` | HA ↔ Node-RED | Punkt 06 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_06_tid_ref | 1 |
| `select.brygging_punkt_06_type` | HA ↔ Node-RED | Punkt 06 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_06_type | 1 |
| `select.brygging_punkt_07_aktiv` | HA ↔ Node-RED | Punkt 07 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_07_aktiv | 1 |
| `select.brygging_punkt_07_bekreftelse` | HA ↔ Node-RED | Punkt 07 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_07_bekreftelse | 1 |
| `select.brygging_punkt_07_tid_ref` | HA ↔ Node-RED | Punkt 07 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_07_tid_ref | 1 |
| `select.brygging_punkt_07_type` | HA ↔ Node-RED | Punkt 07 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_07_type | 1 |
| `select.brygging_punkt_08_aktiv` | HA ↔ Node-RED | Punkt 08 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_08_aktiv | 1 |
| `select.brygging_punkt_08_bekreftelse` | HA ↔ Node-RED | Punkt 08 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_08_bekreftelse | 1 |
| `select.brygging_punkt_08_tid_ref` | HA ↔ Node-RED | Punkt 08 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_08_tid_ref | 1 |
| `select.brygging_punkt_08_type` | HA ↔ Node-RED | Punkt 08 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_08_type | 1 |
| `select.brygging_punkt_09_aktiv` | HA ↔ Node-RED | Punkt 09 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_09_aktiv | 1 |
| `select.brygging_punkt_09_bekreftelse` | HA ↔ Node-RED | Punkt 09 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_09_bekreftelse | 1 |
| `select.brygging_punkt_09_tid_ref` | HA ↔ Node-RED | Punkt 09 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_09_tid_ref | 1 |
| `select.brygging_punkt_09_type` | HA ↔ Node-RED | Punkt 09 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_09_type | 1 |
| `select.brygging_punkt_10_aktiv` | HA ↔ Node-RED | Punkt 10 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_10_aktiv | 1 |
| `select.brygging_punkt_10_bekreftelse` | HA ↔ Node-RED | Punkt 10 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_10_bekreftelse | 1 |
| `select.brygging_punkt_10_tid_ref` | HA ↔ Node-RED | Punkt 10 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_10_tid_ref | 1 |
| `select.brygging_punkt_10_type` | HA ↔ Node-RED | Punkt 10 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_10_type | 1 |
| `select.brygging_punkt_11_aktiv` | HA ↔ Node-RED | Punkt 11 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_11_aktiv | 1 |
| `select.brygging_punkt_11_bekreftelse` | HA ↔ Node-RED | Punkt 11 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_11_bekreftelse | 1 |
| `select.brygging_punkt_11_tid_ref` | HA ↔ Node-RED | Punkt 11 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_11_tid_ref | 1 |
| `select.brygging_punkt_11_type` | HA ↔ Node-RED | Punkt 11 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_11_type | 1 |
| `select.brygging_punkt_12_aktiv` | HA ↔ Node-RED | Punkt 12 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_12_aktiv | 1 |
| `select.brygging_punkt_12_bekreftelse` | HA ↔ Node-RED | Punkt 12 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_12_bekreftelse | 1 |
| `select.brygging_punkt_12_tid_ref` | HA ↔ Node-RED | Punkt 12 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_12_tid_ref | 1 |
| `select.brygging_punkt_12_type` | HA ↔ Node-RED | Punkt 12 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_12_type | 1 |
| `select.brygging_punkt_13_aktiv` | HA ↔ Node-RED | Punkt 13 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_13_aktiv | 1 |
| `select.brygging_punkt_13_bekreftelse` | HA ↔ Node-RED | Punkt 13 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_13_bekreftelse | 1 |
| `select.brygging_punkt_13_tid_ref` | HA ↔ Node-RED | Punkt 13 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_13_tid_ref | 1 |
| `select.brygging_punkt_13_type` | HA ↔ Node-RED | Punkt 13 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_13_type | 1 |
| `select.brygging_punkt_14_aktiv` | HA ↔ Node-RED | Punkt 14 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_14_aktiv | 1 |
| `select.brygging_punkt_14_bekreftelse` | HA ↔ Node-RED | Punkt 14 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_14_bekreftelse | 1 |
| `select.brygging_punkt_14_tid_ref` | HA ↔ Node-RED | Punkt 14 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_14_tid_ref | 1 |
| `select.brygging_punkt_14_type` | HA ↔ Node-RED | Punkt 14 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_14_type | 1 |
| `select.brygging_punkt_15_aktiv` | HA ↔ Node-RED | Punkt 15 aktiv | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_punkt_15_aktiv | 1 |
| `select.brygging_punkt_15_bekreftelse` | HA ↔ Node-RED | Punkt 15 bekreftelse | Enum/dynamisk valg: ["Ja","Nei"] | brygging_punkt_15_bekreftelse | 1 |
| `select.brygging_punkt_15_tid_ref` | HA ↔ Node-RED | Punkt 15 tid ref | Enum/dynamisk valg: ["Fasestart","Faseslutt"] | brygging_punkt_15_tid_ref | 1 |
| `select.brygging_punkt_15_type` | HA ↔ Node-RED | Punkt 15 type | Enum/dynamisk valg: ["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"] | brygging_punkt_15_type | 1 |
| `select.brygging_rediger_fase` | HA ↔ Node-RED | Rediger fase | Enum/dynamisk valg: ["01 – laster template"] | brygging_rediger_fase; Oppdater brygging_rediger_fase | 1 |
| `select.brygging_rediger_timer` | HA ↔ Node-RED | Rediger timer | Enum/dynamisk valg: ["timer_01"] | brygging_rediger_timer; Oppdater timervalg | 1 |
| `select.brygging_template` | HA ↔ Node-RED | Template | Enum/dynamisk valg: ["Ingen valgt"] | brygging_template; Oppdater brygging_template | 1 |
| `select.brygging_timer_pauseoppforsel` | HA ↔ Node-RED | Timer pauseoppforsel | Enum/dynamisk valg: ["Følg bryggepause","Fortsett etter klokke"] | brygging_timer_pauseoppforsel | 1 |
| `select.brygging_timer_retning` | HA ↔ Node-RED | Timer retning | Enum/dynamisk valg: ["Tell opp","Tell ned"] | brygging_timer_retning | 1 |
| `select.brygging_timer_slutt_hendelse` | HA ↔ Node-RED | Timer slutt hendelse | Enum/dynamisk valg: ["Bryggestart (faktisk)","Bryggeslutt (løpende)","Bryggeslutt (faktisk)","Fasestart (planlagt)","Fasestart (faktisk)","Faseslutt (løpende)","Faseslutt (faktisk)","Fasepunkt (plantid)","Fasepunkt passert","Fasepunkt bekreftet"] | brygging_timer_slutt_hendelse | 1 |
| `select.brygging_timer_slutt_referanse` | HA ↔ Node-RED | Timer slutt referanse | Enum/dynamisk valg: ["–"] | brygging_timer_slutt_referanse; Oppdater sluttreferanser | 1 |
| `select.brygging_timer_start_hendelse` | HA ↔ Node-RED | Timer start hendelse | Enum/dynamisk valg: ["Bryggestart (faktisk)","Bryggeslutt (løpende)","Fasestart (planlagt)","Fasestart (faktisk)","Faseslutt (løpende)","Faseslutt (faktisk)","Fasepunkt (plantid)","Fasepunkt passert","Fasepunkt bekreftet"] | brygging_timer_start_hendelse | 1 |
| `select.brygging_timer_start_referanse` | HA ↔ Node-RED | Timer start referanse | Enum/dynamisk valg: ["–"] | brygging_timer_start_referanse; Oppdater startreferanser | 1 |
| `select.brygging_timer_status` | HA ↔ Node-RED | Timer status | Enum/dynamisk valg: ["Aktiv","Deaktivert"] | brygging_timer_status | 1 |
| `sensor.brygging_aktiv_fase` | Node-RED → HA | Aktiv fase | State og attributter etter sensorskjemaet nedenfor | brygging_aktiv_fase | 1 |
| `sensor.brygging_aktiv_template` | Node-RED → HA | Aktiv template | State og attributter etter sensorskjemaet nedenfor | brygging_aktiv_template | 129 |
| `sensor.brygging_driftsmeldinger` | Node-RED → HA | Driftsmeldinger | State og attributter etter sensorskjemaet nedenfor | brygging_driftsmeldinger | 1 |
| `sensor.brygging_estimert_ferdig_bryggedag` | Node-RED → HA | Estimert ferdig bryggedag | State og attributter etter sensorskjemaet nedenfor | brygging_estimert_ferdig_bryggedag | 1 |
| `sensor.brygging_faseoversikt` | Node-RED → HA | Faseoversikt | State og attributter etter sensorskjemaet nedenfor | brygging_faseoversikt | 1 |
| `sensor.brygging_fasepunktoversikt` | Node-RED → HA | Fasepunktoversikt | State og attributter etter sensorskjemaet nedenfor | brygging_fasepunktoversikt | 1 |
| `sensor.brygging_kommandoresultat` | Node-RED → HA | Kommandoresultat | State og attributter etter sensorskjemaet nedenfor | brygging_kommandoresultat | 1 |
| `sensor.brygging_neste_fasepunkt` | Node-RED → HA | Neste fasepunkt | State og attributter etter sensorskjemaet nedenfor | brygging_neste_fasepunkt | 2 |
| `sensor.brygging_rapportarkiv` | Node-RED → HA | Rapportarkiv | State og attributter etter sensorskjemaet nedenfor | brygging_rapportarkiv | 4 |
| `sensor.brygging_sesjonsarkiv` | Node-RED → HA | Sesjonsarkiv | State og attributter etter sensorskjemaet nedenfor | brygging_sesjonsarkiv | 1 |
| `sensor.brygging_siste_fasepunktkommentar` | Node-RED → HA | Siste fasepunktkommentar | State og attributter etter sensorskjemaet nedenfor | brygging_siste_fasepunktkommentar | 1 |
| `sensor.brygging_status` | Node-RED → HA | Status | State og attributter etter sensorskjemaet nedenfor | brygging_status | 95 |
| `sensor.brygging_systemkontroll` | Node-RED → HA | Systemkontroll | State og attributter etter sensorskjemaet nedenfor | brygging_systemkontroll | 1 |
| `sensor.brygging_tid_til_ferdig_bryggedag` | Node-RED → HA | Tid til ferdig bryggedag | State og attributter etter sensorskjemaet nedenfor | brygging_tid_til_ferdig_bryggedag | 1 |
| `sensor.brygging_timeroversikt` | Node-RED → HA | Timeroversikt | State og attributter etter sensorskjemaet nedenfor | brygging_timeroversikt | 1 |
| `text.brygging_fase_01_navn` | HA ↔ Node-RED | Fase 01 – navn | tekst 0…120 Unicode-tegn | brygging_fase_01_navn | 1 |
| `text.brygging_fase_02_navn` | HA ↔ Node-RED | Fase 02 – navn | tekst 0…120 Unicode-tegn | brygging_fase_02_navn | 1 |
| `text.brygging_fase_03_navn` | HA ↔ Node-RED | Fase 03 – navn | tekst 0…120 Unicode-tegn | brygging_fase_03_navn | 1 |
| `text.brygging_fase_04_navn` | HA ↔ Node-RED | Fase 04 – navn | tekst 0…120 Unicode-tegn | brygging_fase_04_navn | 1 |
| `text.brygging_fase_05_navn` | HA ↔ Node-RED | Fase 05 – navn | tekst 0…120 Unicode-tegn | brygging_fase_05_navn | 1 |
| `text.brygging_fase_06_navn` | HA ↔ Node-RED | Fase 06 – navn | tekst 0…120 Unicode-tegn | brygging_fase_06_navn | 1 |
| `text.brygging_fase_07_navn` | HA ↔ Node-RED | Fase 07 – navn | tekst 0…120 Unicode-tegn | brygging_fase_07_navn | 1 |
| `text.brygging_fase_08_navn` | HA ↔ Node-RED | Fase 08 – navn | tekst 0…120 Unicode-tegn | brygging_fase_08_navn | 1 |
| `text.brygging_fase_09_navn` | HA ↔ Node-RED | Fase 09 – navn | tekst 0…120 Unicode-tegn | brygging_fase_09_navn | 1 |
| `text.brygging_fase_10_navn` | HA ↔ Node-RED | Fase 10 – navn | tekst 0…120 Unicode-tegn | brygging_fase_10_navn | 1 |
| `text.brygging_fase_11_navn` | HA ↔ Node-RED | Fase 11 – navn | tekst 0…120 Unicode-tegn | brygging_fase_11_navn | 1 |
| `text.brygging_fase_12_navn` | HA ↔ Node-RED | Fase 12 – navn | tekst 0…120 Unicode-tegn | brygging_fase_12_navn | 1 |
| `text.brygging_fase_13_navn` | HA ↔ Node-RED | Fase 13 – navn | tekst 0…120 Unicode-tegn | brygging_fase_13_navn | 1 |
| `text.brygging_fase_14_navn` | HA ↔ Node-RED | Fase 14 – navn | tekst 0…120 Unicode-tegn | brygging_fase_14_navn | 1 |
| `text.brygging_fase_15_navn` | HA ↔ Node-RED | Fase 15 – navn | tekst 0…120 Unicode-tegn | brygging_fase_15_navn | 1 |
| `text.brygging_fasepunktkommentar` | HA ↔ Node-RED | Fasepunktkommentar | tekst 0…255 Unicode-tegn | brygging_fasepunktkommentar | 1 |
| `text.brygging_punkt_01_beskrivelse` | HA ↔ Node-RED | Punkt 01 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_01_beskrivelse | 1 |
| `text.brygging_punkt_01_forventet` | HA ↔ Node-RED | Punkt 01 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_01_forventet | 1 |
| `text.brygging_punkt_01_navn` | HA ↔ Node-RED | Punkt 01 navn | tekst 0…255 Unicode-tegn | brygging_punkt_01_navn | 1 |
| `text.brygging_punkt_02_beskrivelse` | HA ↔ Node-RED | Punkt 02 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_02_beskrivelse | 1 |
| `text.brygging_punkt_02_forventet` | HA ↔ Node-RED | Punkt 02 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_02_forventet | 1 |
| `text.brygging_punkt_02_navn` | HA ↔ Node-RED | Punkt 02 navn | tekst 0…255 Unicode-tegn | brygging_punkt_02_navn | 1 |
| `text.brygging_punkt_03_beskrivelse` | HA ↔ Node-RED | Punkt 03 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_03_beskrivelse | 1 |
| `text.brygging_punkt_03_forventet` | HA ↔ Node-RED | Punkt 03 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_03_forventet | 1 |
| `text.brygging_punkt_03_navn` | HA ↔ Node-RED | Punkt 03 navn | tekst 0…255 Unicode-tegn | brygging_punkt_03_navn | 1 |
| `text.brygging_punkt_04_beskrivelse` | HA ↔ Node-RED | Punkt 04 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_04_beskrivelse | 1 |
| `text.brygging_punkt_04_forventet` | HA ↔ Node-RED | Punkt 04 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_04_forventet | 1 |
| `text.brygging_punkt_04_navn` | HA ↔ Node-RED | Punkt 04 navn | tekst 0…255 Unicode-tegn | brygging_punkt_04_navn | 1 |
| `text.brygging_punkt_05_beskrivelse` | HA ↔ Node-RED | Punkt 05 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_05_beskrivelse | 1 |
| `text.brygging_punkt_05_forventet` | HA ↔ Node-RED | Punkt 05 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_05_forventet | 1 |
| `text.brygging_punkt_05_navn` | HA ↔ Node-RED | Punkt 05 navn | tekst 0…255 Unicode-tegn | brygging_punkt_05_navn | 1 |
| `text.brygging_punkt_06_beskrivelse` | HA ↔ Node-RED | Punkt 06 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_06_beskrivelse | 1 |
| `text.brygging_punkt_06_forventet` | HA ↔ Node-RED | Punkt 06 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_06_forventet | 1 |
| `text.brygging_punkt_06_navn` | HA ↔ Node-RED | Punkt 06 navn | tekst 0…255 Unicode-tegn | brygging_punkt_06_navn | 1 |
| `text.brygging_punkt_07_beskrivelse` | HA ↔ Node-RED | Punkt 07 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_07_beskrivelse | 1 |
| `text.brygging_punkt_07_forventet` | HA ↔ Node-RED | Punkt 07 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_07_forventet | 1 |
| `text.brygging_punkt_07_navn` | HA ↔ Node-RED | Punkt 07 navn | tekst 0…255 Unicode-tegn | brygging_punkt_07_navn | 1 |
| `text.brygging_punkt_08_beskrivelse` | HA ↔ Node-RED | Punkt 08 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_08_beskrivelse | 1 |
| `text.brygging_punkt_08_forventet` | HA ↔ Node-RED | Punkt 08 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_08_forventet | 1 |
| `text.brygging_punkt_08_navn` | HA ↔ Node-RED | Punkt 08 navn | tekst 0…255 Unicode-tegn | brygging_punkt_08_navn | 1 |
| `text.brygging_punkt_09_beskrivelse` | HA ↔ Node-RED | Punkt 09 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_09_beskrivelse | 1 |
| `text.brygging_punkt_09_forventet` | HA ↔ Node-RED | Punkt 09 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_09_forventet | 1 |
| `text.brygging_punkt_09_navn` | HA ↔ Node-RED | Punkt 09 navn | tekst 0…255 Unicode-tegn | brygging_punkt_09_navn | 1 |
| `text.brygging_punkt_10_beskrivelse` | HA ↔ Node-RED | Punkt 10 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_10_beskrivelse | 1 |
| `text.brygging_punkt_10_forventet` | HA ↔ Node-RED | Punkt 10 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_10_forventet | 1 |
| `text.brygging_punkt_10_navn` | HA ↔ Node-RED | Punkt 10 navn | tekst 0…255 Unicode-tegn | brygging_punkt_10_navn | 1 |
| `text.brygging_punkt_11_beskrivelse` | HA ↔ Node-RED | Punkt 11 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_11_beskrivelse | 1 |
| `text.brygging_punkt_11_forventet` | HA ↔ Node-RED | Punkt 11 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_11_forventet | 1 |
| `text.brygging_punkt_11_navn` | HA ↔ Node-RED | Punkt 11 navn | tekst 0…255 Unicode-tegn | brygging_punkt_11_navn | 1 |
| `text.brygging_punkt_12_beskrivelse` | HA ↔ Node-RED | Punkt 12 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_12_beskrivelse | 1 |
| `text.brygging_punkt_12_forventet` | HA ↔ Node-RED | Punkt 12 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_12_forventet | 1 |
| `text.brygging_punkt_12_navn` | HA ↔ Node-RED | Punkt 12 navn | tekst 0…255 Unicode-tegn | brygging_punkt_12_navn | 1 |
| `text.brygging_punkt_13_beskrivelse` | HA ↔ Node-RED | Punkt 13 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_13_beskrivelse | 1 |
| `text.brygging_punkt_13_forventet` | HA ↔ Node-RED | Punkt 13 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_13_forventet | 1 |
| `text.brygging_punkt_13_navn` | HA ↔ Node-RED | Punkt 13 navn | tekst 0…255 Unicode-tegn | brygging_punkt_13_navn | 1 |
| `text.brygging_punkt_14_beskrivelse` | HA ↔ Node-RED | Punkt 14 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_14_beskrivelse | 1 |
| `text.brygging_punkt_14_forventet` | HA ↔ Node-RED | Punkt 14 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_14_forventet | 1 |
| `text.brygging_punkt_14_navn` | HA ↔ Node-RED | Punkt 14 navn | tekst 0…255 Unicode-tegn | brygging_punkt_14_navn | 1 |
| `text.brygging_punkt_15_beskrivelse` | HA ↔ Node-RED | Punkt 15 beskrivelse | tekst 0…255 Unicode-tegn | brygging_punkt_15_beskrivelse | 1 |
| `text.brygging_punkt_15_forventet` | HA ↔ Node-RED | Punkt 15 forventet | tekst 0…255 Unicode-tegn | brygging_punkt_15_forventet | 1 |
| `text.brygging_punkt_15_navn` | HA ↔ Node-RED | Punkt 15 navn | tekst 0…255 Unicode-tegn | brygging_punkt_15_navn | 1 |
| `text.brygging_template_notat` | HA ↔ Node-RED | Template notat | tekst 0…255 Unicode-tegn | brygging_template_notat | 1 |
| `text.brygging_timer_navn` | HA ↔ Node-RED | Timer navn | tekst 0…120 Unicode-tegn | brygging_timer_navn | 1 |

### 4.1 Knapper og kommandoer

| Entity-ID | Synlig navn | Intern kommando | Forbruker |
|---|---|---|---|
| `button.brygging_avslutt` | Avslutt | `END_BREWDAY` | brygging_avslutt |
| `button.brygging_behold_siste_100_rapporter` | Behold siste 100 rapporter | `CLEAN_REPORTS` | Behold siste 100 rapporter |
| `button.brygging_bekreft_fasepunkt` | Bekreft fasepunkt | `CONFIRM_EVENT` | brygging_bekreft_fasepunkt |
| `button.brygging_forkast_templateendringer` | Forkast templateendringer | `LOAD_TEMPLATE` | brygging_forkast_templateendringer |
| `button.brygging_fortsett` | Fortsett | `RESUME` | brygging_fortsett |
| `button.brygging_generer_historisk_rapport` | Generer historisk rapport | `HISTORICAL_REPORT` | brygging_generer_historisk_rapport |
| `button.brygging_generer_rapport` | Generer rapport | `REPORT` | brygging_generer_rapport |
| `button.brygging_klargjor_ny_bryggedag` | Klargjør ny bryggedag | `RESET` | brygging_klargjor_ny_bryggedag |
| `button.brygging_lagre_fasepunktkommentar` | Lagre fasepunktkommentar | `PHASE_NOTE` | brygging_lagre_fasepunktkommentar |
| `button.brygging_lagre_template` | Lagre template | `SAVE_TEMPLATE` | brygging_lagre_template |
| `button.brygging_neste_fase` | Neste fase | `CONFIRM_DONE` | brygging_neste_fase |
| `button.brygging_nodavslutt_ved_systemfeil` | Nødavslutt ved systemfeil | `EMERGENCY_END` | brygging_nodavslutt_ved_systemfeil |
| `button.brygging_oppdater_systemkontroll` | Oppdater systemkontroll | `STORAGE_REFRESH` | brygging_oppdater_systemkontroll |
| `button.brygging_oppdater_templateliste` | Oppdater templateliste | `REFRESH_TEMPLATE_LIST` | Oppdater templateliste |
| `button.brygging_pause` | Pause | `PAUSE` | brygging_pause |
| `button.brygging_start` | Start | `START_PREFLIGHT` | brygging_start |
| `button.brygging_tilbake` | Tilbake | `PREVIOUS` | brygging_tilbake |

## 5. Utgangskontrakt for 15 sensorer

### 5.1 Sensor-state

| Planlagt sensor                             | Logisk datatype         | Tillatte verdier eller format                                                                       | Tomtilstand                                                                                                        |
|---------------------------------------------|-------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `sensor.brygging_status`                    | enum-tekst              | `idle`, `running`, `waiting_confirmation`, `waiting_event`, `paused`, `completed`, `ended`, `error` | Ingen. Node-RED skal alltid publisere én gyldig status; transportfeil håndteres som `unknown`/`unavailable` av HA. |
| `sensor.brygging_aktiv_fase`                | tekst                   | Ikke-tomt fasenavn, maksimalt 120 tegn                                                              | `Ikke startet`                                                                                                     |
| `sensor.brygging_faseoversikt`              | formatert heltallstekst | `N faser`, der N er 0–15                                                                            | `0 faser`                                                                                                          |
| `sensor.brygging_tid_til_ferdig_bryggedag`  | `duration-text`         | Ferdig formatert gjenstående tid                                                                    | `Ikke beregnet` når ingen gyldig template eller tidsplan finnes                                                    |
| `sensor.brygging_estimert_ferdig_bryggedag` | klokkeslett-tekst       | `HH:MM` i containerens dokumenterte lokale tidssone                                                 | `Ikke beregnet`                                                                                                    |
| `sensor.brygging_aktiv_template`            | filnavn-tekst           | Basename som ender med `.json`                                                                      | `Ingen valgt`                                                                                                      |
| `sensor.brygging_fasepunktoversikt`         | formatert heltallstekst | `N fasepunkter`, der N er 0–15                                                                      | `0 fasepunkter`                                                                                                    |
| `sensor.brygging_neste_fasepunkt`           | enum-tekst              | `Ingen`, `Kommende`, `Forfalt`                                                                      | `Ingen`                                                                                                            |
| `sensor.brygging_driftsmeldinger`           | heltallstekst           | Desimalt heltall ≥ 0; antall aktive meldinger                                                       | `0`                                                                                                                |
| `sensor.brygging_kommandoresultat`          | enum-tekst              | `Ingen kommando`, `Utført`, `Ignorert dobbelttrykk`, `Sperret`, `Feilet`                            | `Ingen kommando`                                                                                                   |
| `sensor.brygging_siste_fasepunktkommentar`  | klokkeslett-tekst       | `HH:MM:SS`                                                                                          | `Ingen kommentar`                                                                                                  |
| `sensor.brygging_systemkontroll`            | enum-tekst              | `IKKE KJØRT`, `OK`, `ADVARSEL`, `FEIL`                                                              | `IKKE KJØRT`                                                                                                       |
| `sensor.brygging_rapportarkiv`              | formatert tekst         | `N rapporter · S`, N ≥ 0 og S følger størrelsesformatet `B`, `KiB` eller `MiB`                      | `0 rapporter · 0 B`                                                                                                |
| `sensor.brygging_sesjonsarkiv`              | formatert tekst         | `N sesjoner · S`, N ≥ 0                                                                             | `0 sesjoner · 0 B`                                                                                                 |
| `sensor.brygging_timeroversikt`             | formatert heltallstekst | `N timere`, der N er 0–15                                                                           | `0 timere`                                                                                                         |

### 5.2 Toppnivåattributter – 51 felt

| Sensor                                     | Attributt                    | Datatype                        | Tillatte verdier / enhet                                                                   | Tomtilstand                                     |
|--------------------------------------------|------------------------------|---------------------------------|--------------------------------------------------------------------------------------------|-------------------------------------------------|
| `sensor.brygging_status`                   | `flow_version`               | tekst                           | Ikke-tom byggversjon, eksempel `2026.11.07-1`                                                | Ikke tillatt                                    |
| `sensor.brygging_status`                   | `expected_dashboard_version` | tekst                           | Ikke-tom byggversjon som skal være identisk med installert dashboardversjon                | Ikke tillatt                                    |
| `sensor.brygging_status`                   | `session_schema_version`     | tekst-enum                      | `1.0`                                                                                      | Ikke tillatt                                    |
| `sensor.brygging_status`                   | `event_schema_version`       | tekst-enum                      | `1.0`                                                                                      | Ikke tillatt                                    |
| `sensor.brygging_aktiv_fase`               | `planned_duration_min`       | heltall                         | 0–1440 min                                                                                 | `0` når ingen aktiv fase                        |
| `sensor.brygging_aktiv_fase`               | `elapsed_min`                | heltall                         | ≥ 0 min                                                                                    | `0`                                             |
| `sensor.brygging_aktiv_fase`               | `remaining_min`              | heltall                         | min; negativ verdi betyr overtid                                                           | `0` når ingen aktiv fase                        |
| `sensor.brygging_aktiv_fase`               | `overtime_min`               | heltall                         | ≥ 0 min                                                                                    | `0`                                             |
| `sensor.brygging_aktiv_fase`               | `progress_percent`           | heltall                         | ≥ 0 %; kan være over 100 ved overtid                                                       | `0`                                             |
| `sensor.brygging_faseoversikt`             | `phases`                     | liste\<fase\>                   | 0–15 objekter etter punkt 6.4; ferdig sortert                                              | `[]`                                            |
| `sensor.brygging_aktiv_template`           | `status`                     | enum-tekst                      | `Ingen valgt`, `Ikke validert`, `Gyldig`, `Ugyldig`                                        | `Ingen valgt`                                   |
| `sensor.brygging_aktiv_template`           | `dirty`                      | boolsk                          | `true` eller `false`                                                                       | `false`                                         |
| `sensor.brygging_aktiv_template`           | `saved_at`                   | RFC 3339-tekst eller `null`     | Tidspunkt med eksplisitt tidssone                                                          | `null` når templaten ikke er lagret eller valgt |
| `sensor.brygging_aktiv_template`           | `validation_errors`          | liste\<tekst\>                  | Hvert element er en ikke-tom, ferdig norsk feilmelding                                     | `[]`                                            |
| `sensor.brygging_aktiv_template`           | `validation_warnings`        | liste\<tekst\>                  | Hvert element er en ikke-tom, ferdig norsk advarsel                                        | `[]`                                            |
| `sensor.brygging_fasepunktoversikt`        | `phasepoints`                | liste\<fasepunkt\>              | 0–15 objekter etter punkt 6.4; ferdig sortert                                              | `[]`                                            |
| `sensor.brygging_neste_fasepunkt`          | `phasepoint_id`              | tekst eller `null`              | `NN_NN`                                                                                    | `null` når state er `Ingen`                     |
| `sensor.brygging_neste_fasepunkt`          | `phasepoint_name`            | tekst eller `null`              | 1–255 tegn                                                                                 | `null`                                          |
| `sensor.brygging_neste_fasepunkt`          | `time_until_due`             | `duration-text` eller `null`    | Negativ verdi betyr forfalt                                                                | `null`                                          |
| `sensor.brygging_neste_fasepunkt`          | `requires_confirmation`      | boolsk eller `null`             | `true` eller `false`                                                                       | `null`                                          |
| `sensor.brygging_driftsmeldinger`          | `messages`                   | liste\<driftsmelding\>          | Objekter etter punkt 6.4; alvorligste først, deretter nyeste internt registrerte tidspunkt | `[]`                                            |
| `sensor.brygging_kommandoresultat`         | `command`                    | tekst eller `null`              | Ferdig norsk kommandonavn; ukjent intern kode brukes bare som reserve                      | `null` før første kommando                      |
| `sensor.brygging_kommandoresultat`         | `message`                    | tekst eller `null`              | Ferdig norsk forklaring ved sperring eller feil                                            | `null` når ingen forklaring er nødvendig        |
| `sensor.brygging_kommandoresultat`         | `processed_at`               | RFC 3339-tekst eller `null`     | Tidspunkt da Node-RED ferdigbehandlet kommandoen                                           | `null` før første kommando                      |
| `sensor.brygging_siste_fasepunktkommentar` | `phase_title`                | tekst eller `null`              | 1–120 tegn                                                                                 | `null` før første kommentar                     |
| `sensor.brygging_siste_fasepunktkommentar` | `phasepoint_name`            | tekst eller `null`              | 1–255 tegn                                                                                 | `null`                                          |
| `sensor.brygging_siste_fasepunktkommentar` | `comment_text`               | tekst eller `null`              | 1–255 tegn; blank kommentar kan ikke lagres                                                | `null`                                          |
| `sensor.brygging_systemkontroll`           | `checked_at`                 | RFC 3339-tekst eller `null`     | Tidspunkt for fullført kontroll                                                            | `null` før første kontroll                      |
| `sensor.brygging_systemkontroll`           | `checks_json`                | JSON-tekst\<liste\<kontroll\>\> | Gyldig UTF-8 JSON som dekoder til nøyaktig skjema i punkt 6.4                              | `"[]"` før første kontroll                      |
| `sensor.brygging_systemkontroll`           | `ok_count`                   | heltall                         | ≥ 0                                                                                        | `0`                                             |
| `sensor.brygging_systemkontroll`           | `warning_count`              | heltall                         | ≥ 0                                                                                        | `0`                                             |
| `sensor.brygging_systemkontroll`           | `error_count`                | heltall                         | ≥ 0                                                                                        | `0`                                             |
| `sensor.brygging_systemkontroll`           | `start_summary`              | tekst                           | `TILLATT`, `IKKE KONTROLLERT` eller `SPERRET: <norsk årsak>`                               | `IKKE KONTROLLERT`                              |
| `sensor.brygging_rapportarkiv`             | `total_count`                | heltall                         | ≥ 0 rapporter                                                                              | `0`                                             |
| `sensor.brygging_rapportarkiv`             | `ordinary_count`             | heltall                         | ≥ 0 rapporter                                                                              | `0`                                             |
| `sensor.brygging_rapportarkiv`             | `historical_count`           | heltall                         | ≥ 0 rapporter                                                                              | `0`                                             |
| `sensor.brygging_rapportarkiv`             | `total_size`                 | formatert tekst                 | Ikke-negativ størrelse i `B`, `KiB` eller `MiB`                                            | `0 B`                                           |
| `sensor.brygging_rapportarkiv`             | `ordinary_latest_filename`   | tekst eller `null`              | Basename som ender med `.html`                                                             | `null`                                          |
| `sensor.brygging_rapportarkiv`             | `ordinary_latest_url`        | relativ URL eller `null`        | `/local/brygging/…` med produsentstyrt cacheversjon                                        | `null`                                          |
| `sensor.brygging_rapportarkiv`             | `ordinary_public_copy_ok`    | boolsk eller `null`             | `true` verifisert, `false` rapport finnes men kopi avviker                                 | `null` når ingen ordinær rapport finnes         |
| `sensor.brygging_rapportarkiv`             | `historical_latest_filename` | tekst eller `null`              | Basename som ender med `.html`                                                             | `null`                                          |
| `sensor.brygging_rapportarkiv`             | `historical_latest_url`      | relativ URL eller `null`        | `/local/brygging/…` med produsentstyrt cacheversjon                                        | `null`                                          |
| `sensor.brygging_rapportarkiv`             | `historical_public_copy_ok`  | boolsk eller `null`             | `true`, `false` eller `null` etter samme regel som ordinær rapport                         | `null`                                          |
| `sensor.brygging_sesjonsarkiv`             | `total_count`                | heltall                         | ≥ 0 sesjoner                                                                               | `0`                                             |
| `sensor.brygging_sesjonsarkiv`             | `total_size`                 | formatert tekst                 | Ikke-negativ størrelse i `B`, `KiB` eller `MiB`                                            | `0 B`                                           |
| `sensor.brygging_sesjonsarkiv`             | `active_count`               | heltall                         | 0 eller 1                                                                                  | `0`                                             |
| `sensor.brygging_sesjonsarkiv`             | `completed_count`            | heltall                         | ≥ 0                                                                                        | `0`                                             |
| `sensor.brygging_sesjonsarkiv`             | `ended_count`                | heltall                         | ≥ 0; vanlig manuell Avslutt                                                                | `0`                                             |
| `sensor.brygging_sesjonsarkiv`             | `unfinished_count`           | heltall                         | ≥ 0; avbrutt, nødavsluttet eller ikke ferdigstilt                                          | `0`                                             |
| `sensor.brygging_sesjonsarkiv`             | `unclassified_count`         | heltall                         | ≥ 0; mangler gyldig `brewday_started`                                                      | `0`                                             |
| `sensor.brygging_timeroversikt`            | `timers`                     | liste\<timer\>                  | 0–15 objekter etter punkt 6.4; ferdig sortert                                              | `[]`                                            |

Sesjonsarkivet har i tillegg invariantet `active_count + completed_count + ended_count + unfinished_count + unclassified_count = total_count`. Rapportarkivet har invariantet `ordinary_count + historical_count = total_count`. Brudd er produsentfeil, ikke en situasjon dashboardet skal korrigere.

### 5.3 Eksakte skjemaer for listeobjekter – 27 felt

| Objekttype    | Felt                    | Datatype        | Tillatte verdier / tomtilstand                                           |
|---------------|-------------------------|-----------------|--------------------------------------------------------------------------|
| fase          | `title`                 | tekst           | 1–120 tegn; aldri tom                                                    |
| fase          | `duration_min`          | heltall         | 0–1440 min                                                               |
| fase          | `status`                | enum-tekst      | `Kommende`, `Aktiv`, `Fullført`                                          |
| fasepunkt     | `id`                    | tekst           | `NN_NN`; permanent ID, aldri tom                                         |
| fasepunkt     | `name`                  | tekst           | 1–255 tegn                                                               |
| fasepunkt     | `type`                  | enum-tekst      | `Aktivitet`, `Tilsetning`, `Måling`, `Kontroll`, `Varsel`                |
| fasepunkt     | `description`           | tekst           | 0–255 tegn; `""` betyr at beskrivelse ikke er angitt                     |
| fasepunkt     | `expected_value`        | tekst           | 0–255 tegn; `""` betyr at forventet verdi ikke er angitt                 |
| fasepunkt     | `requires_confirmation` | boolsk          | `true` eller `false`                                                     |
| fasepunkt     | `time_until_due`        | `duration-text` | Alltid ikke-tom når objektet publiseres                                  |
| fasepunkt     | `status`                | enum-tekst      | `Kommende`, `Neste`, `Forfalt`, `Passert`, `Bekreftet`                   |
| fasepunkt     | `timing`                | formatert tekst | `N min fra fasestart` eller `N min fra faseslutt`; N er heltall          |
| timer         | `name`                  | tekst           | 1–120 tegn                                                               |
| timer         | `status`                | enum-tekst      | `Venter på start`, `Venter på slutt`, `Aktiv`, `Over tiden`, `Fullført`  |
| timer         | `display_text`          | tekst           | Ikke-tom, ferdig norsk visningstekst                                     |
| driftsmelding | `severity`              | enum-tekst      | `Feil`, `Advarsel`                                                       |
| driftsmelding | `source`                | tekst           | Ikke-tomt norsk kildenavn; intern kildekode beholdes bare i runtime/logg |
| driftsmelding | `message`               | tekst           | Ikke-tom norsk melding                                                   |
| kontroll      | `group`                 | tekst           | Ikke-tomt norsk gruppenavn                                               |
| kontroll      | `name`                  | tekst           | Ikke-tomt norsk kontrollnavn; unikt innen gruppen                        |
| kontroll      | `status`                | enum-tekst      | `OK`, `Advarsel`, `Feil`, `Informasjon`                                  |
| kontroll      | `blocks_start`          | boolsk          | `true` eller `false`                                                     |
| kontroll      | `method`                | tekst           | Ikke-tom, ferdig norsk testbeskrivelse                                   |
| kontroll      | `target`                | tekst           | Ikke-tomt kontrollmål                                                    |
| kontroll      | `result`                | tekst           | Ikke-tomt testresultat                                                   |
| kontroll      | `conclusion`            | tekst           | Ikke-tom norsk konklusjon                                                |
| kontroll      | `remediation`           | tekst           | `""` når tiltak ikke er nødvendig; ellers ferdig norsk tiltakstekst      |

Faselisten sorteres etter intern `order_id`. Fasepunktlisten sorteres etter beregnet plantid og deretter intern rekkefølge. Timerlisten sorteres etter intern `order_id`. Driftsmeldinger sorteres etter alvorlighet og internt tidspunkt. Systemkontroll sorteres i produsentdefinert gruppe- og kontrollrekkefølge. Sorteringsnøkler publiseres ikke.

## 6. Inndatakontrakt for 215 kontrollentiteter

Matrisen i punkt 2 er autoritativ for hvilken kommando hver av de 17 knappene utløser. En knapp har ingen applikasjons-state; bare en diskret trykkhandling. HA-generert sist-trykket-tidspunkt skal aldri brukes som bryggedata. Tabellen nedenfor dekker samtlige 87 select-, 48 number- og 63 text-entiteter ved eksplisitte familier.

### 6.1 Select – 87 entiteter

| Entitetsfamilie                            | Antall | Tillatte synlige verdier                                                                                                                       | Tomtilstand og tilleggskrav                                                                           |
|--------------------------------------------|--------|------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| `select.brygging_fase_NN_status`           | 15     | `Aktiv`, `Deaktivert`                                                                                                                          | Ingen tom verdi                                                                                       |
| `select.brygging_fasepunkt_for_kommentar` | 1      | `Neste aktuelle fasepunkt`, `Forrige aktuelle fasepunkt` eller dynamisk `NN_NN – navn`                                                         | Standard er `Neste aktuelle fasepunkt`; foreldet dynamisk valg avvises                                |
| `select.brygging_historisk_sesjon`         | 1      | `Ingen sesjoner` eller gyldig session-ID uten `.jsonl`                                                                                         | `Ingen sesjoner`                                                                                      |
| `select.brygging_punkt_NN_aktiv`           | 15     | `Aktiv`, `Deaktivert`                                                                                                                          | Ingen tom verdi                                                                                       |
| `select.brygging_punkt_NN_bekreftelse`     | 15     | `Ja`, `Nei`                                                                                                                                    | Ingen tom verdi                                                                                       |
| `select.brygging_punkt_NN_tid_ref`         | 15     | `Fasestart`, `Faseslutt`                                                                                                                       | Node-RED mapper til interne `phase_start`/`phase_end`                                                 |
| `select.brygging_punkt_NN_type`            | 15     | `Aktivitet`, `Tilsetning`, `Måling`, `Kontroll`, `Varsel`                                                                                      | Node-RED mapper til tekniske schema-1.0-koder                                                         |
| `select.brygging_rediger_fase`             | 1      | Dynamisk `NN – fasenavn` for de 15 faseplassene                                                                                                | Før synkronisering kan produsenten bruke `01 – laster template`; denne kan ikke lagres som brukerdata |
| `select.brygging_template`                 | 1      | `Ingen valgt` eller gyldig basename som ender med `.json`                                                                                      | `Ingen valgt`; bare strengt validerte schema-1.0-filer tilbys                                         |
| `select.brygging_timer_status`              | 1      | `Aktiv`, `Deaktivert`                                                                                                                          | Ingen tom verdi                                                                                       |
| `select.brygging_timer_pauseoppforsel`              | 1      | `Følg bryggepause`, `Fortsett etter klokke`                                                                                                    | Ingen tom verdi                                                                                       |
| `select.brygging_timer_retning`            | 1      | `Tell opp`, `Tell ned`                                                                                                                         | Ingen tom verdi                                                                                       |
| `select.brygging_timer_start_hendelse`     | 1      | Bryggestart (faktisk), Bryggeslutt (løpende), Fasestart (planlagt/faktisk), Faseslutt (løpende/faktisk), Fasepunkt (plantid/passert/bekreftet) | Ingen tom verdi                                                                                       |
| `select.brygging_timer_slutt_hendelse`     | 1      | Samme som start, i tillegg `Bryggeslutt (faktisk)`                                                                                             | Ingen tom verdi                                                                                       |
| `select.brygging_timer_start_referanse`    | 1      | `–`, dynamisk `NN – fasenavn` eller `NN_NN – fasepunktnavn`                                                                                    | `–` er bare gyldig når valgt hendelse ikke krever referanse                                           |
| `select.brygging_timer_slutt_referanse`    | 1      | Samme dynamiske format som startreferanse                                                                                                      | Samme regel som startreferanse                                                                        |
| `select.brygging_rediger_timer`               | 1      | Dynamisk `timer_NN – tekst`, eventuelt med `(deaktivert)`                                                                                      | Alltid én av de 15 timerplassene                                                                      |

### 6.2 Number – 48 entiteter

| Entitetsfamilie                          | Antall | Datatype / område / steg                             | Enhet og tomtilstand                       |
|------------------------------------------|--------|------------------------------------------------------|--------------------------------------------|
| `number.brygging_fase_NN_rekkefolge`     | 15     | heltall 1–15, steg 1; unikt på tvers av faseplassene | Ingen enhet; ingen tom verdi               |
| `number.brygging_fase_NN_varighet_min`   | 15     | heltall 0–1440, steg 1                               | min; `0` er gyldig                         |
| `number.brygging_punkt_NN_tid_min`       | 15     | heltall −1440–1440, steg 1                           | min; `0` betyr nøyaktig på valgt referanse |
| `number.brygging_timer_rekkefolge`       | 1      | heltall 1–15, steg 1; unikt i timerlisten            | Ingen enhet; ingen tom verdi               |
| `number.brygging_timer_start_offset_min` | 1      | heltall −1440–1440, steg 1                           | min; `0` er gyldig                         |
| `number.brygging_timer_slutt_offset_min` | 1      | heltall −1440–1440, steg 1                           | min; `0` er gyldig                         |

### 6.3 Text – 63 entiteter

| Entitetsfamilie                      | Antall | Lengde                | Tomtilstand og validering                                                                     |
|--------------------------------------|--------|-----------------------|-----------------------------------------------------------------------------------------------|
| `text.brygging_fase_NN_navn`         | 15     | 0–120 tegn            | Tom streng tillatt bare når fasen er deaktivert; aktiv fase krever ikke-tomt trimmet navn     |
| `text.brygging_fasepunktkommentar`   | 1      | 0–255 tegn i editoren | Tom streng er initialverdi, men Lagre avviser tom/blank kommentar; lagret verdi er 1–255 tegn |
| `text.brygging_punkt_NN_beskrivelse` | 15     | 0–255 tegn            | `""` betyr ikke angitt                                                                        |
| `text.brygging_punkt_NN_forventet`   | 15     | 0–255 tegn            | `""` betyr ikke angitt                                                                        |
| `text.brygging_punkt_NN_navn`        | 15     | 0–255 tegn i editoren | Aktivt eller lagret fasepunkt krever 1–255 tegn; tom deaktivert plass utelates fra template   |
| `text.brygging_template_notat`       | 1      | 0–255 tegn            | `""` betyr intet notat                                                                        |
| `text.brygging_timer_navn`          | 1      | 0–120 tegn            | Aktiv timer krever 1–120 tegn; deaktivert timer kan bruke `""`                                |



## 7. Eierskap og avhengigheter

HA-nodene og statusprojektorene er produsenter. Dashboard-YAML-en er presentasjonsforbruker. Intern `msg`-, context-, runtime-, journal- og filflyt eies av `NODE-RED-VARIABEL-OG-DATAFLYTKONTRAKT-2026.11.07-1.html`; samme felt skal ikke få motstridende definisjon her.

## 8. Verifikasjon

Pakketesten sammenligner alle 230 konkrete entity-ID-er, de 51 attributtnøklene, visible names, HA-grenser og dashboardreferanser mot releasefilene. Reell registrering og state/attributtlesing i Home Assistant er målmiljøakseptanse.
