import test from "node:test";
import assert from "node:assert/strict";

import {
  CONVERSATION_CONTROL,
  detectConversationControl,
  hasOpeningGreeting,
} from "../core/conversation-lifecycle.js";


test("CONV-H1 detects greetings that accompany a substantive message", () => {
  assert.equal(
    hasOpeningGreeting("Hola, me siento perdido y no sé cómo Víctor me puede ayudar"),
    true,
  );
});


test("CONV-H1 recognizes continuation and closing controls", () => {
  assert.equal(
    detectConversationControl("Quiero hacer otra consulta"),
    CONVERSATION_CONTROL.CONTINUE,
  );

  assert.equal(
    detectConversationControl("No, gracias"),
    CONVERSATION_CONTROL.CLOSE,
  );
});


test("CONV-H1 recognizes structured feedback values", () => {
  assert.equal(
    detectConversationControl("Sí, me ha resultado útil"),
    CONVERSATION_CONTROL.FEEDBACK_POSITIVE,
  );

  assert.equal(
    detectConversationControl("Más o menos"),
    CONVERSATION_CONTROL.FEEDBACK_NEUTRAL,
  );

  assert.equal(
    detectConversationControl("No me ha resultado útil"),
    CONVERSATION_CONTROL.FEEDBACK_NEGATIVE,
  );
});

test('H3.24 feedback only auto-finalizes when no optional support choice is pending', async()=>{
 const {shouldFinalizeFeedbackConversation,SUPPORT_QUICK_REPLY_ID}=await import('../core/conversation-lifecycle.js');
 const supportReplies=[{id:SUPPORT_QUICK_REPLY_ID.ACCEPT},{id:SUPPORT_QUICK_REPLY_ID.DECLINE}];
 assert.equal(shouldFinalizeFeedbackConversation({decision:{metadata:{feedbackRating:'positive'}},response:{quickReplies:supportReplies}}),false);
 assert.equal(shouldFinalizeFeedbackConversation({decision:{metadata:{feedbackRating:'neutral'}},response:{quickReplies:supportReplies}}),false);
 assert.equal(shouldFinalizeFeedbackConversation({decision:{metadata:{feedbackRating:'negative'}},response:{quickReplies:[]}}),true);
 assert.equal(shouldFinalizeFeedbackConversation({decision:{metadata:{feedbackRating:null}},response:{quickReplies:[]}}),false);
});
