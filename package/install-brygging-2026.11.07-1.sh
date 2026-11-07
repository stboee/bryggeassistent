#!/usr/bin/env bash
set -Eeuo pipefail

# Bryggedagsassistent 2026.11.07-1 – redusert flow-installer.
# Installeren håndterer ikke dashboard, templates, driftskataloger, mounts eller tidssone.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FLOW_FILE="brygging-assistent-2026.11.07-1-flow.json"
IMPORT_DIR="${IMPORT_DIR:-}"
DATA_DIR="${DATA_DIR:-/mnt/docker/nodered-brygging/data}"
BACKUP_ROOT="${BACKUP_ROOT:-/mnt/docker/nodered-brygging/backup}"
COMPOSE_DIR="${COMPOSE_DIR:-/mnt/docker}"
SERVICE_NAME="${SERVICE_NAME:-nodered-brygging}"
CONTAINER_NAME="${CONTAINER_NAME:-nodered-brygging}"
START_STOP_MODE="${START_STOP_MODE:-auto}"
STABILITY_SECONDS="${STABILITY_SECONDS:-30}"
NODE_RED_UID="${NODE_RED_UID:-1000}"
NODE_RED_GID="${NODE_RED_GID:-1000}"
RECREATE="false"
DRY_RUN="false"
VALIDATE_ONLY="false"
AUTO_ROLLBACK="false"

usage() {
  cat <<EOF
Bryggedagsassistent 2026.11.07-1 – installer Node-RED-flow

Bruk:
  $0 [--flow FLOW.json] [valg]

Valg:
  --flow FILE              Flowfil. Standard: ${FLOW_FILE}
  --import-dir DIR         Ekstra katalog der flowfilen kan ligge
  --data-dir DIR           Node-REDs hostkatalog for /data. Standard: ${DATA_DIR}
  --backup-root DIR        Rotkatalog for installerbackup. Standard: ${BACKUP_ROOT}
  --compose-dir DIR        Katalog med composefil. Standard: ${COMPOSE_DIR}
  --service NAME           Compose-service. Standard: ${SERVICE_NAME}
  --container NAME         Containernavn. Standard: ${CONTAINER_NAME}
  --start-stop-mode MODE   auto, compose eller docker. Standard: ${START_STOP_MODE}
  --stability-seconds N    Kontrolltid etter oppstart, minst 15. Standard: ${STABILITY_SECONDS}
  --node-red-uid UID       Eier av ny flows.json dersom ingen gammel fil finnes
  --node-red-gid GID       Gruppe av ny flows.json dersom ingen gammel fil finnes
  --recreate               Recreate compose-containeren ved oppstart
  --dry-run                Valider og vis planlagte operasjoner
  --validate-only          Valider bare flowfilen; Docker er ikke nødvendig
  --auto-rollback          Rull tilbake flows.json dersom ettertesten feiler
  --no-auto-rollback       Behold 2026.11.07-1 og backup ved ettertestfeil (standard)
  -h, --help               Vis hjelpen

Installeren gjør bare dette:
  1. validerer 2026.11.07-1-flowen
  2. nekter installasjon mens current_state.json peker på en session
  3. stopper Node-RED
  4. sikkerhetskopierer eksisterende flows.json
  5. installerer og hash-kontrollerer ny flows.json
  6. starter og ettertester Node-RED

Den installerer eller endrer ikke Home Assistant-dashboard, templates,
rapporter, sessionjournaler, katalogstruktur, Docker-mounts, composefil eller TZ.

Installeren migrerer ikke state mellom schema. En aktiv sesjon må avsluttes eller gjenopprettes av runtime før flowbytte.
EOF
}

log() { printf '\n[%s] %s\n' "$(date '+%F %T')" "$*"; }
warn() { printf '\n[%s] ADVARSEL: %s\n' "$(date '+%F %T')" "$*" >&2; }
fail() { printf '\n[%s] FEIL: %s\n' "$(date '+%F %T')" "$*" >&2; return 1; }
run() {
  if [[ "${DRY_RUN}" == "true" ]]; then
    printf 'DRY-RUN:'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}
