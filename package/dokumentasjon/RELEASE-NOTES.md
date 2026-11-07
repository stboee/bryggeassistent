# 2026.11.07-1 – Første produksjonsutprøving

Første samlede GitHub-publisering av Bryggedagsassistent, basert på verifisert RC3.3.2. Denne prereleasen er beregnet på kontrollert produksjonsutprøving. Reell målmiljøakseptanse er ikke automatisk godkjent.

## Innhold

- Datobasert releaseversjon `2026.11.07-1`; schema 1.0 er uendret.
- Bryggemotor, dashboard og HA-grensesnitt videreført uten funksjonsendring; normalisert sammenligning og alle 230 config-ID-er kontrolleres.
- Komplett dokumentmappe med dokumenthierarki, fire kravdokumenter, kontrakter, systemdokumentasjon, kravsporbarhet og akseptanseplan.
- Makrofri XLSX-generator med 15 × 15 fasepunktplasser og 15 timerplasser; uendret innhold fra RC3.3.2 og samme gyldige schema 1.0.
- Rettet status på den historiske funnlisten i dataflytdokumentet; skiller kodeverifisert lukking fra gjenstående målmiljøtest.
- `AGENTS.md`, `START-HERE.md` og `STATUS.md` gjør videreføring i en ny chat kildebasert.
- Reproduserbar pakking og GitHub Actions som tester eksakt commit før tag/release og vedlegg opprettes.

## Kjente begrensninger

Installeren er ikke forenklet i denne utgivelsen. Den har 16 operative valg og hjelp, og standarden er **ikke** automatisk rollback. Den bytter bare Node-REDs flow, ikke dashboard, templates eller driftsdata. KRAV-03 beskriver arvet implementasjon, mens ønsket sluttgrensesnitt står åpent. Se statusdokumentet.

Tekniske kontrolltall beviser ikke full funksjonell kravdekning. Reell Node-RED/Home Assistant, restart/reconnect, rapporter, templatearbeidsflyt, rollback og full bryggedag må dokumenteres i målmiljø. Dashboard-v2-prototypen er ikke med.

## Nedlasting og kontroll

Bruk `bryggeassistent-2026.11.07-1-forste-produksjonsutproving.zip` og dens `.sha256`-fil. GitHubs automatiske kildearkiv er ikke installasjonspakken. Releasevedleggene inneholder også `verification.json` med kildecommit, faktiske resultater og pakkehash. Inne i ZIP-en finnes `RELEASE-PROVENANCE.json` og komplett `SHA256SUMS` for leveransefilene.

Ta uavhengig backup før installasjon. Ikke installer mens en bryggedag er aktiv. Kjør `--validate-only` og les installerhjelpen før reell kjøring.
