import test from 'node:test';
import assert from 'node:assert/strict';
import { cases } from '../data/conversation-corpus-h3-v2.js';
import { processDialogueTurn } from '../core/dialogue-manager.js';
import { resetState, getState } from '../core/state.js';
import { conversationStateFromMessages } from '../core/conversational-state-v2.js';
import { critiqueConversation, ensureInteractionCompleteness, finalizeConversationResponse, roboticLanguage } from '../core/conversation-quality-gate.js?v=conv-h3.22.2';
import { resolveRelatedEvidence, EVIDENCE_LEVEL } from '../core/evidence-resolver-v2.js';
import { createResponseEnvelope } from '../core/response-contract.js';
const text = r => r.response.messages.map(m=>m.text).join(' ');
function run(inputs) { resetState(); return inputs.map(userText => processDialogueTurn({userText})); }
function complete(r) {
 assert.ok(text(r).trim()); assert.doesNotMatch(text(r),roboticLanguage);
 assert.ok(r.response.quickReplies.length || r.response.actions.length);
 assert.equal(r.response.actions.filter(a=>a.type==='start-diagnostic').length,1);
 assert.ok(r.response.actions.length<=3);
}
for (const [i, inputs] of cases.entries()) test(`H3.22 original conversation ${i+1}, every turn has options and diagnosis`,()=>{
 const results=run(inputs); results.forEach(complete);
 for(let j=1;j<results.length;j++) assert.notEqual(text(results[j]),text(results[j-1]),`repeated answer at ${j}`);
 if(i===0) assert.match(text(results.at(-1)),/cada mes/);
 if(i===1) { assert.match(text(results[2]),/Power BI funciona bien/); assert.match(text(results[4]),/Access/); assert.match(text(results[4]),/antes de cargarlos/); }
 if(i===2) { assert.match(text(results[5]),/Sí.*experiencia profesional.*Excel.*Access/); assert.doesNotMatch(text(results[7]),/Power BI/); }
 if(i===3) { assert.match(text(results.at(-1)),/^Sí.*automatizar/); assert.match(text(results.at(-1)),/Excel y CSV/); }
 if(i===4 || i===5) assert.ok(results.every(r=>!r.response.followUp?.text?.includes('llamas')));
 if(i===6) { const t=text(results.at(-1)); for(const pattern of [/4 Excel/,/5 horas/,/cada semana/,/errores/,/validar/,/columnas/]) assert.match(t,pattern); }
});