resolve_file() {
  local input="$1" candidate
  if [[ "${input}" == */* ]]; then
    [[ -f "${input}" ]] && realpath "${input}" && return 0
    return 1
  fi
  for candidate in "${PWD}/${input}" "${IMPORT_DIR:+${IMPORT_DIR}/${input}}" "${SCRIPT_DIR}/${input}"; do
    [[ -n "${candidate}" && -f "${candidate}" ]] && realpath "${candidate}" && return 0
  done
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --flow) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--flow mangler verdi"; FLOW_FILE="$2"; shift 2 ;;
    --import-dir) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--import-dir mangler verdi"; IMPORT_DIR="$2"; shift 2 ;;
    --data-dir) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--data-dir mangler verdi"; DATA_DIR="$2"; shift 2 ;;
    --backup-root) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--backup-root mangler verdi"; BACKUP_ROOT="$2"; shift 2 ;;
    --compose-dir) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--compose-dir mangler verdi"; COMPOSE_DIR="$2"; shift 2 ;;
    --service) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--service mangler verdi"; SERVICE_NAME="$2"; shift 2 ;;
    --container) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--container mangler verdi"; CONTAINER_NAME="$2"; shift 2 ;;
    --start-stop-mode) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--start-stop-mode mangler verdi"; START_STOP_MODE="$2"; shift 2 ;;
    --stability-seconds) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--stability-seconds mangler verdi"; STABILITY_SECONDS="$2"; shift 2 ;;
    --node-red-uid) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--node-red-uid mangler verdi"; NODE_RED_UID="$2"; shift 2 ;;
    --node-red-gid) [[ $# -ge 2 && -n "${2:-}" ]] || fail "--node-red-gid mangler verdi"; NODE_RED_GID="$2"; shift 2 ;;
    --recreate) RECREATE="true"; shift ;;
    --dry-run) DRY_RUN="true"; shift ;;
    --validate-only) VALIDATE_ONLY="true"; shift ;;
    --auto-rollback) AUTO_ROLLBACK="true"; shift ;;
    --no-auto-rollback) AUTO_ROLLBACK="false"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Ukjent argument: $1" ;;
  esac
done

# 2026.11.07-1 bruker ett bind-mount for Node-RED: hostens DATA_DIR er containerens
# /data. Assistentområdet kan derfor ikke overstyres til en separat hostkatalog.
ASSISTANT_DIR="${DATA_DIR}/brewing-assistant"

case "${START_STOP_MODE}" in auto|compose|docker) ;; *) fail "--start-stop-mode må være auto, compose eller docker" ;; esac
[[ "${STABILITY_SECONDS}" =~ ^[0-9]+$ ]] && (( STABILITY_SECONDS >= 15 )) || fail "--stability-seconds må være et heltall på minst 15"
[[ "${NODE_RED_UID}" =~ ^[0-9]+$ && "${NODE_RED_GID}" =~ ^[0-9]+$ ]] || fail "UID/GID må være heltall"
for directory in "${DATA_DIR}" "${ASSISTANT_DIR}" "${BACKUP_ROOT}" "${COMPOSE_DIR}"; do
  [[ "${directory}" == /* ]] || fail "Alle katalogstier må være absolutte: ${directory}"
done

FLOW_SRC="$(resolve_file "${FLOW_FILE}")" || fail "Fant ikke flowfil: ${FLOW_FILE}"

if [[ -f "${SCRIPT_DIR}/SHA256SUMS" ]]; then
  log "Kontrollerer pakkens SHA-256-manifest"
  (cd "${SCRIPT_DIR}" && sha256sum --check --ignore-missing SHA256SUMS)
fi

log "Validerer 2026.11.07-1-flowen"
python3 - "${FLOW_SRC}" <<'PY'
import json, pathlib, re, sys
path=pathlib.Path(sys.argv[1]); flow=json.loads(path.read_text(encoding="utf-8"))
if not isinstance(flow,list) or len(flow)<850: raise SystemExit("Flowfilen er ufullstendig")
ids=[node.get("id") for node in flow]
if len(set(ids))!=len(ids): raise SystemExit("Flowen har dupliserte node-ID-er")
known=set(ids)
for node in flow:
    for output in node.get("wires",[]):
        for target in output:
            if target not in known: raise SystemExit(f"Wire fra {node.get('name',node.get('id'))} peker på manglende {target}")
functions="\n".join(node.get("func","") for node in flow if node.get("type")=="function")
for marker in ['2026.11.07-1','const STATE_SCHEMA_VERSION = "1.0"','const EVENT_SCHEMA_VERSION = "1.0"','/sessions/${session}.jsonl','replayJournal','active_session','EMERGENCY_END','const HA_CONTRACT','validateHaSensor','buildHaProjection','template_backup_allowlist_rc31','state_restored','origin==="system_startup"','th{background:#bfbfbf']:
    if marker not in functions: raise SystemExit(f"Flowen mangler 2026.11.07-1-markør: {marker}")
production=next((node for node in flow if node.get('id')=='brygging_production'),None)
if not production or production.get('label')!='Brygging – Produksjonsflow': raise SystemExit('Produksjonsfanen har feil etikett')
if any(node.get('id')=='brygging_documentation' or node.get('z')=='brygging_documentation' for node in flow): raise SystemExit('Intern dokumentasjonsfane finnes fortsatt')
for removed in ['storage_operation_error','status_publish_version','template_selection_setter_echo','latest_ordinary_report_filename','latest_historical_report_filename']:
    if removed in functions: raise SystemExit(f"Write-only contextnøkkel finnes fortsatt: {removed}")
for forbidden in ['brygging_forvarsel','brygging_bekreftelsespunkt','brygging_sist_publiserte_rapport','brygging_sist_publiserte_historiske_rapport','phases_json','items_json','messages_json','timers_json','SET_PHASE_DURATION','default_template_filename','current_state.prev.json','/logs/']:
    if forbidden in path.read_text(encoding="utf-8"): raise SystemExit(f"Flowen inneholder fjernet arv: {forbidden}")
counts={kind:sum(node.get("type")=="ha-entity-config" and node.get("entityType")==kind for node in flow) for kind in ['sensor','button','select','number','text']}
expected={'sensor':15,'button':17,'select':87,'number':48,'text':63}
if counts!=expected: raise SystemExit(f"Feil HA-kontrakt: {counts}")
status_cfg=next(node for node in flow if node.get("type")=="ha-entity-config" and node.get("name")=="brygging_status")
status=next(node for node in flow if node.get("type")=="ha-sensor" and node.get("entityConfig")==status_cfg['id'])
attrs=[row.get('property') for row in status.get('attributes',[]) if row.get('property')!='friendly_name']
if attrs!=['flow_version','expected_dashboard_version','session_schema_version','event_schema_version']: raise SystemExit(f"Feil statusattributter: {attrs}")
print(f"Struktur OK: {len(flow)} noder, {sum(n.get('type')=='function' for n in flow)} Function-noder, HA {counts}")
PY

if command -v node >/dev/null 2>&1; then
  node - "${FLOW_SRC}" "${SCRIPT_DIR}/referansetemplate-2026-09-26-IPL-schema-1.0.json" <<'JS'
const fs=require("fs"),flow=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
for(const node of flow){if(node.type!=="function")continue;try{new Function("msg","flow","node","context","global","env",node.func)}catch(error){console.error(`Ugyldig JavaScript i ${node.name}: ${error.message}`);process.exit(1)}}
const templatePath=process.argv[3],template=JSON.parse(fs.readFileSync(templatePath,"utf8")),store=new Map(),flowApi={get:key=>store.get(key),set:(key,value)=>store.set(key,value)},validatorNode=flow.find(node=>node.id==="83e2bec1278381ab");
new Function("msg","flow","node","context","global","env",validatorNode.func)({command:"INIT_IDLE"},flowApi,{error(message){throw new Error(String(message));},warn(){},status(){}},{},{},()=>"");
const validator=store.get("template_validator"),staticTemplate=JSON.parse(JSON.stringify(template));
for(const phase of staticTemplate.phases){const existing=new Map((phase.items||[]).map(item=>[item.id,item]));phase.items=Array.from({length:15},(_,index)=>{const id=phase.id+"_"+String(index+1).padStart(2,"0");return existing.get(id)||{id,order_id:index+1,enabled:false,type:"activity",name:"",description:"",expected_value:"",time:{reference:"phase_start",offset_min:0},requires_confirmation:false};});}
const valid=validator.validateTemplate(staticTemplate,"installer-15x15.json","INSTALLER");if(!valid.valid||valid.item_count!==225)throw new Error("Statisk 15×15-template feilet: "+(valid.errors||[]).join(" | "));
const activeBlank=JSON.parse(JSON.stringify(staticTemplate)),blank=activeBlank.phases.find(phase=>phase.enabled).items.find(item=>!item.enabled);blank.enabled=true;const invalid=validator.validateTemplate(activeBlank,"installer-aktiv-tom.json","INSTALLER");if(invalid.valid)throw new Error("Aktivt fasepunkt med tomt navn ble godtatt");
console.log(`Function-syntaks og statisk 15×15-template OK: ${flow.filter(node=>node.type==="function").length} Function-noder`);
JS
else
  if [[ "${VALIDATE_ONLY}" == "true" ]]; then
    warn "Node.js finnes ikke på verten; Function-syntaks kan ikke kontrolleres med --validate-only. Ved full installasjon etterkontrolleres den i Node-RED-containeren."
  else
    warn "Node.js finnes ikke på verten; Function-syntaks etterkontrolleres i Node-RED-containeren etter oppstart"
  fi
fi

if [[ "${VALIDATE_ONLY}" == "true" ]]; then
  log "Validering fullført; ingen filer eller containere er endret"
  exit 0
fi

[[ -d "${DATA_DIR}" && -w "${DATA_DIR}" ]] || fail "Node-RED data-dir må finnes og være skrivbar: ${DATA_DIR}"
POINTER_FILE="${ASSISTANT_DIR}/state/current_state.json"
if [[ -e "${POINTER_FILE}" ]]; then
  ACTIVE_SESSION="$(python3 - "${POINTER_FILE}" <<'PY'
import json,pathlib,re,sys
p=json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
if not isinstance(p,dict) or set(p)!={"active_session"} or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]+",str(p.get("active_session",""))):
    raise SystemExit("current_state.json er ugyldig")
print(p["active_session"])
PY
)" || fail "${POINTER_FILE} er ikke en gyldig 2026.11.07-1-sessionpeker. Installeren migrerer eller sletter ikke RC1-state. Kontroller at ingen bryggedag er aktiv, stopp Node-RED og flytt filen manuelt før installasjon."

  fail "Installasjon er sperret fordi current_state.json peker på session ${ACTIVE_SESSION}. Avslutt og bruk Klargjør ny bryggedag først."
fi

FLOW_DST="${DATA_DIR}/flows.json"
STAMP="$(date '+%F.%H-%M-%S')"
BACKUP_DIR="${BACKUP_ROOT}/${STAMP}-pre-2026.11.07-1"

compose_available() { (cd "${COMPOSE_DIR}" && docker compose config --services 2>/dev/null | grep -Fxq "${SERVICE_NAME}"); }
container_available() { docker ps -a --format '{{.Names}}' | grep -Fxq "${CONTAINER_NAME}"; }
ACTIVE_MODE=""
case "${START_STOP_MODE}" in
  compose) compose_available || fail "Compose-service ${SERVICE_NAME} finnes ikke"; ACTIVE_MODE="compose" ;;
  docker) container_available || fail "Container ${CONTAINER_NAME} finnes ikke"; ACTIVE_MODE="docker" ;;
  auto)
    if compose_available; then ACTIVE_MODE="compose"
    elif container_available; then ACTIVE_MODE="docker"
    else fail "Fant hverken compose-service ${SERVICE_NAME} eller container ${CONTAINER_NAME}"
    fi ;;
esac

stop_service() {
  if [[ "${ACTIVE_MODE}" == "compose" ]]; then (cd "${COMPOSE_DIR}" && docker compose stop "${SERVICE_NAME}")
  else docker stop "${CONTAINER_NAME}"
  fi
}
start_service() {
  if [[ "${ACTIVE_MODE}" == "compose" ]]; then
    if [[ "${RECREATE}" == "true" ]]; then (cd "${COMPOSE_DIR}" && docker compose up -d --force-recreate --no-deps "${SERVICE_NAME}")
    else (cd "${COMPOSE_DIR}" && docker compose up -d --no-deps "${SERVICE_NAME}")
    fi
  else docker start "${CONTAINER_NAME}"
  fi
}

if [[ "${DRY_RUN}" == "true" ]]; then
  log "Dry-run; planlagte operasjoner"
  run mkdir -p "${BACKUP_DIR}"
  [[ ! -f "${FLOW_DST}" ]] || run cp -a "${FLOW_DST}" "${BACKUP_DIR}/flows.json"
  run stop_service
  run install -m 0644 "${FLOW_SRC}" "${FLOW_DST}"
  run start_service
  log "Dry-run fullført"
  exit 0
fi

ORIGINAL_UID="${NODE_RED_UID}"; ORIGINAL_GID="${NODE_RED_GID}"; HAD_FLOW="false"
mkdir -p "${BACKUP_DIR}"
if [[ -f "${FLOW_DST}" ]]; then
  HAD_FLOW="true"
  ORIGINAL_UID="$(stat -c %u "${FLOW_DST}")"; ORIGINAL_GID="$(stat -c %g "${FLOW_DST}")"
  cp -a "${FLOW_DST}" "${BACKUP_DIR}/flows.json"
fi
printf '%s\n' "$(sha256sum "${FLOW_SRC}")" > "${BACKUP_DIR}/source-flow.sha256"

rollback() {
  warn "Ettertesten feilet; ruller tilbake flows.json"
  stop_service >/dev/null 2>&1 || true
  if [[ "${HAD_FLOW}" == "true" ]]; then cp -a "${BACKUP_DIR}/flows.json" "${FLOW_DST}"
  else rm -f -- "${FLOW_DST}"
  fi
  start_service >/dev/null 2>&1 || true
}

log "Stopper ${CONTAINER_NAME} via ${ACTIVE_MODE}"
stop_service
install -m 0644 "${FLOW_SRC}" "${FLOW_DST}"
chown "${ORIGINAL_UID}:${ORIGINAL_GID}" "${FLOW_DST}"
SOURCE_HASH="$(sha256sum "${FLOW_SRC}" | awk '{print $1}')"
TARGET_HASH="$(sha256sum "${FLOW_DST}" | awk '{print $1}')"
[[ "${SOURCE_HASH}" == "${TARGET_HASH}" ]] || { [[ "${AUTO_ROLLBACK}" == "true" ]] && rollback; fail "SHA-256 av installert flows.json avviker fra kilden"; }

log "Starter ${CONTAINER_NAME}"
start_service

deadline=$(( $(date +%s) + STABILITY_SECONDS ))
while (( $(date +%s) < deadline )); do
  if [[ "$(docker inspect -f '{{.State.Running}}' "${CONTAINER_NAME}" 2>/dev/null || true)" != "true" ]]; then
    [[ "${AUTO_ROLLBACK}" == "true" ]] && rollback
    fail "Containeren kjører ikke under stabilitetskontrollen"
  fi
  sleep 2
done

docker exec "${CONTAINER_NAME}" node -e 'const fs=require("fs"),f=JSON.parse(fs.readFileSync("/data/flows.json","utf8")),byId=new Map(f.map(n=>[n.id,n])),funcs=f.filter(n=>n.type==="function").map(n=>String(n.func||""));if(!Array.isArray(f)||!funcs.some(s=>s.includes("2026.11.07-1")))process.exit(2);const guard=funcs.find(s=>s.includes("template_backup_allowlist_rc31"));if(!guard||!guard.includes("/data/brewing-assistant/template-backups/")||guard.includes("backup !== prefix + backupBase"))process.exit(3);for(const source of funcs)new Function("msg","flow","node","context","global","env",source);const run=(id,msg)=>new Function("msg","flow","node","context","global","env",byId.get(id).func)(msg,{get(){},set(){}},{error(message){throw new Error(String(message));},warn(){},status(){}},{},{},()=>"");const startup=run("d17runtimecfg0002",{payload:JSON.stringify({active_session:"installer-probe",journal:""})});if(startup.command!=="RESTORE_JOURNAL"||startup.restore_source!=="system_startup"||startup.dashboard_button)process.exit(4);const refresh=run("d15c000000000012",{origin:"system_startup"});if(refresh.command!=="STORAGE_REFRESH"||refresh.dashboard_button)process.exit(5);console.log("2026.11.07-1-flow, backupretting og Function-syntaks OK; kontrollert oppstartsprobe OK i container")' \
  || { [[ "${AUTO_ROLLBACK}" == "true" ]] && rollback; fail "2026.11.07-1-ettertest i container feilet"; }

log "2026.11.07-1-flow installert og kontrollert"
printf 'Backup: %s\nFlow SHA-256: %s\n' "${BACKUP_DIR}" "${TARGET_HASH}"
