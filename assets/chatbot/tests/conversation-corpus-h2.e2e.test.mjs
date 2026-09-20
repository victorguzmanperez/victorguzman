import test from 'node:test';
import assert from 'node:assert/strict';
import {conversationCorpus} from '../data/conversation-corpus-h2.js';
import {processDialogueTurn} from '../core/dialogue-manager.js';
import {resetState} from '../core/state.js';
import {sanitizeAnalyticsParams} from '../core/analytics.js';
for(const scenario of conversationCorpus) test(`H2 natural conversation: ${scenario.id}`,()=>{
  resetState();scenario.turns.forEach((userText,i)=>{const r=processDialogueTurn({userText});const text=r.response.messages.map(m=>m.text).join(' ') + ' ' + r.response.actions.map(a=>a.label).join(' ');assert.ok(text.length>10);assert.doesNotMatch(text,/undefined|\[object Object\]/);assert.match(text,new RegExp(scenario.checks[i],'i'),`${scenario.id} turn ${i}: ${text}`);assert.notEqual(r.decision.route,'fallback');});
});
for(const value of ['Miguel','600123456','miguel@example.com','mi-empresa','Excel-y-Access','secret:123']) test(`analytics rejects token-shaped private value ${value}`,()=>{
  for(const key of ['source','route','intent','page_id','reset_source'])assert.deepEqual(sanitizeAnalyticsParams({[key]:value}),{});
});
