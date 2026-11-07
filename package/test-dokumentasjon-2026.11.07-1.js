#!/usr/bin/env node
"use strict";

const fs=require("fs"),path=require("path"),crypto=require("crypto"),vm=require("vm");
const {spawnSync}=require("child_process");
const root=__dirname,docs=path.join(root,"dokumentasjon");
const flowPath=path.join(root,"brygging-assistent-2026.11.07-1-flow.json");
const dashboardPath=path.join(root,"brygging-dashboard-2026.11.07-1.yaml");
const flow=JSON.parse(fs.readFileSync(flowPath,"utf8")),dashboard=fs.readFileSync(dashboardPath,"utf8");
const byId=new Map(flow.map(n=>[n.id,n]));
const contractBase="HOME-ASSISTANT-NODE-RED-ENTITETS-OG-ATTRIBUTTKONTRAKT-2026.11.07-1";
const traceBase="KRAV-SPORBARHET-2026.11.07-1";
const xlsxPath=path.join(root,"verktoy","templategenerator","bryggedagsassistent-templategenerator-schema-1.0-2026.11.07-1.xlsx");
let assertions=0,named=0;const failures=[];
function check(v,m){assertions++;if(!v)throw new Error(m);}
function equal(a,b,m){check(JSON.stringify(a)===JSON.stringify(b),`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);}
function test(name,fn){named++;try{fn();console.log(`OK ${name}`);}catch(e){failures.push(`${name}: ${e.message}`);console.error(`FEIL ${name}: ${e.message}`);}}
function sha(p){return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");}
function allFiles(dir,prefix=""){const out=[];for(const name of fs.readdirSync(dir).sort()){const abs=path.join(dir,name),rel=path.join(prefix,name);if(fs.statSync(abs).isDirectory())out.push(...allFiles(abs,rel));else out.push(rel);}return out;}
function reqRows(text){return [...text.matchAll(/^\| ([A-Z][A-Z0-9-]+-\d{3}) \| (.*?) \| (.*?) \|$/gm)].map(m=>m[1]);}
function unescapeXml(s){return String(s).replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&quot;",'"').replaceAll("&apos;","'").replaceAll("&amp;","&");}

test("[DOC-PKG-001][DOC-HIE-001][DOC-SYS-001] Obligatorisk dokumentsett finnes",()=>{
 const bases=["00-DOKUMENTOVERSIKT-2026.11.07-1","KRAV-00-Felles-leveranse-dokumentasjon-og-konfigurasjonsstyring-2026.11.07-1","KRAV-01-Node-RED-runtime-template-og-rapportgenerering-2026.11.07-1","KRAV-02-Home-Assistant-dashboard-og-rapport-2026.11.07-1","KRAV-03-Installer-2026.11.07-1",traceBase,"AKSEPTANSEPLAN-2026.11.07-1",contractBase,"SYSTEMOVERSIKT-2026.11.07-1","SYSTEMDOKUMENTASJON-Node-RED-2026.11.07-1","SYSTEMDOKUMENTASJON-Home-Assistant-dashboard-2026.11.07-1","SYSTEMDOKUMENTASJON-Installer-2026.11.07-1","TEMPLATE-SCHEMA-OG-GENERATORVEILEDNING-2026.11.07-1","BYGGEOMFANG-2026.11.07-1"];
 for(const base of bases)for(const ext of [".md",".html"])check(fs.existsSync(path.join(docs,base+ext)),`Mangler ${base+ext}`);
 for(const file of ["NODE-RED-VARIABEL-OG-DATAFLYTKONTRAKT-2026.11.07-1.html","node-red-variabel-og-dataflytinventar-2026.11.07-1.json","krav-og-dokumentrevisjon-2026.11.07-1-summary.json"])check(fs.existsSync(path.join(docs,file)),`Mangler ${file}`);
});

test("[DOC-PKG-002][DOC-PKG-005] Versjoner og dokumentstatus er konsistente",()=>{
 for(const file of allFiles(root)){
  check(!/utkast|arbeidsgrunnlag/i.test(file),`Foreldet dokumentstatus i filnavn ${file}`);
  if(/\.(?:md|html|yaml|js|sh|json)$/.test(file)&&!file.includes("referansetemplate")&&!file.includes("dataflytinventar")){
   const text=fs.readFileSync(path.join(root,file),"utf8");
   if(file.startsWith("dokumentasjon/")&&!file.endsWith("summary.json"))check(!/Revisjonsstatus \|[^\n]*(?:utkast|arbeidsgrunnlag)/i.test(text),`Foreldet status i ${file}`);
  }
 }
 const normative=allFiles(docs).filter(file=>/^(?:KRAV-0[0-3]-|KRAV-SPORBARHET-|AKSEPTANSEPLAN-|HOME-ASSISTANT-NODE-RED-ENTITETS-OG-ATTRIBUTTKONTRAKT-).+\.(?:md|html)$/.test(file));
 for(const file of normative){const text=fs.readFileSync(path.join(docs,file),"utf8");for(const stale of [/RC3\.2/i,/\b7108\b/,/\b2089\b/])check(!stale.test(text),`Foreldet baseline i ${file}: ${stale}`);}
 const engine=byId.get("f05c40c81761fcf4").func;check(engine.includes('FLOW_VERSION = "2026.11.07-1"'),"Feil flow_version");check(dashboard.includes("title: Brygging 2026.11.07-1"),"Feil dashboardversjon");
});

test("[DOC-PKG-003] README peker til dokumentoversikt og korrekt installasjonsgrense",()=>{const readme=fs.readFileSync(path.join(root,"README-bryggedagsassistent-2026.11.07-1.html"),"utf8");for(const marker of ["00-DOKUMENTOVERSIKT-2026.11.07-1.html","bytter bare Node-REDs","RC3.3.2 → 2026.11.07-1"])check(readme.includes(marker),`README mangler ${marker}`);});

test("[DOC-PKG-004][DOC-VER-002] SHA-256-manifestet er komplett og gyldig",()=>{const lines=fs.readFileSync(path.join(root,"SHA256SUMS"),"utf8").trim().split(/\n/),listed=new Map(lines.map(line=>{const m=line.match(/^([a-f0-9]{64})  (.+)$/);check(m,"Ugyldig manifestlinje");return[m[2],m[1]];}));const actual=allFiles(root).filter(n=>n!=="SHA256SUMS");equal([...listed.keys()].sort(),actual,"Manifestets filsett avviker");for(const [file,digest] of listed)check(sha(path.join(root,file))===digest,`Hashavvik ${file}`);});

test("[DOC-HIE-002][DOC-HIE-003] Dokumentmatrisen har modul og normativ status",()=>{const text=fs.readFileSync(path.join(docs,"00-DOKUMENTOVERSIKT-2026.11.07-1.md"),"utf8");for(const marker of ["Felles","Node-RED","Dashboard","Installer","Templateverktøy","Normativ","Beskrivende","Avledet fra flow"])check(text.includes(marker),`Oversikten mangler ${marker}`);});

test("[DOC-VER-001] Alle lokale dokumentlenker løses i pakken",()=>{for(const rel of allFiles(root).filter(n=>/\.(?:md|html)$/.test(n))){const abs=path.join(root,rel),text=fs.readFileSync(abs,"utf8"),targets=[];for(const m of text.matchAll(/\]\(([^)]+)\)/g))targets.push(m[1]);for(const m of text.matchAll(/(?:href|src)="([^"]+)"/g))targets.push(m[1]);for(const target of targets){if(/^(?:https?:|mailto:|#|data:)/.test(target))continue;const clean=target.split("#")[0].split("?")[0];if(!clean)continue;const resolved=path.resolve(path.dirname(abs),clean);check(resolved.startsWith(root+path.sep),`${rel} lenker utenfor pakken: ${target}`);check(fs.existsSync(resolved),`${rel} har brutt lenke ${target}`);}}});

test("[DOC-TRC-001][DOC-TRC-002] Krav-ID-er er unike og matrisen har identisk sett",()=>{const files=fs.readdirSync(docs).filter(n=>/^KRAV-0[0-3]-.*\.md$/.test(n)),ids=files.flatMap(n=>reqRows(fs.readFileSync(path.join(docs,n),"utf8")));check(ids.length>300,`For få normative krav: ${ids.length}`);equal(new Set(ids).size,ids.length,"Dupliserte krav-ID-er");const trace=fs.readFileSync(path.join(docs,traceBase+".md"),"utf8"),matrix=[...trace.matchAll(/^\| ([A-Z][A-Z0-9-]+-\d{3}) \| KRAV-/gm)].map(m=>m[1]);equal(matrix.sort(),ids.sort(),"Sporbarhetsmatrisen avviker");});

test("[DOC-TRC-003][DOC-TRC-004] Krav, tester, assertions og akseptanse er skilt",()=>{const trace=fs.readFileSync(path.join(docs,traceBase+".md"),"utf8");for(const marker of ["Normative krav","Navngitte runtime-tester","Tekniske runtime-assertions","Akseptanseforløp","7154 er tekniske assertions, ikke funksjonelle krav","Målmiljøport"])check(trace.includes(marker),`Sporbarhet mangler ${marker}`);check(!trace.includes("7154 funksjonelle krav"),"Assertions feilklassifisert");});

test("[DOC-CON-001][DOC-CON-002] HA-kontrakten dekker hele faktiske grensesnittet",()=>{const c=fs.readFileSync(path.join(docs,contractBase+".md"),"utf8"),configs=flow.filter(n=>n.type==="ha-entity-config"&&["sensor","button","select","number","text"].includes(n.entityType));check(configs.length===230,"Flowen har feil entitetstall");for(const n of configs){const entity=`${n.entityType}.${n.name}`,visible=(n.haConfig||[]).find(x=>x.property==="name")?.value;check(c.includes(`\`${entity}\``),`Kontrakten mangler ${entity}`);check(visible&&c.includes(`| ${visible} |`),`Kontrakten mangler synlig navn ${visible}`);}for(const marker of ["| Totalt | 230 |","| Sensorer | 15 |","| Kontrollentiteter | 215 |","| Toppnivåattributter | 51 |","| Strukturerte objektfelt | 27 |","### 5.2 Toppnivåattributter – 51 felt","### 5.3 Eksakte skjemaer for listeobjekter – 27 felt"])check(c.includes(marker),`Kontrakten mangler ${marker}`);});

