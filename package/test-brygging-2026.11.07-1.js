#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {spawnSync} = require("child_process");

if (process.env.TZ !== "Europe/Oslo") {
  const child = spawnSync(process.execPath, [__filename], {stdio:"inherit", env:{...process.env, TZ:"Europe/Oslo"}});
  process.exit(child.status === null ? 1 : child.status);
}

const root = __dirname;
const flowPath = path.join(root, "brygging-assistent-2026.11.07-1-flow.json");
const dashboardPath = path.join(root, "brygging-dashboard-2026.11.07-1.yaml");
const installerPath = path.join(root, "install-brygging-2026.11.07-1.sh");
const readmePath = path.join(root, "README-bryggedagsassistent-2026.11.07-1.html");
const templatePath = path.join(root, "referansetemplate-2026-09-26-IPL-schema-1.0.json");
const buildReportPath = path.join(root, "BYGGERAPPORT-2026.11.07-1.html");
const testResultPath = path.join(root, "testresultat-brygging-2026.11.07-1.html");
const baselineEntityManifestPath = path.join(root, "ha-entity-config-id-manifest-rc3.3.2.json");
const flowNodes = JSON.parse(fs.readFileSync(flowPath, "utf8"));
const dashboard = fs.readFileSync(dashboardPath, "utf8");
const installer = fs.readFileSync(installerPath, "utf8");
const readme = fs.readFileSync(readmePath, "utf8");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const byId = new Map(flowNodes.map(node => [node.id, node]));
const baselineEntityManifest = JSON.parse(fs.readFileSync(baselineEntityManifestPath, "utf8"));

const store = new Map();
const contextStore = new Map();
const flow = {get:key=>store.get(key), set:(key,value)=>store.set(key,value)};
const context = {get:key=>contextStore.get(key), set:(key,value)=>contextStore.set(key,value)};
const nodeApi = {error(message){throw new Error(String(message));}, warn(){}, status(){}, send(){}};
let assertions = 0;
let namedTests = 0;
const failures = [];

function check(value, message) {
  if (!value) throw new Error(message);
  assertions += 1;
}
function equal(actual, expected, message) {
  check(JSON.stringify(actual) === JSON.stringify(expected), `${message}: forventet ${JSON.stringify(expected)}, fikk ${JSON.stringify(actual)}`);
}
function test(name, fn) {
  namedTests += 1;
  try { fn(); }
  catch (error) { failures.push(`${name}: ${error.message}`); }
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function resetStores() { store.clear(); contextStore.clear(); }
function runFunction(id, msg) {
  const node = byId.get(id);
  if (!node || node.type !== "function") throw new Error(`Mangler Function-node ${id}`);
  const script = new vm.Script(`(function(msg,flow,node,context,global,env){${node.func}\n})`, {filename:id});
  const sandbox = {console,Date,Intl,JSON,Math,Set,Map,Object,Array,String,Number,Boolean,RegExp,Error,parseInt,parseFloat,isNaN,Buffer,URL,setTimeout,clearTimeout};
  return script.runInNewContext(sandbox)(msg, flow, nodeApi, context, {}, ()=>"");
}
function commandPipeline(input) {
  let msg = runFunction("83e2bec1278381ab", input);
  msg = runFunction("d5c90001ecb53001", msg);
  msg = runFunction("f05c40c81761fcf4", msg);
  const routed = runFunction("e80d862fdd877ff5", msg);
  const routeIndex = routed.findIndex(Boolean);
  check(routeIndex >= 0, `Kommando ${input.command} ble ikke rutet`);
  msg = routed[routeIndex];
  const handlers = ["12aa02d2771a2130","499c593abd4efa1e","9a37e11b8c635dd3","93ffa5cedeb1f2f8","d15c000000000020","ed26d7e6572bb270"];
  if (handlers[routeIndex] !== "ed26d7e6572bb270") msg = runFunction(handlers[routeIndex], msg);
  return runFunction("ed26d7e6572bb270", msg);
}
function initIdle() { return commandPipeline({command:"INIT_IDLE"}); }
function loadReference(filename="test-ipl.json") {
  let msg = runFunction("83e2bec1278381ab", {command:"LOAD_TEMPLATE",templateText:JSON.stringify(template),filename,template_file_mtime_ms:1234,template_file_mtime_checked:true,template_file_sha256:"a".repeat(64)});
  msg = runFunction("f05c40c81761fcf4", msg);
  let routed = runFunction("e80d862fdd877ff5", msg);
  msg = runFunction("12aa02d2771a2130", routed[0]);
  return runFunction("ed26d7e6572bb270", msg);
}
function setupTemplate() { resetStores(); initIdle(); return loadReference(); }
function startReference() {
  const msg = commandPipeline({command:"START",dashboard_button:"Start",start_preflight_passed:true,preflight_start_allowed:true,storage_check:{active_template_file_ok:true,active_template_file_status:"OK",active_template_sha256:"a".repeat(64)}});
  const projection = runFunction("59a7dc4617e49624", msg);
  check(projection[2] && projection[0] === null, "Start skal journalføres før HA-publisering");
  const ack = runFunction("d25c000000000001", projection[2]);
  const pointerDone = runFunction("d5c90001ecb50004", {...ack[0],payload:{code:0}});
  return {msg, projection, ack, pointerDone, statusMessage:pointerDone[6]};
}
function configValue(node, property) { return (node.haConfig || []).find(row=>row.property===property)?.value; }
function entitySlug(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/æ/g,"ae").replace(/ø/g,"o").replace(/å/g,"a").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
}
function inboundMap() {
  const result = {};
  for (const node of flowNodes) for (const output of node.wires || []) for (const target of output) (result[target] ||= []).push(node.id);
  return result;
}
function sectionBetween(source,start,end) {
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);if(a<0||b<0)throw new Error(`Mangler seksjon ${start}`);return source.slice(a,b);
}
function phaseEditorItems(phaseId="01") {
  const state=flow.get("brew_state"),phase=state.template.phases.find(row=>row.id===phaseId),stored=phase.items||[];
  return Array.from({length:15},(_,index)=>{const id=`${phaseId}_${String(index+1).padStart(2,"0")}`,item=stored.find(row=>row.id===id);return item?{id,order_id:index+1,enabled:item.enabled===true,type:item.type,name:item.name,description:item.description,expected_value:item.expected_value,time_offset_min:item.time.offset_min,time_reference:item.time.reference,requires_confirmation:item.requires_confirmation===true}:{id,order_id:index+1,enabled:false,type:"activity",name:"",description:"",expected_value:"",time_offset_min:0,time_reference:"phase_start",requires_confirmation:false};});
}
function syntheticStorage(extra=[]) {
  const lines=[];
  for(const key of ["state","templates","sessions","reports","template-backups","ha-public"])lines.push(`DIR|${key}|ok|/data/brewing-assistant/${key}|OK`);
  lines.push("POINTER|missing||Ingen peker","TEMPLATE||missing|||0|0","DISK|data|1000000|900000|10|/data",...extra,"VERSION|node|v24","VERSION|node_red|4","VERSION|ha_nodes|0.80");
  return lines.join("\n");
}

const expectedSensorAttributes = {
  brygging_status:["flow_version","expected_dashboard_version","session_schema_version","event_schema_version"],
  brygging_aktiv_fase:["planned_duration_min","elapsed_min","remaining_min","overtime_min","progress_percent"],
  brygging_faseoversikt:["phases"],brygging_tid_til_ferdig_bryggedag:[],brygging_estimert_ferdig_bryggedag:[],
  brygging_aktiv_template:["status","dirty","saved_at","validation_errors","validation_warnings"],brygging_fasepunktoversikt:["phasepoints"],
  brygging_neste_fasepunkt:["phasepoint_id","phasepoint_name","time_until_due","requires_confirmation"],brygging_driftsmeldinger:["messages"],
  brygging_kommandoresultat:["command","message","processed_at"],brygging_siste_fasepunktkommentar:["phase_title","phasepoint_name","comment_text"],
  brygging_systemkontroll:["checked_at","checks_json","ok_count","warning_count","error_count","start_summary"],
  brygging_rapportarkiv:["total_count","ordinary_count","historical_count","total_size","ordinary_latest_filename","ordinary_latest_url","ordinary_public_copy_ok","historical_latest_filename","historical_latest_url","historical_public_copy_ok"],
  brygging_sesjonsarkiv:["total_count","total_size","active_count","completed_count","ended_count","unfinished_count","unclassified_count"],brygging_timeroversikt:["timers"]
};