test('H3.16 corrections and knowledge detours do not contaminate facts',()=>{
 run(['Tengo un problema con Excel','No usamos Excel, solo Access','Cada semana','¿Y sabe Power BI?','Volvamos a mi caso']);
 const state=conversationStateFromMessages(getState().conversation.messages);
 assert.deepEqual(state.knownFacts.tools,['Access']); assert.equal(state.knownFacts.frequency,'weekly');
 assert.ok(state.correctedFacts.some(f=>f.removed==='Excel')); assert.equal(state.activeTopic,'visitor_case');
});
test('H3.16 reset removes the replayable case projection',()=>{run(cases[6]);resetState();assert.equal(conversationStateFromMessages(getState().conversation.messages).currentGoal,null);});
test('H3.17 tools alone do not fabricate the operation',()=>{const r=run(cases[0].slice(0,2)).at(-1);assert.equal(r.decision.metadata.conversationalState.knownFacts.operation,undefined);});
test('H3.17 ordinal answers resolve visible alternatives',()=>{const r=run([cases[0][0],'la primera']).at(-1);assert.equal(r.decision.metadata.conversationalState.knownFacts.operation,'consolidate');});
test('H3.19 critic detects robotic text, repetition, unanswered request and contradiction',()=>{
 const response=createResponseEnvelope({id:'response-bad-draft',kind:'discovery',outcome:'answered',messages:[{id:'bad-text',text:'Ese dato ayuda. Power BI es el problema.'}]});
 const review=critiqueConversation(response,{state:{knownFacts:{healthyTools:['Power BI']}},turn:{intent:'PROVIDE_VALUE'},messages:[{role:'assistant',text:'Ese dato ayuda. Power BI es el problema.'}]});
 for(const code of ['INTERNAL_LANGUAGE','REPEATED_RESPONSE','UNANSWERED_REQUEST','CONTRADICTS_CORRECTION']) assert.ok(review.repairReasons.includes(code));
});
test('H3.19 repair replaces a bad draft and the final result passes critic',()=>{
 const messages=[{role:'user',text:cases[6][0]}];
 const bad=createResponseEnvelope({id:'response-bad-draft',kind:'discovery',outcome:'answered',messages:[{id:'bad-text',text:'Ese dato ayuda, pero no responde a la pregunta.'}]});
 const repaired=finalizeConversationResponse(bad,cases[6][1],{recentMessages:messages});
 assert.ok(critiqueConversation(repaired).pass);assert.match(repaired.messages[0].text,/5 horas/);
});
test('H3.20 explicit contact exposes the three functional actions',()=>{const r=run(['Quiero contactar con Víctor']).at(-1);assert.deepEqual(r.response.actions.map(a=>a.type),['open-contact','start-diagnostic','open-calendly']);});
test('H3.20 gate is idempotent and does not duplicate diagnosis',()=>{const r=run(['Hola'])[0].response;assert.deepEqual(ensureInteractionCompleteness(ensureInteractionCompleteness(r)),ensureInteractionCompleteness(r));});
test('H3.20 explicit closing stays terminal',()=>{const r=run(['Hola','Gracias, ya está']).at(-1);assert.equal(r.response.actions.length,0);});
test('H3.21 Excel Access Power BI use professional evidence',()=>{const r=resolveRelatedEvidence({tools:['Excel','Access','Power BI']});assert.equal(r.level,EVIDENCE_LEVEL.PROFESSIONAL);assert.equal(r.records.length,3);});
test('H3.21 unknown tool is not invented evidence',()=>assert.equal(resolveRelatedEvidence({tools:['ImaginaryTool']} ).level,EVIDENCE_LEVEL.NONE));
for(const [kind,expected,metadata] of [['project',EVIDENCE_LEVEL.PROJECT,{}],['capability',EVIDENCE_LEVEL.CAPABILITY,{}],['technology',EVIDENCE_LEVEL.TRAINING,{}]]) test(`H3.21 distinguishes ${expected}`,()=>{
 const record={kind,knowledgeId:kind==='technology'?'technology-example':'example',technologies:['technology-example'],metadata};
 assert.equal(resolveRelatedEvidence({tools:['Example']},[record]).level,expected);
});
test('H3.21 exact identity requires a project ID, not tool overlap',()=>{
 const index=[{kind:'project',knowledgeId:'project-test',technologies:['technology-example']}];
 assert.equal(resolveRelatedEvidence({tools:['Example']},index).level,EVIDENCE_LEVEL.PROJECT);
 assert.equal(resolveRelatedEvidence({exactCaseId:'project-test'},index).level,EVIDENCE_LEVEL.EXACT_CASE);
});
for (const frequency of ['cada semana','cada mes','cada día']) for (const tools of ['Excel y CSV','Access y Excel']) test(`H3.22 shuffled facts ${tools} ${frequency}`,()=>{
 const inputs=['Tengo un problema con unos datos',`Los juntamos manualmente ${frequency}`,`Usamos ${tools}`,'Tardamos cinco horas','¿Se podría automatizar?'];
 const results=run(inputs);results.forEach(complete);assert.match(text(results.at(-1)),/Sí.*automatizar/);
});
test('H3.22 all original quick reply labels produce a usable next turn',()=>{
 for(const inputs of cases) {
   const results=run(inputs);
   for(let i=0;i<results.length;i++) for(const reply of results[i].response.quickReplies) {
     run(inputs.slice(0,i+1)); complete(processDialogueTurn({userText:reply.value}));
   }
 }
});


test('H3.16 case facts survive history truncation and storage restore',async()=>{
 const {buildPersistedState,validatePersistedState}=await import('../core/storage.js');
 const {restorePersistedState}=await import('../core/state.js');
 run(['Tengo un problema con Excel y Access','No usamos Excel, solo Access','Cada semana']);
 for(let i=0;i<30;i++) processDialogueTurn({userText:'¿Víctor tiene experiencia con AWS?'});
 assert.equal(getState().conversation.messages.length,50);
 const persisted=buildPersistedState(getState()); assert.ok(validatePersistedState(persisted).valid);
 resetState();restorePersistedState(persisted);
 const resumed=processDialogueTurn({userText:'Volvamos a mi caso'});
 assert.match(text(resumed),/Access/);assert.doesNotMatch(text(resumed),/Excel|AWS/);
 assert.equal(getState().understanding.conversationalState.knownFacts.frequency,'weekly');
});
test('H3.16 old saved sessions without V2 still validate',async()=>{
 const {buildPersistedState,validatePersistedState}=await import('../core/storage.js');
 resetState();const legacy=structuredClone(buildPersistedState(getState()));delete legacy.understanding.conversationalState;
 assert.ok(validatePersistedState(legacy).valid);
});
test('H3.16 factual projection rejects free text and unknown fields',async()=>{
 const {buildPersistedState,validatePersistedState}=await import('../core/storage.js');
 run(cases[6]);const payload=structuredClone(buildPersistedState(getState()));
 payload.understanding.conversationalState.knownFacts.email='private@example.com';
 assert.equal(validatePersistedState(payload).valid,false);
});
test('H3.19 final critic pass is observable and repair is bounded',async()=>{
 const {getConversationReview}=await import('../core/conversation-quality-gate.js?v=conv-h3.22.2');
 for(const inputs of cases) for(const result of run(inputs)) {
  const review=getConversationReview(result.response);assert.ok(review);assert.ok(review.final.pass,JSON.stringify(review));assert.ok(review.repairCount<=1);
 }
});
test('H3.21 VBA macros resolve from professional knowledge',()=>assert.equal(resolveRelatedEvidence({tools:['VBA']}).level,EVIDENCE_LEVEL.PROFESSIONAL));