test("[DOC-CON-001] Dokumenterte entity-ID-er er nøyaktig flowens sett",()=>{const c=fs.readFileSync(path.join(docs,contractBase+".md"),"utf8"),start=c.indexOf("## 4. Komplett entitetsinventar"),end=c.indexOf("### 4.1",start),documented=[...c.slice(start,end).matchAll(/\| `((?:sensor|button|select|number|text)\.brygging_[^`]+)` \|/g)].map(m=>m[1]).sort(),actual=flow.filter(n=>n.type==="ha-entity-config"&&["sensor","button","select","number","text"].includes(n.entityType)).map(n=>`${n.entityType}.${n.name}`).sort();equal(documented,actual,"Dokumentert entitetssett avviker");});

test("[DOC-CON-002] Aktuelle norske systemkontroll- og arkivattributter er dokumentert",()=>{const c=fs.readFileSync(path.join(docs,contractBase+".md"),"utf8");for(const marker of ["`OK`, `Advarsel`, `Feil`, `Informasjon`","`total_count`","`ended_count`","`unclassified_count`","`checks_json`"])check(c.includes(marker),`Kontrakten mangler ${marker}`);for(const old of ["`legacy_count`","`deletable_count`","status=error","status=warning"])check(!c.includes(old),`Foreldet kontraktmarkør ${old}`);});

test("[DOC-CON-003] Dataflytinventaret peker på pakket flow",()=>{const inv=JSON.parse(fs.readFileSync(path.join(docs,"node-red-variabel-og-dataflytinventar-2026.11.07-1.json"),"utf8"));const actual=sha(flowPath);check(inv.source_sha256===actual||inv.metadata?.source_sha256===actual||JSON.stringify(inv).includes(actual),"Inventarets flowhash avviker");check(JSON.stringify(inv).includes("2026.11.07-1"),"Inventaret mangler releaseversjon");});

test("[DOC-VER-003] Direkte baseline er RC3.3.2 og bare versjonsdiff er tillatt",()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,"ha-entity-config-id-manifest-rc3.3.2.json"),"utf8"));
 const normalize=value=>["v1.0.0-rc3.3.2","v1.0.0-RC3.3.2","RC3.3.2","rc3.3.2","2026.11.07-1"].reduce((s,v)=>s.replaceAll(v,"__RELEASE__"),String(value));
 const digest=value=>crypto.createHash("sha256").update(value).digest("hex");
 check(m.source_version==="v1.0.0-rc3.3.2","Feil direkte baseline");
 check(Object.keys(m.entity_config_ids).length===230,"Baseline-manifestet mangler entiteter");
 for(const n of flow.filter(n=>n.type==="ha-entity-config"&&["sensor","button","select","number","text"].includes(n.entityType)))check(m.entity_config_ids[`${n.entityType}.${n.name}`]===n.id,`Config-ID endret for ${n.name}`);
 check(digest(normalize(fs.readFileSync(flowPath,"utf8")))===m.normalized_flow_sha256,"Flowen har annen endring enn versjonsmarkører");
 check(digest(normalize(dashboard))===m.normalized_dashboard_sha256,"Dashboardet har annen endring enn versjonsmarkører");
});

test("[DOC-PKG-006] XLSX-generator finnes og cached JSON består runtimevalidatoren",()=>{check(fs.existsSync(xlsxPath),"XLSX mangler");const unzip=spawnSync("unzip",["-p",xlsxPath,"xl/worksheets/sheet5.xml"],{encoding:"utf8",maxBuffer:8*1024*1024});check(unzip.status===0,"Kunne ikke lese XLSX");const lines=[];for(const m of unzip.stdout.matchAll(/<x:c r="A(\d+)"[^>]*t="str"><x:f>[\s\S]*?<\/x:f><x:v>([\s\S]*?)<\/x:v><\/x:c>/g)){const row=Number(m[1]);if(row>=12&&row<=289)lines.push([row,unescapeXml(m[2])]);}lines.sort((a,b)=>a[0]-b[0]);check(lines.length===278,`Fant ${lines.length} JSON-linjer`);const text=lines.map(x=>x[1]).join("\n"),value=JSON.parse(text);check(value.schema_version==="1.0"&&value.phases.length===15&&value.timers.length===15,"Generatorstruktur feil");check(value.phases.reduce((s,p)=>s+p.items.length,0)===225,"Generatoren har ikke 225 fasepunkter");const store=new Map(),flowApi={get:k=>store.get(k),set:(k,v)=>store.set(k,v)},nodeApi={error(m){throw new Error(String(m));},warn(){},status(){}};new vm.Script(`(function(msg,flow,node,context,global,env){${byId.get("83e2bec1278381ab").func}\n})`).runInNewContext({console,JSON,Math,Set,Map,Object,Array,String,Number,Boolean,RegExp,Error,parseInt,parseFloat,isNaN,Date,Intl})({command:"INIT_IDLE"},flowApi,nodeApi,{},{},()=>"");const result=store.get("template_validator").validateTemplate(value,"xlsx.json","DOC-TEST");check(result.valid,(result.errors||[]).join(" | "));});

test("[INS-VAL-008] Installerkravet samsvarer med skriptets endringsgrense",()=>{const h=spawnSync(path.join(root,"install-brygging-2026.11.07-1.sh"),["--help"],{encoding:"utf8"});check(h.status===0,"Installerhjelp feilet");for(const unsupported of ["--install-template","--replace-template","--skip-dashboard","--preserve-state"])check(!h.stdout.includes(unsupported),`Ikke implementert valg dokumentert: ${unsupported}`);for(const marker of ["Den installerer eller endrer ikke Home Assistant-dashboard, templates","--validate-only","--dry-run","--auto-rollback"])check(h.stdout.includes(marker),`Installerhjelp mangler ${marker}`);const req=fs.readFileSync(path.join(docs,"KRAV-03-Installer-2026.11.07-1.md"),"utf8");for(const unsupported of ["`--install-template`","`--replace-template`","`--skip-dashboard`","`--preserve-state`"])check(!req.includes(unsupported),`KRAV-03 beskriver gammelt valg ${unsupported}`);});

test("[DOC-VER-002] Installerens selvstendige mottakskontroll består",()=>{const r=spawnSync(path.join(root,"install-brygging-2026.11.07-1.sh"),["--validate-only"],{cwd:root,encoding:"utf8",env:{...process.env,TZ:"Europe/Oslo"},maxBuffer:8*1024*1024});check(r.status===0,`validate-only feilet: ${r.stdout}\n${r.stderr}`);});

if(failures.length){console.error(`\n${failures.length} av ${named} dokument-/pakkestester feilet:\n${failures.join("\n")}`);process.exit(1);}console.log(`${assertions} av ${assertions} dokument-/pakkekontroller bestått i ${named} navngitte tester.`);