test("Flowfilen er komplett",()=>check(Array.isArray(flowNodes)&&flowNodes.length>900,"Flowen er ufullstendig"));
test("Alle noder har grunnform",()=>{for(const node of flowNodes){check(typeof node.id==="string"&&node.id,"Node mangler ID");check(typeof node.type==="string"&&node.type,`${node.id} mangler type`);}});
test("Node-ID-er er unike",()=>check(new Set(flowNodes.map(node=>node.id)).size===flowNodes.length,"Dupliserte node-ID-er"));
test("Alle wires peker på eksisterende noder",()=>{for(const node of flowNodes)for(const output of node.wires||[]){check(Array.isArray(output),`${node.id} har ugyldig wire`);for(const target of output)check(byId.has(target),`Wire fra ${node.id} peker på ${target}`);}});
test("Alle gruppemedlemmer finnes",()=>{for(const group of flowNodes.filter(node=>node.type==="group"))for(const id of group.nodes||[])check(byId.has(id),`Gruppe ${group.id} peker på ${id}`);});
test("Alle Function-noder kompilerer",()=>{for(const node of flowNodes.filter(node=>node.type==="function")){check(typeof node.func==="string"&&node.func.length>0,`${node.id} mangler kode`);check(new Function("msg","flow","node","context","global","env",node.func),`Ugyldig Function ${node.name}`);}});
test("HA-entitetstall er 230",()=>{const counts=Object.fromEntries(["sensor","button","select","number","text"].map(kind=>[kind,flowNodes.filter(node=>node.type==="ha-entity-config"&&node.entityType===kind).length]));equal(counts,{sensor:15,button:17,select:87,number:48,text:63},"Feil HA-entitetstall");check(Object.values(counts).reduce((a,b)=>a+b,0)===230,"Totalen er ikke 230");});
test("Nøyaktig 15 sensorskrivere finnes",()=>check(flowNodes.filter(node=>node.type==="ha-sensor").length===15,"Feil antall ha-sensor-noder"));
test("Sensorenes 51 attributter er eksakte",()=>{let count=0;for(const sensor of flowNodes.filter(node=>node.type==="ha-sensor")){check(expectedSensorAttributes[sensor.name]!==undefined,`Ukjent sensor ${sensor.name}`);const fields=sensor.attributes.map(row=>row.property);equal(fields,expectedSensorAttributes[sensor.name],`Feil attributter på ${sensor.name}`);count+=fields.length;}check(count===51,`Fant ${count} attributter`);});
test("Én autoritativ produsent per sensor",()=>{const inbound=inboundMap();for(const sensor of flowNodes.filter(node=>node.type==="ha-sensor")){check((inbound[sensor.id]||[]).length===1,`${sensor.name} har ${(inbound[sensor.id]||[]).length} produsenter`);}});
test("Dynamisk kontraktgrense har tolv utganger",()=>{const node=byId.get("db14fc57897daad7");check(node.outputs===12&&node.wires.length===12,"Feil dynamisk grense");});
test("Arkivgrensen har tre utganger",()=>{const node=byId.get("rc3_storage_contract_boundary");check(node&&node.outputs===3&&node.wires.length===3,"Arkivgrensen mangler");});
test("Fjernede sensorer er borte",()=>{const text=JSON.stringify(flowNodes);for(const value of ["brygging_bekreftelsespunkt","brygging_sist_publiserte_rapport","brygging_sist_publiserte_historiske_rapport"])check(!text.includes(value),`Fjernet sensor finnes: ${value}`);});
test("Fire JSON-duplikater er borte",()=>{const text=JSON.stringify(flowNodes);for(const value of ["phases_json","items_json","messages_json","timers_json"])check(!text.includes(value),`JSON-duplikat finnes: ${value}`);});
test("To bekreftet døde noder er borte",()=>{const text=JSON.stringify(flowNodes);for(const value of ["d17timercfg00030","d15c000000000028"])check(!text.includes(value),`Død node finnes: ${value}`);});
test("Død fasevarighetskommando er borte",()=>{const text=JSON.stringify(flowNodes);for(const value of ["SET_PHASE_DURATION","phase_duration_changed","phase_duration_change_failed"])check(!text.includes(value),`Død fasevarighetsbane finnes: ${value}`);});
test("Gammel HA-feilkode er borte",()=>check(!JSON.stringify(flowNodes).includes("ha_input_failed"),"ha_input_failed finnes fortsatt"));
test("Kontraktregisteret er installert",()=>{const code=byId.get("f05c40c81761fcf4").func;for(const marker of ["const HA_CONTRACT","validateHaSensor","buildHaProjection","parseCanonicalInteger","rejectHaInput"])check(code.includes(marker),`Mangler ${marker}`);});
test("2026.11.07-1-versjon er gjennomgående",()=>{const text=JSON.stringify(flowNodes);check(text.includes("2026.11.07-1"),"2026.11.07-1-versjon mangler");check(!text.includes("v1.0.0-rc3.3.2"),"RC3.3.2-versjon lekker inn i runtime");});
test("Schema 1.0 er bevart",()=>{const code=byId.get("f05c40c81761fcf4").func;check(code.includes('STATE_SCHEMA_VERSION = "1.0"'),"Sesjonsskjema endret");check(code.includes('EVENT_SCHEMA_VERSION = "1.0"'),"Hendelsesskjema endret");check(template.schema_version==="1.0","Templateskjema endret");});
test("Ni planlagte entity-ID-er finnes",()=>{for(const [kind,name] of [["button","brygging_generer_rapport"],["sensor","brygging_timeroversikt"],["button","brygging_nodavslutt_ved_systemfeil"],["select","brygging_rediger_timer"],["text","brygging_timer_navn"],["select","brygging_timer_pauseoppforsel"],["select","brygging_timer_status"],["sensor","brygging_fasepunktoversikt"],["select","brygging_fasepunkt_for_kommentar"]])check(flowNodes.some(node=>node.type==="ha-entity-config"&&node.entityType===kind&&node.name===name),`Mangler ${kind}.${name}`);});
test("Ni nye HA-identiteter bruker nye config-ID-er",()=>{for(const id of ["rc3_cfg_generer_rapport","rc3_cfg_timeroversikt","rc3_cfg_nodavslutt_systemfeil","rc3_cfg_rediger_timer","rc3_cfg_timer_navn","rc3_cfg_timer_pauseoppforsel","rc3_cfg_timer_status","rc3_cfg_fasepunktoversikt","rc3_cfg_fasepunkt_for_kommentar"]){check(byId.has(id),`Mangler ${id}`);check(flowNodes.some(node=>node.entityConfig===id),`${id} mangler runtimeforbruker`);}});
test("Gamle config-ID-er for de ni omdøpingene er borte",()=>{const text=JSON.stringify(flowNodes);for(const id of ["0cef2d84b94a0ba5","rc22_cfg_aktive_timere","rc2_emergency_config","d17timercfg00010","d17tc000000002","d17tc000000005","d17tc000000001","rc22_cfg_aktive_fasepunkter","rc22_cfg_fasepunktkommentar_select"])check(!text.includes(id),`Gammel config-ID finnes: ${id}`);});
test("Alle HA-visningsnavn er norske og bevarer entity-ID",()=>{for(const config of flowNodes.filter(node=>node.type==="ha-entity-config"&&["sensor","button","select","number","text"].includes(node.entityType))){const display=configValue(config,"name"),suffix=config.name.replace(/^brygging_/,"");check(typeof display==="string"&&display.trim(),`${config.name} mangler visningsnavn`);check(!display.includes("_"),`${config.name} viser underscore`);check(entitySlug(display)===suffix,`${config.name} ville blitt ${entitySlug(display)}`);}});
test("RC3.3.2 → 2026.11.07-1 beholder alle HA config-ID-er",()=>{const entries=baselineEntityManifest.entity_config_ids||{},current=flowNodes.filter(node=>node.type==="ha-entity-config"&&["sensor","button","select","number","text"].includes(node.entityType));check(baselineEntityManifest.source_version==="v1.0.0-rc3.3.2"&&Object.keys(entries).length===230,"RC3.3.2-ID-manifest er ugyldig");check(current.length===230,"2026.11.07-1 har feil HA-entitetstall");for(const config of current)check(entries[config.entityType+"."+config.name]===config.id,"HA-identitet endret for "+config.entityType+"."+config.name);});
test("Alle dashboardreferanser finnes",()=>{for(const ref of dashboard.match(/(?:sensor|button|select|number|text)\.brygging_[a-z0-9_]+/g)||[]){const [kind,name]=ref.split(".");check(flowNodes.some(node=>node.type==="ha-entity-config"&&node.entityType===kind&&node.name===name),`Dashboard peker på ${ref}`);}});
test("Alle 230 HA-entiteter brukes av dashboardet",()=>{for(const config of flowNodes.filter(node=>node.type==="ha-entity-config"&&["sensor","button","select","number","text"].includes(node.entityType)))check(dashboard.includes(`${config.entityType}.${config.name}`),`Dashboardet mangler ${config.entityType}.${config.name}`);});
test("Dashboardet bruker ingen fjernede entiteter",()=>{for(const value of ["brygging_bekreftelsespunkt","brygging_sist_publiserte_rapport","brygging_sist_publiserte_historiske_rapport","brygging_aktive_fasepunkter","brygging_aktive_timere"])check(!dashboard.includes(value),`Dashboardarv: ${value}`);});
test("Dashboardet bruker bare kontraktfestede statuser",()=>{for(const value of ["state_not: ukjent","state_not: ikke startet"])check(!dashboard.includes(value),`Gammel statustilstand finnes: ${value}`);});
test("Dashboardet oversetter ikke tekniske listekoder",()=>{for(const value of ["'activity':'aktivitet'","p.status == 'completed'","p.status == 'active'","t.status == 'overdue'","row.level"])check(!dashboard.includes(value),`Dashboardoversettelse finnes: ${value}`);});
test("Dashboardet reparerer ikke kontraktverdier",()=>{for(const value of [" or []","| int(0)","| default('-', true)","| default('[]', true)"])check(!dashboard.includes(value),`Dashboardreparasjon finnes: ${value}`);});
test("Overtid vises grønt",()=>{check(dashboard.includes("🟩"),"Grønn overtid mangler");check(!dashboard.includes("{% else %}🟥{% endif %}"),"Overtid er fortsatt rød");});
test("Start og templatelisteoppdatering deler grid",()=>{const section=sectionBetween(dashboard,"title: Start bryggedag","title: Historisk rapport");const grid=sectionBetween(section,"- type: grid","- type: markdown\n      title: Templatestatus");check(grid.includes("button.brygging_start")&&grid.includes("button.brygging_oppdater_templateliste"),"Knappene deler ikke grid");});
test("Dashboardet bruker ferdige rapportarkiv-URL-er",()=>{for(const field of ["ordinary_latest_filename","ordinary_latest_url","historical_latest_filename","historical_latest_url"])check(dashboard.includes(field),`Mangler ${field}`);check(!dashboard.includes("ordinary_newest_mtime"),"Dashboard bygger cacheversjon selv");});
test("Fem sesjonskategorier vises",()=>{for(const field of ["active_count","completed_count","ended_count","unfinished_count","unclassified_count"])check(dashboard.includes(field),`Mangler ${field}`);});
test("Sesjonsutfall bruker avtalte farger uten rødt",()=>{const section=sectionBetween(dashboard,"title: Sesjonsarkiv","- type: grid\n    columns: 2");for(const marker of ["🔵 **Pågående:**","🟢 **Normalt fullført:**","🟡 **Manuelt avsluttet:**","🟠 **Ufullført:**","⚪ **Uklassifisert:**"])check(section.includes(marker),`Mangler ${marker}`);check(!section.includes("🔴")&&!section.includes("🟥"),"Rødt brukes for sesjonsutfall");});
test("Systemkontroll bruker norske statuser",()=>{for(const value of ["c.status == 'error'","c.status == 'warning'","c.status == 'ok'"])check(!dashboard.includes(value),`Engelsk kontrollstatus finnes: ${value}`);for(const value of ["c.status == 'Feil'","c.status == 'Advarsel'","c.status == 'OK'"])check(dashboard.includes(value),`Norsk kontrollstatus mangler: ${value}`);});
test("Dashboard-YAML kan parses",()=>{const result=spawnSync("python3",["-c","import sys,yaml; d=yaml.safe_load(open(sys.argv[1],encoding='utf-8')); assert d['title']=='Brygging 2026.11.07-1'; assert len(d['views'])==5",dashboardPath],{encoding:"utf8"});check(result.status===0,`YAML-feil: ${result.stderr}`);});
test("Dashboardets Jinja-blokker er balanserte",()=>{const ifCount=(dashboard.match(/{% if\b/g)||[]).length,endifCount=(dashboard.match(/{% endif %}/g)||[]).length,forCount=(dashboard.match(/{% for\b/g)||[]).length,endforCount=(dashboard.match(/{% endfor %}/g)||[]).length;check(ifCount===endifCount,`if/endif ${ifCount}/${endifCount}`);check(forCount===endforCount,`for/endfor ${forCount}/${endforCount}`);});
test("Fasepunkttid har området ±1440",()=>{for(let index=1;index<=15;index++){const slot=String(index).padStart(2,"0"),config=flowNodes.find(node=>node.type==="ha-entity-config"&&node.name===`brygging_punkt_${slot}_tid_min`);check(configValue(config,"min_value")===-1440,`${slot} min`);check(configValue(config,"max_value")===1440,`${slot} max`);check(configValue(config,"step")===1,`${slot} step`);check(configValue(config,"mode")==="box",`${slot} mode`);check(configValue(config,"unit_of_measurement")==="min",`${slot} unit`);}});
test("Alle 63 tekstentiteter har eksplisitt grense",()=>{for(const config of flowNodes.filter(node=>node.type==="ha-entity-config"&&node.entityType==="text")){const max=configValue(config,"max_length");check(configValue(config,"min_length")===0,`${config.name} min`);check(max===120||max===255,`${config.name} max ${max}`);check(configValue(config,"mode")==="text",`${config.name} mode`);check(configValue(config,"pattern")==="",`${config.name} pattern`);}});
test("De 16 tidligere grenseløse tekstene har 255",()=>{const names=["brygging_fasepunktkommentar"];for(let index=11;index<=15;index++)for(const suffix of ["navn","beskrivelse","forventet"])names.push(`brygging_punkt_${String(index).padStart(2,"0")}_${suffix}`);for(const name of names){const config=flowNodes.find(node=>node.type==="ha-entity-config"&&node.name===name);check(configValue(config,"max_length")===255,`${name} er ikke 255`);}});
test("Fasepunktselecter har norske enums",()=>{const expected={aktiv:["Aktiv","Deaktivert"],bekreftelse:["Ja","Nei"],tid_ref:["Fasestart","Faseslutt"],type:["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"]};for(let index=1;index<=15;index++)for(const [suffix,options] of Object.entries(expected)){const name=`brygging_punkt_${String(index).padStart(2,"0")}_${suffix}`,config=flowNodes.find(node=>node.type==="ha-entity-config"&&node.name===name);equal(configValue(config,"options"),options,`Feil options for ${name}`);}});

test("Referansetemplaten består streng validering",()=>{resetStores();runFunction("83e2bec1278381ab",{command:"INIT_IDLE"});const validator=flow.get("template_validator");check(validator.validateTemplate(template,"referanse.json","TEST").valid,"Referansetemplate ugyldig");});
test("Gammelt templateskjema avvises",()=>{const value=clone(template);value.schema_version="0.9.1";check(!flow.get("template_validator").validateTemplate(value,"gammel.json","TEST").valid,"Gammelt skjema godtatt");});
test("Templatenotat godtar 255 Unicode-tegn",()=>{const value=clone(template);value.note="å".repeat(255);check(flow.get("template_validator").validateTemplate(value,"255.json","TEST").valid,"255 tegn avvist");});
test("Templatenotat avviser 256 Unicode-tegn",()=>{const value=clone(template);value.note="🍺".repeat(256);check(!flow.get("template_validator").validateTemplate(value,"256.json","TEST").valid,"256 tegn godtatt");});
test("Fasenavn har grense 120",()=>{let value=clone(template);value.phases[0].title="F".repeat(120);check(flow.get("template_validator").validateTemplate(value,"120.json","TEST").valid,"120 avvist");value=clone(template);value.phases[0].title="F".repeat(121);check(!flow.get("template_validator").validateTemplate(value,"121.json","TEST").valid,"121 godtatt");});
test("Deaktivert fasenavn har også grense 120",()=>{const value=clone(template),phase=value.phases.find(row=>!row.enabled)||value.phases[14];phase.enabled=false;phase.title="F".repeat(121);check(!flow.get("template_validator").validateTemplate(value,"deaktivert.json","TEST").valid,"Lang deaktivert fase godtatt");});
test("Fasepunktnavn har grense 255",()=>{const item=clone(template),target=item.phases.find(phase=>phase.items.length).items[0];target.name="N".repeat(255);check(flow.get("template_validator").validateTemplate(item,"255.json","TEST").valid,"255 avvist");target.name="N".repeat(256);check(!flow.get("template_validator").validateTemplate(item,"256.json","TEST").valid,"256 godtatt");});
test("Fasepunktbeskrivelse har grense 255",()=>{const value=clone(template),item=value.phases.find(phase=>phase.items.length).items[0];item.description="B".repeat(256);check(!flow.get("template_validator").validateTemplate(value,"beskrivelse.json","TEST").valid,"Lang beskrivelse godtatt");});
test("Forventet verdi har grense 255",()=>{const value=clone(template),item=value.phases.find(phase=>phase.items.length).items[0];item.expected_value="V".repeat(256);check(!flow.get("template_validator").validateTemplate(value,"forventet.json","TEST").valid,"Lang forventet verdi godtatt");});
test("Timertekst har grense 120",()=>{let value=clone(template);value.timers[0].text="T".repeat(120);check(flow.get("template_validator").validateTemplate(value,"120.json","TEST").valid,"120 avvist");value=clone(template);value.timers[0].text="T".repeat(121);check(!flow.get("template_validator").validateTemplate(value,"121.json","TEST").valid,"121 godtatt");});
test("Fasepunktoffset godtar begge grenser",()=>{for(const offset of [-1440,1440]){const value=clone(template),item=value.phases.find(phase=>phase.items.length).items[0];item.time.offset_min=offset;check(flow.get("template_validator").validateTemplate(value,`${offset}.json`,"TEST").valid,`${offset} avvist`);}});
test("Fasepunktoffset avviser utenfor grensene",()=>{for(const offset of [-1441,1441]){const value=clone(template),item=value.phases.find(phase=>phase.items.length).items[0];item.time.offset_min=offset;check(!flow.get("template_validator").validateTemplate(value,`${offset}.json`,"TEST").valid,`${offset} godtatt`);}});
test("Templateskjema avviser ekstranøkler",()=>{const value=clone(template);value.smart_fix=true;check(!flow.get("template_validator").validateTemplate(value,"ekstra.json","TEST").valid,"Ekstranøkkel godtatt");});
test("Templateskjema gjør ingen typekonvertering",()=>{const value=clone(template);value.phases[0].duration_min="10";check(!flow.get("template_validator").validateTemplate(value,"type.json","TEST").valid,"Teksttall godtatt");});

test("Lokal RFC3339 bruker vinteroffset",()=>{setupTemplate();const L=flow.get("brew_engine_lib");check(L.iso(Date.UTC(2026,0,15,9,15))==="2026-01-15T10:15:00+01:00","Feil vintertid");});
test("Lokal RFC3339 bruker sommeroffset",()=>{const L=flow.get("brew_engine_lib");check(L.iso(Date.UTC(2026,6,15,8,15))==="2026-07-15T10:15:00+02:00","Feil sommertid");});
test("Fullstendige tider har alltid offset",()=>{const L=flow.get("brew_engine_lib");for(const ts of [Date.UTC(2026,0,1),Date.UTC(2026,2,29),Date.UTC(2026,6,1),Date.UTC(2026,9,25)])check(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+(?:01|02):00$/.test(L.iso(ts)),`Manglende offset ${L.iso(ts)}`);});
test("Rene klokkeslett forblir lokale",()=>{const L=flow.get("brew_engine_lib");check(L.clock(Date.UTC(2026,6,15,8,15))==="10:15","Feil HH:MM");check(L.clockSeconds(Date.UTC(2026,6,15,8,15,9))==="10:15:09","Feil HH:MM:SS");});
test("Filstempel inneholder ikke offsettegn",()=>{const L=flow.get("brew_engine_lib"),value=L.fileTimestamp(Date.UTC(2026,6,15,8,15));check(/^2026-07-15\.10-15-00$/.test(value),`Feil filstempel ${value}`);check(!/[+:]/.test(value),"Offsettegn i filstempel");});

test("Idle-projeksjon bruker eksakte tomtilstander",()=>{resetStores();const msg=initIdle(),out=runFunction("59a7dc4617e49624",msg)[0].payload;check(out.remaining.state==="Ikke beregnet","Tid skal være uberegnet");check(out.estimated.state==="Ikke beregnet","Sluttid skal være uberegnet");equal(out.comment,{state:"Ingen kommentar",attributes:{phase_title:null,phasepoint_name:null,comment_text:null}},"Kommentar tomtilstand");equal(out.next_phasepoint,{state:"Ingen",attributes:{phasepoint_id:null,phasepoint_name:null,time_until_due:null,requires_confirmation:null}},"Neste tomtilstand");equal(out.phase_overview.attributes.phases,[],"Faseliste");equal(out.phasepoints.attributes.phasepoints,[],"Fasepunktliste");equal(out.timers.attributes.timers,[],"Timerliste");check(out.template.attributes.saved_at===null,"saved_at skal være null");});
test("Første idle-publisering gir tolv gyldige sensorer",()=>{resetStores();const msg=initIdle(),status=runFunction("59a7dc4617e49624",msg)[0],published=runFunction("db14fc57897daad7",status);check(published.length===12,"Feil utgangstall");for(const row of published)check(row!==null,"Gyldig sensor ble stoppet");equal(flow.get("ha_contract_errors"),{},"Kontraktfeil i idle");});
test("Endringsfilter stopper identisk republisering",()=>{resetStores();const msg=initIdle(),status=runFunction("59a7dc4617e49624",msg)[0];runFunction("db14fc57897daad7",status);const second=runFunction("db14fc57897daad7",status);check(second.every(row=>row===null),"Identisk verdi ble republisert");});
test("Tvungen reconnect republiserer alle tolv",()=>{resetStores();const msg=initIdle(),status=runFunction("59a7dc4617e49624",msg)[0];runFunction("db14fc57897daad7",status);status.force_full_ha_resync=true;const forced=runFunction("db14fc57897daad7",status);check(forced.every(Boolean),"Reconnect ga ikke full republisering");});
test("Referansetemplate lastes uten normalisering",()=>{const msg=setupTemplate();check(msg.brew.state.active_template_filename==="test-ipl.json","Feil templatefil");check(msg.brew.state.template_validation.valid,"Template ugyldig");equal(msg.brew.state.template,template,"Template ble normalisert");});
test("Templateprojeksjon har fem avtalte attributter",()=>{const msg=setupTemplate(),projection=runFunction("59a7dc4617e49624",msg)[0].payload.template;equal(Object.keys(projection.attributes),["status","dirty","saved_at","validation_errors","validation_warnings"],"Templateattributter");check(projection.state==="test-ipl.json"&&projection.attributes.status==="Gyldig","Feil templateprojeksjon");});
test("Ikke-tomme valideringslister godtas av HA-kontrakten",()=>{const L=flow.get("brew_engine_lib"),candidate={payload:"test-ipl.json",ha_attributes:{status:"Ugyldig",dirty:false,saved_at:null,validation_errors:["Fase 01 er ugyldig"],validation_warnings:["To timere har samme navn"]}};check(L.validateHaSensor("template",candidate).valid,"Gyldige norske valideringsmeldinger ble avvist");});
test("Semantisk ugyldig lokaltid avvises",()=>{const L=flow.get("brew_engine_lib"),candidate={payload:"Utført",ha_attributes:{command:"Start bryggedag",message:null,processed_at:"2026-02-30T10:15:00+01:00"}};check(!L.validateHaSensor("command",candidate).valid,"Ugyldig kalenderdato ble godtatt");});
test("Feil sesongoffset avvises",()=>{const L=flow.get("brew_engine_lib");for(const timestamp of ["2026-01-15T10:15:00+02:00","2026-07-15T10:15:00+01:00"]){const candidate={payload:"Utført",ha_attributes:{command:"Start bryggedag",message:null,processed_at:timestamp}};check(!L.validateHaSensor("command",candidate).valid,`Feil offset ble godtatt: ${timestamp}`);}});
test("Validatoren feiler lukket uten unntak",()=>{const L=flow.get("brew_engine_lib");let result,threw=false;try{result=L.validateHaSensor("issues",{payload:"0",ha_attributes:{messages:null}});}catch(error){threw=true;}check(!threw,"Validator kastet unntak");check(result&&!result.valid,"Feilformet meldingsliste ble godtatt");});
test("Liste-state må samsvare med listelengden",()=>{const L=flow.get("brew_engine_lib"),candidate={payload:"1 faser",ha_attributes:{phases:[]}};check(!L.validateHaSensor("phase_overview",candidate).valid,"Avvikende fasetelling ble godtatt");});
test("Arkiv-state må samsvare med attributtene",()=>{const L=flow.get("brew_engine_lib"),candidate={payload:"1 sesjoner · 0 B",ha_attributes:{total_count:0,total_size:"0 B",active_count:0,completed_count:0,ended_count:0,unfinished_count:0,unclassified_count:0}};check(!L.validateHaSensor("session",candidate).valid,"Avvikende sesjons-state ble godtatt");});
test("Start beholder journal-før-HA-porten",()=>{setupTemplate();const started=startReference();const rows=started.projection[2].payload.trim().split(/\n/).map(JSON.parse);check(rows.some(row=>row.event==="brewday_started"&&row.data.template_snapshot),"Startjournal mangler snapshot");check(rows.some(row=>row.event==="runtime_patch"),"Startjournal mangler patch");check(started.statusMessage.payload.status.state==="running","Running ble ikke frigitt");});
test("Aktiv HA-projeksjon er ferdig norsk",()=>{setupTemplate();const started=startReference(),published=runFunction("db14fc57897daad7",started.statusMessage);const phases=published[5].phase_overview_attributes.phases,points=published[6].phasepoints_attributes.phasepoints,timers=published[8].timers_attributes.timers;check(phases.every(row=>["Kommende","Aktiv","Fullført"].includes(row.status)),"Engelsk fasestatus");check(points.every(row=>["Aktivitet","Tilsetning","Måling","Kontroll","Varsel"].includes(row.type)&&["Kommende","Neste","Forfalt","Passert","Bekreftet"].includes(row.status)),"Engelsk fasepunktprojeksjon");check(timers.every(row=>["Venter på start","Venter på slutt","Aktiv","Over tiden","Fullført"].includes(row.status)),"Engelsk timerprojeksjon");});
test("Listeobjektene har eksakt skjema",()=>{setupTemplate();const started=startReference(),p=started.statusMessage.payload;for(const row of p.phase_overview.attributes.phases)equal(Object.keys(row),["title","duration_min","status"],"Faseobjekt");for(const row of p.phasepoints.attributes.phasepoints)equal(Object.keys(row),["id","name","type","description","expected_value","requires_confirmation","time_until_due","status","timing"],"Fasepunktobjekt");for(const row of p.timers.attributes.timers)equal(Object.keys(row),["name","status","display_text"],"Timerobjekt");});
test("Ugyldig utdata stoppes og siste gyldige beholdes",()=>{resetStores();const msg=initIdle(),status=runFunction("59a7dc4617e49624",msg)[0];runFunction("db14fc57897daad7",status);const before=clone(flow.get("ha_contract_last_valid").active_phase);status.payload.active_phase.attributes.remaining_min="0";const invalid=runFunction("db14fc57897daad7",status);check(invalid[4]===null,"Ugyldig aktiv fase ble publisert");equal(flow.get("ha_contract_last_valid").active_phase,before,"Siste gyldige ble overskrevet");check(flow.get("ha_contract_errors").active_phase.level==="error","Kontraktfeil mangler");});
test("Utdatafeil dedupliseres",()=>{resetStores();const msg=initIdle(),status=runFunction("59a7dc4617e49624",msg)[0];status.payload.command.attributes.processed_at="2026-01-01T10:00:00";runFunction("db14fc57897daad7",status);const first=clone(flow.get("ha_contract_errors").command);runFunction("db14fc57897daad7",status);const second=flow.get("ha_contract_errors").command;check(first.ts_ms===second.ts_ms&&first.message===second.message,"Utdatafeil ble duplisert");});
test("Utdatafeil blir norsk driftsmelding ved neste projeksjon",()=>{const state=flow.get("brew_state"),projection=flow.get("brew_engine_lib").buildHaProjection(state,flow.get("ha_contract_errors"));check(projection.issues.attributes.messages.some(row=>row.severity==="Feil"&&row.source==="Home Assistant-utdata"),"Driftsmelding mangler");});

test("Kanoniske heltall godtas",()=>{setupTemplate();const L=flow.get("brew_engine_lib");for(const raw of [-1440,0,1440,"-1440","0","1440"])check(L.parseCanonicalInteger(raw,-1440,1440).valid,`${JSON.stringify(raw)} avvist`);});
test("Tvetydige tall avvises",()=>{const L=flow.get("brew_engine_lib");for(const raw of [" 1","1 ","01","1.0","1e2","+1","","null",null,true,false,NaN,Infinity])check(!L.parseCanonicalInteger(raw,-1440,1440).valid,`${JSON.stringify(raw)} godtatt`);});
test("Gyldig fasevarighet committes",()=>{setupTemplate();const input=runFunction("d17phasecfg00002",{phase_id:"01",property:"duration_min",payload:"42"}),result=commandPipeline(input),phase=flow.get("brew_state").template.phases.find(row=>row.id==="01");check(phase.duration_min===42&&result.brew.state.template_dirty,"Gyldig fasevarighet ble ikke lagret");});
test("Ugyldig faseverdi avvises atomisk",()=>{setupTemplate();const before=JSON.stringify(flow.get("brew_state").template),input=runFunction("d17phasecfg00002",{phase_id:"01",property:"duration_min",payload:" 42"}),result=commandPipeline(input);check(JSON.stringify(flow.get("brew_state").template)===before,"Template ble endret");check(result.brew.state.command_result.result==="Sperret"&&result.brew.editor_resync===true,"Avvisning/resync mangler");});
test("Faseenum godtar bare synlig norsk verdi",()=>{setupTemplate();for(const raw of [true,"active","aktiv"]){const input=runFunction("d17phasecfg00002",{phase_id:"01",property:"enabled",payload:raw});check(input.command==="HA_INPUT_REJECTED",`${JSON.stringify(raw)} godtatt`);}});
test("Fasepunktadapter mapper norske enums",()=>{setupTemplate();flow.set("tpl_editor",{selected_phase_id:"01",items:phaseEditorItems("01")});const input=runFunction("360dcac2df77ad6c",{slot:1,field:"type",payload:"Måling"});check(input.command==="APPLY_PHASE_ITEMS"&&input.items[0].type==="measurement","Type ble ikke mappet");const result=commandPipeline(input);check(result.brew.state.command_result.result==="Utført","Gyldig punktendring feilet");});
test("Fasepunktadapter bevarer permanente slot-ID-er",()=>{const editor=flow.get("tpl_editor");for(let index=0;index<15;index++){check(editor.items[index].id===`01_${String(index+1).padStart(2,"0")}`,`Feil ID i slot ${index+1}`);check(editor.items[index].order_id===index+1,`Feil order i slot ${index+1}`);}});
test("Teknisk fasepunkttype avvises",()=>{setupTemplate();flow.set("tpl_editor",{selected_phase_id:"01",items:phaseEditorItems("01")});const input=runFunction("360dcac2df77ad6c",{slot:1,field:"type",payload:"measurement"});check(input.command==="HA_INPUT_REJECTED","Teknisk type godtatt");});
test("Fasepunktoffset med mellomrom avvises atomisk",()=>{setupTemplate();flow.set("tpl_editor",{selected_phase_id:"01",items:phaseEditorItems("01")});const before=JSON.stringify(flow.get("brew_state").template),input=runFunction("360dcac2df77ad6c",{slot:1,field:"time_offset_min",payload:" 5"}),result=commandPipeline(input);check(JSON.stringify(flow.get("brew_state").template)===before,"Template endret");check(result.brew.state.command_result.result==="Sperret","Ikke sperret");});
test("Aktivering av blankt fasepunkt avvises",()=>{setupTemplate();const items=phaseEditorItems("01");items[14].name="";items[14].enabled=false;flow.set("tpl_editor",{selected_phase_id:"01",items});const before=JSON.stringify(flow.get("brew_state").template),input=runFunction("360dcac2df77ad6c",{slot:15,field:"enabled",payload:"Aktiv"}),result=commandPipeline(input);check(JSON.stringify(flow.get("brew_state").template)===before,"Blankt punkt ble committet");check(result.brew.state.command_result.result==="Sperret","Blankt punkt ble ikke sperret");});
test("Timeradapter godtar norsk visningsverdi",()=>{setupTemplate();const timer=clone(flow.get("brew_state").template.timers[0]);flow.set("timer_editor_selected",timer.id);flow.set("timer_editor",timer);const input=runFunction("d17timercfg00002",{timer_field:"mode",payload:"Tell opp"});check(input.command==="APPLY_TIMER"&&input.timer.mode==="count_up","Tell opp ble ikke mappet");const result=commandPipeline(input);check(result.brew.state.command_result.result==="Utført","Timerendring feilet");});
test("Timeradapter avviser teknisk enum",()=>{setupTemplate();const timer=clone(flow.get("brew_state").template.timers[0]);flow.set("timer_editor_selected",timer.id);flow.set("timer_editor",timer);const input=runFunction("d17timercfg00002",{timer_field:"mode",payload:"count_up"});check(input.command==="HA_INPUT_REJECTED","Teknisk timerenum godtatt");});
test("Timerrekkefølge med ledende null avvises",()=>{setupTemplate();const timer=clone(flow.get("brew_state").template.timers[0]);flow.set("timer_editor_selected",timer.id);flow.set("timer_editor",timer);const before=JSON.stringify(flow.get("brew_state").template),input=runFunction("d17timercfg00002",{timer_field:"order_id",payload:"01"}),result=commandPipeline(input);check(JSON.stringify(flow.get("brew_state").template)===before,"Timer endret");check(result.brew.state.command_result.result==="Sperret","Timerverdi ikke sperret");});
test("Templatenotat på 255 tegn godtas",()=>{setupTemplate();const input=runFunction("74a29acf073d9c8f",{payload:"å".repeat(255)}),result=commandPipeline(input);check(result.brew.state.template.note.length===255,"Notat ikke lagret");});
test("Templatenotat på 256 tegn avvises",()=>{setupTemplate();const before=flow.get("brew_state").template.note,input=runFunction("74a29acf073d9c8f",{payload:"å".repeat(256)}),result=commandPipeline(input);check(flow.get("brew_state").template.note===before,"Langt notat lagret");check(result.brew.state.command_result.result==="Sperret","Langt notat ikke sperret");});
test("Templatelagring lager backup i tillatt separat katalog",()=>{setupTemplate();const hash="a".repeat(64),prepared=runFunction("d17savemtime0002",{payload:`1|1970-01-01 01:00:01.000000000 +0100\n${hash}` ,template_expected_sha256:hash,template_expected_mtime_ms:1000,template_write_payload:JSON.stringify(template),template_write_target:"/data/brewing-assistant/templates/test-ipl.json",_msgid:"save-1"})[0];check(/^\/data\/brewing-assistant\/template-backups\/\d{4}-\d{2}-\d{2}\.\d{2}-\d{2}-\d{2}\.\d{3}-test-ipl\.json\.prev$/.test(prepared.atomic_backup),`Feil backupsti ${prepared.atomic_backup}`);const guarded=runFunction("d5c90001ecb50001",prepared);check(guarded.atomic_target==="/data/brewing-assistant/templates/test-ipl.json","Målsti endret");check(guarded.atomic_backup.includes("/template-backups/"),"Backupkatalog ble ikke beholdt");check(guarded.filename.endsWith(".tmp-save-1"),"Unik tempfil mangler");});
test("Den rapporterte IPL-backupstien tillates eksplisitt",()=>{const backup="/data/brewing-assistant/template-backups/2026-08-25.11-41-17.620-2026-09-26-IPL.json.prev",guarded=runFunction("d5c90001ecb50001",{atomic_kind:"template",atomic_target:"/data/brewing-assistant/templates/2026-09-26-IPL.json",atomic_backup:backup,_msgid:"reported-path"});check(guarded.atomic_backup===backup,"Den rapporterte backupstien ble endret eller avvist");});
test("Templatebackup i målkatalogen avvises",()=>{let rejected=false;try{runFunction("d5c90001ecb50001",{atomic_kind:"template",atomic_target:"/data/brewing-assistant/templates/test.json",atomic_backup:"/data/brewing-assistant/templates/test.json.prev"});}catch(error){rejected=/backup-sti/.test(error.message);}check(rejected,"Feil backupkatalog ble godtatt");});
test("Katalogtraversering i atomiske stier avvises",()=>{for(const value of ["/data/brewing-assistant/templates/..","/data/brewing-assistant/template-backups/../templates/test.json.prev"]){let rejected=false;try{runFunction("d5c90001ecb50001",{atomic_kind:"template",atomic_target:value.includes("backup")?"/data/brewing-assistant/templates/test.json":value,atomic_backup:value.includes("backup")?value:"/data/brewing-assistant/template-backups/test.json.prev"});}catch(error){rejected=true;}check(rejected,`Traversering ble godtatt: ${value}`);}});
test("Templatelagring uten backup avvises",()=>{let rejected=false;try{runFunction("d5c90001ecb50001",{atomic_kind:"template",atomic_target:"/data/brewing-assistant/templates/test.json"});}catch(error){rejected=/backup-sti/.test(error.message);}check(rejected,"Template uten backup ble godtatt");});
test("Foreldet fasevalg avvises",()=>{setupTemplate();const result=runFunction("d35489e9b0087b12",{payload:"01 – gammelt navn"});check(result[0]===null&&result[1].command==="HA_INPUT_REJECTED","Foreldet fasevalg godtatt");});
test("Foreldet timervalg avvises",()=>{setupTemplate();const result=runFunction("d17timercfg00003",{payload:"timer_01 – gammelt navn"});check(result[0]===null&&result[1].command==="HA_INPUT_REJECTED","Foreldet timervalg godtatt");});
test("Foreldet templatevalg avvises",()=>{setupTemplate();flow.set("template_options",["Ingen valgt","test-ipl.json"]);const result=runFunction("7a84192029f2b637",{payload:"gammel.json"});check(result[0]===null&&result[1].command==="HA_INPUT_REJECTED","Foreldet templatevalg godtatt");});
test("Foreldet historikkvalg avvises",()=>{setupTemplate();flow.set("historical_session_options",["sesjon-a"]);const result=runFunction("rc2_history_select_handler",{payload:"sesjon-b"});check(result.command==="HA_INPUT_REJECTED","Foreldet historikkvalg godtatt");});
test("Foreldet kommentarvalg avvises",()=>{setupTemplate();const result=runFunction("1b00b03c7c611e39",{payload:"01_99 – gammel"});check(result.command==="HA_INPUT_REJECTED","Foreldet kommentarvalg godtatt");});
test("Select-inndata typekonverteres ikke",()=>{setupTemplate();flow.set("template_options",["Ingen valgt","123"]);flow.set("historical_session_options",["123"]);for(const [id,payload,index] of [["7a84192029f2b637",123,1],["d35489e9b0087b12",null,1],["d17timercfg00003",true,1],["rc2_history_select_handler",123,null],["1b00b03c7c611e39",{},null]]){const result=runFunction(id,{payload}),rejected=index===null?result:result[index];check(rejected&&rejected.command==="HA_INPUT_REJECTED",`${id} typekonverterte select-verdi`);}});
test("Blank fasepunktkommentar avvises",()=>{setupTemplate();const result=runFunction("3277e242da816dcd",{phasepoint_note_input:"   "});check(result.command==="HA_INPUT_REJECTED","Blank kommentar godtatt");});
test("Fasepunktkommentar over 255 avvises",()=>{setupTemplate();const result=runFunction("3277e242da816dcd",{phasepoint_note_input:"x".repeat(256)});check(result.command==="HA_INPUT_REJECTED","Lang kommentar godtatt");});
test("HA-ekko filtreres nøyaktig én gang",()=>{setupTemplate();const sync=runFunction("c1d51421264c2da9",{payload:{command:"LOAD_TEMPLATE",state:flow.get("brew_state"),selected_phase_id:"01"}});check(sync.length===120&&sync[0].payload==="Aktiv","Norsk editorsynk mangler");const first=runFunction("360dcac2df77ad6c",{slot:1,field:"enabled",payload:"Aktiv"});check(first===null,"Første ekko ble ikke filtrert");const second=runFunction("360dcac2df77ad6c",{slot:1,field:"enabled",payload:"Aktiv"});check(second&&second.command==="APPLY_PHASE_ITEMS","Andre brukerendring ble filtrert");});

test("Rapportarkivet bruker eksakt nulltilstand",()=>{resetStores();initIdle();flow.set("companion_ready",true);const out=runFunction("d15c000000000024",{payload:syntheticStorage()})[1];equal(out.report_attributes,{total_count:0,ordinary_count:0,historical_count:0,total_size:"0 B",ordinary_latest_filename:null,ordinary_latest_url:null,ordinary_public_copy_ok:null,historical_latest_filename:null,historical_latest_url:null,historical_public_copy_ok:null},"Tomt rapportarkiv");});
test("Rapportarkivet skiller ordinær og historisk",()=>{const h1="1".repeat(64),h2="2".repeat(64),out=runFunction("d15c000000000024",{payload:syntheticStorage([`REPORT|ordinær.html|100|10|${h1}`,`REPORT|historisk-historisk-rapport.html|200|20|${h2}`,`PUBLIC|ok|100|10|${h1}`,`PUBLIC_HISTORICAL|ok|200|20|${h2}`])})[1].report_attributes;check(out.total_count===2&&out.ordinary_count===1&&out.historical_count===1,"Rapporttelling feil");check(out.ordinary_public_copy_ok===true&&out.historical_public_copy_ok===true,"SHA-status feil");check(out.ordinary_latest_url.endsWith("?v=10")&&out.historical_latest_url.endsWith("?v=20"),"URL-cacheversjon feil");});
test("Fem sesjonskategorier er gjensidig utelukkende",()=>{const rows=["SESSION|a.jsonl|10|1|completed|yes|yes","SESSION|b.jsonl|20|2|ended|yes|yes","SESSION|c.jsonl|30|3|emergency|yes|yes","SESSION|d.jsonl|40|4|unfinished|yes|no","SESSION|e.jsonl|50|5|unfinished|no|yes"],a=runFunction("d15c000000000024",{payload:syntheticStorage(rows)})[2].session_attributes;equal(a,{total_count:5,total_size:"150 B",active_count:0,completed_count:1,ended_count:1,unfinished_count:2,unclassified_count:1},"Sesjonsklassifisering");check(a.active_count+a.completed_count+a.ended_count+a.unfinished_count+a.unclassified_count===a.total_count,"Sesjonsinvariant");});
test("Faktisk aktiv sesjon overstyrer filutfall",()=>{setupTemplate();const started=startReference(),session=started.msg.brew.state.session_id,hash="a".repeat(64),rows=[`SESSION|${session}.jsonl|10|1|completed|yes|yes`,`TEMPLATE|test-ipl.json|ok|${hash}|${hash}|100|1`],a=runFunction("d15c000000000024",{payload:syntheticStorage(rows),scan_active_template:"test-ipl.json"})[2].session_attributes;check(a.active_count===1&&a.completed_count===0&&a.total_count===1,"Aktiv sesjon dobbelttalt");});
test("Nødavslutning klassifiseres ufullført",()=>{resetStores();initIdle();const a=runFunction("d15c000000000024",{payload:syntheticStorage(["SESSION|nød.jsonl|10|1|emergency|yes|yes"])})[2].session_attributes;check(a.unfinished_count===1&&a.completed_count===0&&a.ended_count===0,"Nødavslutning feilklassifisert");});
test("Systemkontrollobjekter har ni felt uten ID",()=>{const out=runFunction("d15c000000000024",{payload:syntheticStorage()})[0],checks=JSON.parse(out.system_attributes.checks_json),keys=["group","name","status","blocks_start","method","target","result","conclusion","remediation"].sort();check(checks.length>10,"For få kontroller");for(const row of checks){equal(Object.keys(row).sort(),keys,"Kontrollskjema");check(!Object.prototype.hasOwnProperty.call(row,"id"),"Kontroll-ID lekket");check(["OK","Advarsel","Feil","Informasjon"].includes(row.status),"Engelsk kontrollstatus");if(row.status==="OK")check(row.remediation==="","OK-kontroll har tiltak");}});
test("Systemkontroll verifiserer Europe/Oslo og DST",()=>{const out=runFunction("d15c000000000024",{payload:syntheticStorage()})[0],checkRow=JSON.parse(out.system_attributes.checks_json).find(row=>row.name==="Containerens tidssone");check(checkRow&&checkRow.status==="OK","Tidssonekontroll feilet");check(checkRow.result.includes("januar -60")&&checkRow.result.includes("juli -120"),"DST-offset mangler");});
test("Alle tre arkivmeldinger består kontraktgrensen",()=>{const parsed=runFunction("d15c000000000024",{payload:syntheticStorage()});for(let index=0;index<3;index++){const bounded=runFunction("rc3_storage_contract_boundary",parsed[index]);check(Boolean(bounded[index]),`Arkivutgang ${index} stoppet`);}equal(flow.get("ha_contract_errors"),{},"Arkivkontraktfeil");});
test("Ugyldig rapportinvariant stoppes",()=>{const valid=runFunction("d15c000000000024",{payload:syntheticStorage()})[1];runFunction("rc3_storage_contract_boundary",valid);const before=clone(flow.get("ha_contract_last_valid").report),invalid=clone(valid);invalid.report_attributes.total_count=1;const bounded=runFunction("rc3_storage_contract_boundary",invalid);check(bounded.every(row=>row===null),"Ugyldig rapport publisert");equal(flow.get("ha_contract_last_valid").report,before,"Siste rapportverdi overskrevet");});
test("Historikkvalg bygges bare av gyldige journaler",()=>{const parsed=runFunction("d15c000000000024",{payload:syntheticStorage(["SESSION|a.jsonl|1|1|completed|yes|yes","SESSION|b.jsonl|1|2|ended|yes|no","SESSION|c.jsonl|1|3|unfinished|no|yes"])}),options=parsed[4].payload.options;equal(options,["a"],"Historikkvalg");equal(flow.get("historical_session_options"),["a"],"Lagrede historikkvalg");});
test("Historisk rapport sperres i aktiv brygging",()=>{setupTemplate();startReference();flow.set("historical_session_options",["tidligere-sesjon"]);flow.set("historical_session_selected","tidligere-sesjon");const routed=runFunction("rc2_history_button_handler",{dashboard_button:"Generer historisk rapport"});check(routed[0]===null&&routed[1].command==="HA_INPUT_REJECTED","Historisk rapport ble ikke sperret");const result=commandPipeline(routed[1]);check(result.brew.state.command_result.result==="Sperret","Sperringen nådde ikke kommandoresultatet");});
test("Historisk rapport avviser foreldet sesjonsvalg",()=>{resetStores();initIdle();flow.set("historical_session_options",["sesjon-a"]);flow.set("historical_session_selected","sesjon-b");const routed=runFunction("rc2_history_button_handler",{});check(routed[0]===null&&routed[1].command==="HA_INPUT_REJECTED","Foreldet rapportvalg ble godtatt");});
test("Historisk rapport godtar klassifisert sesjon når inaktiv",()=>{resetStores();initIdle();flow.set("historical_session_options",["sesjon-a"]);flow.set("historical_session_selected","sesjon-a");const routed=runFunction("rc2_history_button_handler",{});check(routed[0]&&routed[1]===null,"Gyldig historisk rapport ble sperret");check(routed[0].filename==="/data/brewing-assistant/sessions/sesjon-a.jsonl","Feil historikksti");});

test("Journalreplay gjenskaper startet sesjon",()=>{setupTemplate();const started=startReference(),journal=started.projection[2].payload,replayed=flow.get("brew_engine_lib").replayJournal(journal);check(replayed.status==="running"&&replayed.session_id===started.msg.brew.state.session_id,"Replay feilet");check(replayed.template.schema_version==="1.0","Replay endret skjema");});
test("RC3.3.2-journalkontrakten videreføres",()=>{check(baselineEntityManifest.state_schema_version==="1.0"&&baselineEntityManifest.event_schema_version==="1.0"&&baselineEntityManifest.template_schema_version==="1.0","RC3.3.2-schemakontrakt er ugyldig");setupTemplate();const started=startReference(),journal=started.projection[2].payload,events=journal.trim().split(/\n/).map(JSON.parse);check(events.length>0&&events.every(row=>row.event_schema_version===baselineEntityManifest.event_schema_version),"Journalen bryter RC3.3.2-hendelsesskjema");const replayed=flow.get("brew_engine_lib").replayJournal(journal);check(replayed.status==="running"&&replayed.session_id===started.msg.brew.state.session_id,"RC3.3.2-kontraktreplay feilet");});
test("Pause og fortsett beholder runtimekjernen",()=>{setupTemplate();startReference();let paused=commandPipeline({command:"PAUSE",dashboard_button:"Pause"});check(paused.brew.state.status==="paused","Pause feilet");let resumed=commandPipeline({command:"RESUME",dashboard_button:"Fortsett"});check(["running","waiting_confirmation","waiting_event"].includes(resumed.brew.state.status),"Fortsett feilet");check(resumed.brew.state.pause_history.length===1,"Pausehistorikk mangler");});
test("Manuell avslutning bruker ended",()=>{setupTemplate();startReference();const ended=commandPipeline({command:"END_BREWDAY",dashboard_button:"Avslutt"});check(ended.brew.state.status==="ended","Manuell avslutning feilet");check(ended.brew.log.payload.includes("brewday_ended"),"brewday_ended mangler");});
test("Rapportfilnavn er filsystemsikkert",()=>{setupTemplate();const L=flow.get("brew_engine_lib"),name=L.reportFilename(flow.get("brew_state"));check(/^\/data\/brewing-assistant\/reports\/\d{4}-\d{2}-\d{2}\.\d{2}-\d{2}-\d{2}-.*-brewday-report\.html$/.test(name),`Ugyldig rapportnavn ${name}`);check(!/[+:]/.test(path.basename(name)),"Offsettegn lekket til filnavn");});
test("Journalstier og pekerskjema er bevart",()=>{const text=JSON.stringify(flowNodes);check(text.includes('/data/brewing-assistant/sessions/${session}.jsonl'),"Journalsti endret");check(text.includes("active_session"),"Sesjonspeker mangler");check(!text.includes("default_template_filename"),"Default-templatearv finnes");});
test("Reell projeksjonsfeil stopper ikke brygging",()=>{setupTemplate();const started=startReference(),status=clone(started.statusMessage);status.payload.phase_overview.attributes.phases[0].status="active";runFunction("db14fc57897daad7",status);check(flow.get("brew_state").status==="running","Projeksjonsfeil stoppet brygging");check(flow.get("ha_contract_errors").phase_overview,"Projeksjonsfeil ble ikke registrert");});

function rc32ReportFixture(timerRows) {
  setupTemplate();
  const state = clone(flow.get("brew_state"));
  const phases = state.template.phases.filter(phase => phase.enabled === true);
  const phaseA = phases[0], phaseB = phases[1];
  const itemA = (phaseA.items || [])[0] || {id:phaseA.id + "_01",name:"Punkt A",description:"Beskrivelse A",expected_value:"Verdi A"};
  const itemB = (phaseB.items || [])[0] || {id:phaseB.id + "_01",name:"Punkt B",description:"Beskrivelse B",expected_value:"Verdi B"};
  const stamp = value => Date.parse(value);
  const a1Start = "2026-08-24T20:16:07+02:00", a1End = "2026-08-24T21:14:36+02:00";
  const b1Start = "2026-08-24T21:14:36+02:00", b1End = "2026-08-24T22:00:00+02:00";
  const a2Start = "2026-08-24T22:00:00+02:00", a2End = "2026-08-24T23:00:00+02:00";
  state.status = "ended"; state.session_id = "rc32-rapporttest";
  state.started_ts = stamp(a1Start); state.ended_ts = stamp(a2End);
  state.active_phase_id = ""; state.phase_index = -1; state.phase_started_ts = null;
  state.phase_history = [
    {phase_id:phaseA.id,phase_title:phaseA.title,started_ts:a1Start,ended_ts:a1End,started_ms:stamp(a1Start),ended_ms:stamp(a1End),actual_min:58,pause_min:0},
    {phase_id:phaseA.id,phase_title:phaseA.title,started_ts:a2Start,ended_ts:a2End,started_ms:stamp(a2Start),ended_ms:stamp(a2End),actual_min:60,pause_min:0},
    {phase_id:phaseB.id,phase_title:phaseB.title,started_ts:b1Start,ended_ts:b1End,started_ms:stamp(b1Start),ended_ms:stamp(b1End),actual_min:45,pause_min:0}
  ];
  state.session_log = [
    {event:"phasepoint_reached",phase_id:phaseA.id,phase_title:phaseA.title,ts:"2026-08-24T20:20:02+02:00",ts_ms:stamp("2026-08-24T20:20:02+02:00"),data:{item_id:itemA.id,title:itemA.name,description:itemA.description,expected_value:itemA.expected_value,delta_ms:2000}},
    {event:"phasepoint_note",phase_id:phaseA.id,phase_title:phaseA.title,ts:"2026-08-24T20:30:00+02:00",ts_ms:stamp("2026-08-24T20:30:00+02:00"),data:{item_id:itemA.id,title:itemA.name,description:itemA.description,expected_value:itemA.expected_value,note:"Kommentar forsøk 1",delta_ms:60000}},
    {event:"phasepoint_note",phase_id:phaseB.id,phase_title:phaseB.title,ts:"2026-08-24T21:30:00+02:00",ts_ms:stamp("2026-08-24T21:30:00+02:00"),data:{item_id:itemB.id,title:itemB.name,description:itemB.description,expected_value:itemB.expected_value,note:"Kommentar enkeltforsøk",delta_ms:0}},
    {event:"phasepoint_deviation",phase_id:phaseA.id,phase_title:phaseA.title,ts:"2026-08-24T22:10:00+02:00",ts_ms:stamp("2026-08-24T22:10:00+02:00"),data:{item_id:itemA.id,title:itemA.name,description:itemA.description,expected_value:itemA.expected_value,reason:"not_reached",delta_ms:-91000}},
    {event:"phasepoint_note",phase_id:phaseA.id,phase_title:phaseA.title,ts:"2026-08-24T22:20:00+02:00",ts_ms:stamp("2026-08-24T22:20:00+02:00"),data:{item_id:itemA.id,title:itemA.name,description:itemA.description,expected_value:itemA.expected_value,note:"Kommentar forsøk 2",delta_ms:120000}}
  ];
  const originalLibrary = flow.get("brew_engine_lib");
  if (timerRows) flow.set("brew_engine_lib",Object.assign({},originalLibrary,{timerReportRows:()=>clone(timerRows)}));
  let message;
  try { message = runFunction("97a8c295e52a671b",{payload:{state}}); }
  finally { if (timerRows) flow.set("brew_engine_lib",originalLibrary); }
  const rendered = runFunction("836ed3ea059e8f84",message);
  return {model:message.report_model,html:rendered.payload,phaseA,phaseB,itemA,itemB};
}

test("2026.11.07-1 sorterer faseforsøk etter faktisk start",()=>{
  const fixture=rc32ReportFixture(),rows=fixture.model.phase_rows.slice(0,3).map(row=>row.phase);
  equal(rows,[fixture.phaseA.title+" (forsøk 1)",fixture.phaseB.title,fixture.phaseA.title+" (forsøk 2)"],"Faseforsøk er ikke kronologiske");
});
test("2026.11.07-1 viser Start/slutt først med klokkeslett",()=>{
  const fixture=rc32ReportFixture(),section=sectionBetween(fixture.html,"<h2>Faser: planlagt vs. reell tidsbruk</h2>","<h2>Kronologisk logg</h2>");
  check(fixture.model.phase_rows[0].start_end==="20:16:07 – 21:14:36","Start/slutt har feil format");
  check(section.includes("<tr><th>Start/slutt</th><th>Fase</th><th>Plan min</th>"),"Start/slutt er ikke første kolonne");
  check(section.includes("<tr><td>20:16:07 – 21:14:36</td><td>"),"Første fasecelle er ikke Start/slutt");
  check(!section.includes("2026-08-24T"),"Full datostreng finnes i fasetabellen");
});
test("2026.11.07-1 forsøksmerker alle relevante loggrader",()=>{
  const fixture=rc32ReportFixture(),aRows=fixture.model.log_rows.filter(row=>row.phase.startsWith(fixture.phaseA.title)),bRows=fixture.model.log_rows.filter(row=>row.phase===fixture.phaseB.title);
  check(aRows.length===4,"Forventet fire loggrader for fasen med to forsøk");
  for(const row of aRows)check(/\(forsøk [12]\)$/.test(row.phase),`Mangler forsøksnummer på ${row.time}`);
  check(aRows.find(row=>row.expected_or_comment==="Kommentar forsøk 1").phase.endsWith("(forsøk 1)"),"Første kommentar har feil forsøk");
  check(aRows.find(row=>row.expected_or_comment==="Kommentar forsøk 2").phase.endsWith("(forsøk 2)"),"Andre kommentar har feil forsøk");
  check(bRows.length===1&&!bRows[0].phase.includes("(forsøk"),"Enkeltforsøk ble nummerert");
});
test("2026.11.07-1 skjuler tickavvik for automatisk fasepunkt",()=>{
  const row=rc32ReportFixture().model.log_rows.find(value=>value.time==="20:20:02");
  check(row&&row.schedule==="Fasepunkt nådd ihht tidsplan",`Feil automatisk fasepunkttekst: ${row&&row.schedule}`);
  check(!row.schedule.includes("etter tidsplan"),"Tickforsinkelse vises som prosessavvik");
});
test("2026.11.07-1 beholder reelt tidsavvik ved fasehopp",()=>{
  const row=rc32ReportFixture().model.log_rows.find(value=>value.time==="22:10:00");
  check(row&&row.schedule==="Fasepunkt fasehoppet 1:31 før tidsplan",`Feil fasehopptekst: ${row&&row.schedule}`);
});
test("2026.11.07-1 viser bare klokkeslett i Tidsmålinger",()=>{
  const timers=[{text:"Testtimer",start:"2026-08-24T20:16:07+02:00",end:"2026-08-24T21:14:36+02:00",result:"58:29",status:"Fullført"}],fixture=rc32ReportFixture(timers),row=fixture.model.timer_rows[0];
  equal({start:row.start,end:row.end},{start:"20:16:07",end:"21:14:36"},"Timerklokkeslett");
  const section=sectionBetween(fixture.html,"<h2>Tidsmålinger</h2>","<h2>Knappetrykk fra dashboard</h2>");
  check(!section.includes("2026-08-24T"),"Full datostreng finnes i tidsmålinger");
});
test("2026.11.07-1 beholder rapportens seks avtalte seksjoner",()=>{
  const html=rc32ReportFixture().html;
  for(const heading of ["Template-notat","Plan","Faser: planlagt vs. reell tidsbruk","Kronologisk logg","Tidsmålinger","Knappetrykk fra dashboard"])check(html.includes("<h2>"+heading+"</h2>"),`Mangler rapportseksjon ${heading}`);
});
test("2026.11.07-1-rapportmodell og renderer har målrettede endringer",()=>{
  const modelCode=byId.get("97a8c295e52a671b").func,rendererCode=byId.get("836ed3ea059e8f84").func;
  for(const marker of ["reportAttemptsById","Fasepunkt nådd ihht tidsplan","phaseRows.sort","phaseLabel(entry)"])check(modelCode.includes(marker),`Rapportmodell mangler ${marker}`);
  check(rendererCode.includes("<th>Start/slutt</th><th>Fase</th>"),"Renderer mangler ny kolonnerekkefølge");
});


test("[NR-ARK-001] Produksjonsfanen er versjonsnøytral",()=>{const tab=byId.get("brygging_production");check(tab&&tab.label==="Brygging – Produksjonsflow","Produksjonsfanen har feil navn");check(!tab.label.includes("rc"),"Produksjonsfanen inneholder releaseversjon");});
test("[NR-ARK-008] Dokumentasjonsfanen er fjernet",()=>{check(!byId.has("brygging_documentation"),"Dokumentasjonsfanen finnes");check(!flowNodes.some(node=>node.z==="brygging_documentation"),"Dokumentasjonsnoder finnes");});
test("[NR-LOG-008] Oppstartsrefresh er ikke dashboardknapp",()=>{const startup=runFunction("d15c000000000012",{origin:"system_startup"}),manual=runFunction("d15c000000000012",{});check(startup.command==="STORAGE_REFRESH"&&!startup.dashboard_button,"Oppstart ble knappetrykk");check(startup.origin==="system_startup","Oppstartsopprinnelse mangler");check(manual.dashboard_button==="Oppdater systemkontroll"&&manual.origin==="home_assistant","Manuell refresh mangler knappemarkør");});
test("[NR-RES-007] Vellykket restore produserer én varig state_restored",()=>{setupTemplate();const started=startReference(),journal=started.projection[2].payload;const restored=commandPipeline({command:"RESTORE_JOURNAL",journalText:journal,restore_source:"system_startup",origin:"system_startup"}),lines=String(restored.brew.log&&restored.brew.log.payload||"").trim().split(/\n/).filter(Boolean).map(JSON.parse),events=lines.filter(row=>row.event==="state_restored");check(events.length===1,"state_restored skal produseres én gang");const data=events[0].data;check(data.restore_source==="system_startup"&&data.phase_id&&data.phase_attempt===1,"Restorekontekst mangler");check(Number.isFinite(data.phase_elapsed_ms)&&data.phase_elapsed_ms>=0,"Medgått fasetid mangler");check(Object.prototype.hasOwnProperty.call(data,"phasepoint_id")&&Object.prototype.hasOwnProperty.call(data,"phasepoint_delta_ms"),"Fasepunktposisjon mangler");check(!lines.some(row=>row.event==="button_pressed"),"Restore ble logget som knappetrykk");const projection=runFunction("59a7dc4617e49624",restored);check(projection[2]&&projection.slice(0,2).every(value=>value===null),"Restore skal journalføres før status publiseres");check(String(projection[2].payload).includes('"event":"state_restored"'),"Journalporten mottok ikke state_restored");});
test("[NR-RES-008] Mislykket restore gir autoritativ diagnostikk",()=>{resetStores();initIdle();const restored=commandPipeline({command:"RESTORE_JOURNAL",journalText:"ikke-json",restore_source:"system_startup"}),state=restored.brew.state;check(state.status==="error","Feilet restore skal gi error");check(state.diagnostics.restore_result==="failed","Restore-resultat mangler");check(state.diagnostics.active_issues.journal_restore&&state.diagnostics.active_issues.journal_restore.level==="error","Journaldiagnostikk mangler");check(!String(restored.brew.log&&restored.brew.log.payload||"").includes("button_pressed"),"Restorefeil ble knappetrykk");});
test("[NR-RAP-018] Rapporten har grå tabellheadere",()=>{const fixture=rc32ReportFixture();check(fixture.html.includes("th{background:#bfbfbf;text-align:left}"),"Grå headerfarge mangler");check(!fixture.html.includes("th{background:#f1ece5"),"Gammel headerfarge finnes");});
test("[NR-RAP-019] Rapporten viser restorefase og tidsposisjon",()=>{rc32ReportFixture();const state=clone(flow.get("brew_state")),phase=state.template.phases.find(row=>row.enabled),item=(phase.items||[]).find(row=>row.enabled);state.status="running";state.session_id="restore-rapport";state.active_phase_id=phase.id;state.phase_index=0;state.phase_started_ts=Date.parse("2026-08-24T20:00:00+02:00");state.session_log=[{event:"state_restored",phase_id:phase.id,phase_title:phase.title,ts:"2026-08-24T20:05:37+02:00",ts_ms:Date.parse("2026-08-24T20:05:37+02:00"),data:{restore_source:"system_startup",restored_status:"running",phase_attempt:1,phase_elapsed_ms:337000,phasepoint_id:item.id,phasepoint_name:item.name,phasepoint_relation:"next",phasepoint_delta_ms:-126000}}];const message=runFunction("97a8c295e52a671b",{payload:{state}}),row=message.report_model.log_rows[0];check(row.point_name==="State gjenopprettet","Restore-navn mangler");check(row.phase===phase.title,"Restorefase mangler");check(row.point_description.includes(item.name)&&row.point_description.includes("systemoppstart"),"Restorefasepunkt mangler");check(row.schedule==="5:37 inn i fasen · 2:06 før neste fasepunkt","Feil tidsposisjon: "+row.schedule);});
test("[NR-RAP-011] Auditloggen inkluderer fire produserte kontrollhendelser",()=>{const code=byId.get("97a8c295e52a671b").func;for(const event of ["emergency_end_requested","emergency_end_blocked","prepare_new_requested","template_save_rejected"])check(code.includes('"'+event+'"'),"Rapporten mangler "+event);});
test("[NR-LOG-009] Rapporthendelser uten produsent er fjernet",()=>{const code=byId.get("97a8c295e52a671b").func;for(const event of ["template_loaded","template_saved","template_save_failed","state_write_failed","event_log_write_failed","reset","restore_failed","template_load_failed"])check(!code.includes(event+":")&&!code.includes('"'+event+'"'),"Uoppnåelig rapporthendelse finnes: "+event);check(code.includes('"state_restored"'),"state_restored mangler");});
test("[NR-TPL-019][HA-RED-005] Deaktivert tomt fasepunktnavn er gyldig",()=>{resetStores();runFunction("83e2bec1278381ab",{command:"INIT_IDLE"});const validator=flow.get("template_validator"),value=clone(template),phase=value.phases.find(row=>row.enabled),item=phase.items[0];item.enabled=false;item.name="";check(validator.validateTemplate(value,"statisk.json","TEST").valid,"Deaktivert tom plass ble avvist");item.enabled=true;const invalid=validator.validateTemplate(value,"statisk.json","TEST");check(!invalid.valid&&invalid.errors.some(row=>row.includes("aktivt fasepunkt må ha navn")),"Aktivt tomt punkt ble godtatt");});
test("[NR-TPL-014][NR-TPL-019] Alle 225 statiske fasepunktplasser kan valideres",()=>{resetStores();runFunction("83e2bec1278381ab",{command:"INIT_IDLE"});const validator=flow.get("template_validator"),value=clone(template);for(const phase of value.phases){const existing=new Map((phase.items||[]).map(item=>[item.id,item]));phase.items=Array.from({length:15},(_,index)=>{const id=phase.id+"_"+String(index+1).padStart(2,"0");return existing.get(id)||{id,order_id:index+1,enabled:false,type:"activity",name:"",description:"",expected_value:"",time:{reference:"phase_start",offset_min:0},requires_confirmation:false};});}const result=validator.validateTemplate(value,"225.json","TEST");check(result.valid,(result.errors||[]).join(" | "));check(result.item_count===225&&result.disabled_item_count>=138,"Feil statisk plassantall");});
test("[NR-ARK-010] Bekreftede write-only context- og statefelt er fjernet",()=>{const text=JSON.stringify(flowNodes);for(const key of ["latest_ordinary_report_filename","latest_historical_report_filename","status_publish_version","template_selection_setter_echo","storage_operation_error"])check(!text.includes(key),"Write-only nøkkel finnes: "+key);const engine=byId.get("f05c40c81761fcf4").func,initial=sectionBetween(engine,"function makeInitialState","function ensureRuntimeStateShape");check(!initial.includes("event_schema_version:"),"Redundant state.event_schema_version finnes");check(engine.includes("event_schema_version:EVENT_SCHEMA_VERSION")||engine.includes("event_schema_version: EVENT_SCHEMA_VERSION"),"Hendelsesskjema mangler i journalen");});
test("[NR-FEIL-006] Lagringsfeil bruker writer_health og diagnostikk",()=>{setupTemplate();const out=runFunction("d15c000000000033",{payload:{code:7},storage_operation:"Rydd rapporter"}),state=flow.get("brew_state"),health=flow.get("writer_health");check(out.payload==="","Lagringsresultat skal tømmes");check(health.storage_operation.ok===false&&health.storage_operation.last_error.includes("kode 7"),"Writer health mangler");check(state.diagnostics.active_issues.storage_operation&&state.diagnostics.active_issues.storage_operation.message.includes("kode 7"),"Vedvarende diagnostikk mangler");runFunction("d15c000000000033",{payload:{code:0},storage_operation:"Rydd rapporter"});check(flow.get("writer_health").storage_operation.ok===true,"Vellykket retry kvitterte ikke writer health");check(!flow.get("brew_state").diagnostics.active_issues.storage_operation,"Vellykket retry kvitterte ikke diagnostikk");});
test("[INS-VAL-013][INS-VAL-021][INS-VAL-022][INS-ETTER-017] Installeren validerer 2026.11.07-1-revisjonen",()=>{for(const marker of ["Brygging – Produksjonsflow","state_restored","storage_operation_error","brygging_documentation","status_publish_version","statisk 15×15-template","kontrollert oppstartsprobe"])check(installer.includes(marker),"Installer mangler "+marker);});

test("Installeren forventer 15 sensorer",()=>{check(installer.includes("expected={'sensor':15,'button':17,'select':87,'number':48,'text':63}"),"Installer har gammelt sensorantall");});
test("Installeren validerer kontraktmarkører",()=>{for(const marker of ["const HA_CONTRACT","validateHaSensor","buildHaProjection","phases_json","SET_PHASE_DURATION"])check(installer.includes(marker),`Installer mangler markør ${marker}`);});
test("Installeren verifiserer 2026.11.07-1-backuprettingen",()=>{check(installer.includes("template_backup_allowlist_rc31"),"Backupmarkør mangler");check(installer.includes("backupretting og Function-syntaks OK"),"Ettertest av backupretting mangler");check(!byId.get("d5c90001ecb50001").func.includes("backup !== prefix + backupBase"),"Gammel backupkontroll finnes fortsatt");});
test("Installerens validate-only består",()=>{const result=spawnSync(path.join(root,"install-brygging-2026.11.07-1.sh"),["--validate-only"],{cwd:root,encoding:"utf8",env:{...process.env,TZ:"Europe/Oslo"}});check(result.status===0,`Installer validering feilet: ${result.stdout}\n${result.stderr}`);});
test("README dokumenterer Europe/Oslo",()=>{check(readme.includes("TZ=Europe/Oslo"),"Tidssone mangler");check(readme.includes("+01:00")&&readme.includes("+02:00"),"DST-offset mangler");});
test("README dokumenterer ett Node-RED-mount",()=>{check((readme.match(/\/mnt\/docker\/nodered-brygging\/data:\/data/g)||[]).length===1,"Node-RED-mount er ikke entydig");check(readme.includes("ha-public:/config/www/brygging:ro"),"HA read-only mount mangler");});
test("README dokumenterer integrasjonsporten",()=>{for(const value of ["230 entiteter","reell Node-RED/Home Assistant","reconnect","RC3.3.2 → 2026.11.07-1"])check(readme.includes(value),`README mangler ${value}`);});
test("Pakkefilnavn er 2026.11.07-1-konsistente",()=>{for(const file of [flowPath,dashboardPath,installerPath,readmePath,templatePath,buildReportPath,testResultPath,baselineEntityManifestPath])check(fs.existsSync(file),`Mangler ${path.basename(file)}`);for(const value of ["v1.0.0-rc3.3.2-flow.json","v1.0.0-rc3.3.2.yaml","install-brygging-v1.0.0-rc3.3.2.sh"])check(!installer.includes(value)&&!readme.includes(value),`Baselinefilnavn lekker: ${value}`);});

if (failures.length) {
  console.error(`\n${failures.length} av ${namedTests} navngitte 2026.11.07-1-tester feilet:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
if (namedTests < 159) {
  console.error(`For få navngitte tester: ${namedTests}`);
  process.exit(1);
}
if (assertions < 7108) {
  console.error(`For få enkeltkontroller: ${assertions}`);
  process.exit(1);
}
console.log(`${assertions} av ${assertions} 2026.11.07-1-kontroller bestått i ${namedTests} navngitte tester.`);