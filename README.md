# Bryggeassistent

Bryggedagsassistent for Node-RED og Home Assistant. Repositorynavnet er kortere enn det etablerte produktnavnet; entitetsnavn og dataområder er ikke omdøpt.

## Første GitHub-versjon

**2026.11.07-1 – Første produksjonsutprøving** er en datobasert publisering av siste komplette RC3.3.2-leveranse. Bryggemotor, dashboard, installerfunksjon, permanente HA-ID-er og schema 1.0 videreføres. Motor og dashboard har bare endrede versjonsmarkører. Det er en prerelease for kontrollert produksjonsutprøving, ikke en påstand om fullført målmiljøakseptanse.

- [Last ned komplett release](https://github.com/stboee/bryggeassistent/releases/tag/2026.11.07-1) – bruk den navngitte ZIP-artifakten, ikke GitHubs automatiske «Source code» ZIP.
- [Status og kjente avvik](STATUS.md)
- [Start her for en ny chat](START-HERE.md)
- [Dokumentoversikt og dokumenthierarki](package/dokumentasjon/00-DOKUMENTOVERSIKT-2026.11.07-1.md)
- [Utgivelsesnotater](RELEASE-NOTES.md)

## Innhold og kildeansvar

| Katalog/fil | Ansvar |
|---|---|
| `package/` | Autoritative deploybare flow-, dashboard-, installer- og templatefiler; komplett dokumentasjon og XLSX-verktøy |
| `scripts/` | Verifikasjon, manifestoppdatering og deterministisk releasepakking |
| `release.json` | Releaseversjon, tag, tittel, schema og navngitt artifakt |
| `AGENTS.md` | Arbeidsregler for videre utvikling |
| `.github/workflows/release.yml` | Tester og pakker eksakt main-commit før tag/release opprettes |

Node-RED Function-koden ligger i flow-JSON-en. Det finnes foreløpig ingen separat, autoritativ kodegenerator for flowen. Ikke opprett parallelle produsenter eller rediger en utpakket `dist/`-kopi som om den var kilde.

## Installasjon og utprøving

Pakk ut releaseartifakten og les `Bryggedagsassistent/README-bryggedagsassistent-2026.11.07-1.html` først. Ta en uavhengig backup av eksisterende Node-RED-data og bryggedata. Ikke bytt flow under aktiv brygging.

```bash
cd Bryggedagsassistent
sha256sum -c SHA256SUMS
./install-brygging-2026.11.07-1.sh --validate-only
./install-brygging-2026.11.07-1.sh --help
```

Installeren bytter bare `flows.json`. Dashboard-YAML og eventuelle templatefiler håndteres separat etter dokumentasjonen. Den eksisterende installeren har fortsatt 16 operative valg og hjelp. Forenklingen er et åpent avvik; automatisk rollback er **ikke standard** i denne versjonen. Standardbanen beholder ny flow og backup ved ettertestfeil. Velg og forstå rollbackpolicy før reell installasjon.

Standard Node-RED-mount: `/mnt/docker/nodered-brygging/data:/data`. Delt HA-public-katalog: `/mnt/docker/homeassistant/www/brygging:/data/brewing-assistant/ha-public`. Node-RED skal bruke `TZ=Europe/Oslo`. Tilpass aldri mounts på bakgrunn av antakelser om et annet prosjekt.

## Lokal verifikasjon og bygg

Krever Python 3 med PyYAML, Node.js 24, Bash og `unzip`; Docker kreves ikke for de lokale portene.

```bash
python3 scripts/verify.py
python3 scripts/build_release.py --source-commit WORKTREE
```

`WORKTREE` er kun et lokalt forhåndsbygg og aldri publiseringsbevis. GitHub Actions bygger med faktisk commit-SHA, tester ren utpakking, og oppretter tag og prerelease fra samme SHA. Eksisterende publiserte versjoner skal ikke overskrives; øk løpenummer eller dato.

Versjonsskjema: `ÅÅÅÅ.MM.DD-N`, der `N` starter på 1 hver dato. Beskrivelsen ligger i releasetittelen og artifaktnavnet, ikke i schemaet. Neste versjon bruker forrige GitHub-release som direkte baseline; RC3.3.2 er importproveniens, ikke en evig kompatibilitetslinje.

## Verifikasjonsstatus

Importbaselinen ble kjørt på nytt: 7154 tekniske runtimekontroller i 159 navngitte tester og 1077 dokument-/pakkekontroller i 16 tester. Dagens faktiske kjøring fremgår av workflowloggen og releasefilen `verification.json`. Disse tallene er ikke antall funksjonelle krav. 342 normative krav og åtte akseptanseforløp finnes i dokumentasjonen; live-kontrollene er fortsatt åpne.

MIT-lisens. Ingen driftsjournaler, passord, HA-token, credentials-filer eller reelle sesjonsdata skal versjoneres.
