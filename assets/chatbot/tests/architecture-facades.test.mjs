import test from 'node:test';
import assert from 'node:assert/strict';

test('FINAL QA: planned data and integration facade modules are no longer empty placeholders', async()=>{
 const [policies,responses,analytics,calendly,diagnostic,integrations]=await Promise.all([
   import('../data/policies.js'),
   import('../data/responses.js'),
   import('../integrations/analytics.js'),
   import('../integrations/calendly.js'),
   import('../integrations/diagnostic.js'),
   import('../integrations/integrations.js'),
 ]);
 assert.ok(Array.isArray(policies.policyKnowledge));
 assert.ok(responses.RESPONSE_ARCHITECTURE.problemFlow);
 assert.equal(typeof analytics.createChatbotAnalyticsObserver,'function');
 assert.ok(Array.isArray(calendly.bookingKnowledge));
 assert.ok(Array.isArray(diagnostic.diagnosticKnowledge));
 assert.equal(integrations.CHATBOT_INTEGRATIONS.analytics.provider,'GA4');
});
