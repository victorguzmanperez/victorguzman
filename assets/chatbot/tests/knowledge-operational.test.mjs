import test from "node:test";
import assert from "node:assert/strict";

import {
  CLAIM_STATUS,
  KNOWLEDGE_TYPE,
} from "../data/knowledge/constants.js";

import {
  assertValidKnowledgeItems,
} from "../data/knowledge/validators.js";

import {
  evidenceIndexByKnowledgeId,
} from "../data/knowledge/evidence-index.js";

import {
  diagnosticKnowledge,
  getDiagnosticById,
  getDiagnosticFact,
} from "../data/knowledge/diagnostics.js";

import {
  contactKnowledge,
  getContactById,
  getContactFact,
} from "../data/knowledge/contacts.js";

import {
  bookingKnowledge,
  getBookingById,
  getBookingFact,
} from "../data/knowledge/bookings.js";

import {
  policyKnowledge,
  getPolicyById,
  getPolicyFact,
} from "../data/knowledge/policies.js";


test(
  "diagnostic knowledge is valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          diagnosticKnowledge,
        ),
    );
  },
);


test(
  "diagnostic uses DIAGNOSTIC type",
  () => {
    assert.equal(
      diagnosticKnowledge[0].type,
      KNOWLEDGE_TYPE.DIAGNOSTIC,
    );
  },
);


test(
  "diagnostic exposes current form fields",
  () => {
    const item =
      diagnosticKnowledge[0];

    const fields =
      getDiagnosticFact(
        item,
        "prefillable-fields",
      ).value;

    assert.ok(
      fields.includes(
        "nombre",
      ),
    );

    assert.ok(
      fields.includes(
        "email",
      ),
    );

    assert.ok(
      fields.includes(
        "gestion_actual",
      ),
    );

    assert.ok(
      fields.includes(
        "resultado_esperado",
      ),
    );
  },
);


test(
  "privacy consent is never prefilled",
  () => {
    const item =
      diagnosticKnowledge[0];

    const prefillable =
      getDiagnosticFact(
        item,
        "prefillable-fields",
      ).value;

    const forbidden =
      getDiagnosticFact(
        item,
        "never-prefill-fields",
      ).value;

    assert.equal(
      prefillable.includes(
        "acepta_privacidad",
      ),
      false,
    );

    assert.ok(
      forbidden.includes(
        "acepta_privacidad",
      ),
    );
  },
);


test(
  "diagnostic never submits automatically",
  () => {
    assert.equal(
      getDiagnosticFact(
        diagnosticKnowledge[0],
        "automatic-submit",
      ).value,
      false,
    );
  },
);


test(
  "contact knowledge is valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          contactKnowledge,
        ),
    );
  },
);


test(
  "contact uses CONTACT type",
  () => {
    assert.equal(
      contactKnowledge[0].type,
      KNOWLEDGE_TYPE.CONTACT,
    );
  },
);


test(
  "public email is available",
  () => {
    assert.equal(
      getContactFact(
        contactKnowledge[0],
        "contact-email",
      ).value,
      "victorguzman.data.pro@gmail.com",
    );
  },
);


test(
  "contact includes email LinkedIn and diagnostic",
  () => {
    assert.deepEqual(
      getContactFact(
        contactKnowledge[0],
        "contact-channels",
      ).value,
      [
        "email",
        "linkedin",
        "diagnostic",
      ],
    );
  },
);


test(
  "commercial escalation is planned toward human contact",
  () => {
    const fact =
      getContactFact(
        contactKnowledge[0],
        "commercial-escalation",
      );

    assert.equal(
      fact.status,
      CLAIM_STATUS.PLANNED,
    );

    assert.equal(
      fact.value,
      "pricing-budget-quote-to-human-contact",
    );
  },
);


test(
  "booking knowledge is valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          bookingKnowledge,
        ),
    );
  },
);


test(
  "booking uses BOOKING type",
  () => {
    assert.equal(
      bookingKnowledge[0].type,
      KNOWLEDGE_TYPE.BOOKING,
    );
  },
);


test(
  "booking provider is Calendly",
  () => {
    assert.equal(
      getBookingFact(
        bookingKnowledge[0],
        "booking-provider",
      ).value,
      "calendly",
    );
  },
);


test(
  "meeting duration is thirty minutes",
  () => {
    assert.equal(
      getBookingFact(
        bookingKnowledge[0],
        "meeting-duration-minutes",
      ).value,
      30,
    );
  },
);


test(
  "booking prefill is limited to name and email",
  () => {
    assert.deepEqual(
      getBookingFact(
        bookingKnowledge[0],
        "booking-prefill-fields",
      ).value,
      [
        "name",
        "email",
      ],
    );
  },
);


test(
  "booking tracks real Calendly events",
  () => {
    const events =
      getBookingFact(
        bookingKnowledge[0],
        "booking-events",
      ).value;

    assert.ok(
      events.includes(
        "calendly.date_and_time_selected",
      ),
    );

    assert.ok(
      events.includes(
        "calendly.event_scheduled",
      ),
    );
  },
);


test(
  "booking confirmation requires event_scheduled",
  () => {
    assert.equal(
      getBookingFact(
        bookingKnowledge[0],
        "booking-confirmation-event",
      ).value,
      "calendly.event_scheduled",
    );
  },
);


test(
  "automatic booking is disabled",
  () => {
    assert.equal(
      getBookingFact(
        bookingKnowledge[0],
        "automatic-booking",
      ).value,
      false,
    );
  },
);


test(
  "policy knowledge is valid",
  () => {
    assert.doesNotThrow(
      () =>
        assertValidKnowledgeItems(
          policyKnowledge,
        ),
    );
  },
);


test(
  "three chatbot policies exist",
  () => {
    assert.equal(
      policyKnowledge.length,
      3,
    );
  },
);


test(
  "all policy records use POLICY type",
  () => {
    for (
      const policy
      of policyKnowledge
    ) {
      assert.equal(
        policy.type,
        KNOWLEDGE_TYPE.POLICY,
      );
    }
  },
);


test(
  "conversation uses sessionStorage with eight hour TTL",
  () => {
    const policy =
      getPolicyById(
        "policy-chatbot-session-data",
      );

    assert.equal(
      getPolicyFact(
        policy,
        "conversation-storage",
      ).value,
      "sessionStorage",
    );

    assert.equal(
      getPolicyFact(
        policy,
        "conversation-ttl-hours",
      ).value,
      8,
    );
  },
);


test(
  "conversation transcripts are not stored centrally automatically",
  () => {
    const policy =
      getPolicyById(
        "policy-chatbot-session-data",
      );

    assert.equal(
      getPolicyFact(
        policy,
        "automatic-central-transcript-storage",
      ).value,
      false,
    );
  },
);


test(
  "analytics forbids PII and raw conversation text",
  () => {
    const policy =
      getPolicyById(
        "policy-chatbot-analytics-privacy",
      );

    const forbidden =
      getPolicyFact(
        policy,
        "analytics-forbidden-data",
      ).value;

    for (
      const key of [
        "name",
        "email",
        "phone",
        "conversation",
        "raw-message",
        "free-text",
      ]
    ) {
      assert.ok(
        forbidden.includes(key),
      );
    }
  },
);


test(
  "exact-question feedback requires explicit opt-in",
  () => {
    const policy =
      getPolicyById(
        "policy-chatbot-improvement-feedback",
      );

    assert.equal(
      getPolicyFact(
        policy,
        "exact-question-feedback",
      ).value,
      "optional-explicit-user-consent",
    );
  },
);


test(
  "operational knowledge never allows inference",
  () => {
    const items = [
      ...diagnosticKnowledge,
      ...contactKnowledge,
      ...bookingKnowledge,
      ...policyKnowledge,
    ];

    for (
      const item
      of items
    ) {
      assert.equal(
        item.answerPolicy
          .allowInference,
        false,
      );
    }
  },
);


test(
  "operational knowledge is not professional evidence",
  () => {
    const items = [
      ...diagnosticKnowledge,
      ...contactKnowledge,
      ...bookingKnowledge,
      ...policyKnowledge,
    ];

    for (
      const item
      of items
    ) {
      assert.equal(
        evidenceIndexByKnowledgeId[
          item.id
        ],
        undefined,
      );
    }
  },
);


test(
  "operational getters fail safely",
  () => {
    assert.equal(
      getDiagnosticById(
        "diagnostic-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getContactById(
        "contact-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getBookingById(
        "booking-does-not-exist",
      ),
      null,
    );

    assert.equal(
      getPolicyById(
        "policy-does-not-exist",
      ),
      null,
    );
  },
);