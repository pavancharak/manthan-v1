// 4. scripts/governance/templates.js

function genericTemplate(intentName) {
  return {
    schema: {
      intent: intentName,
      schema_version: "v1",
      system_fields: {}
    },

    rules: {
      rule_version: "v1",
      rules: []
    }
  };
}

function paymentTemplate(intentName) {
  return {
    schema: {
      intent: intentName,
      schema_version: "v1",
      system_fields: {
        amount: "number",
        isTrustedDevice: "boolean"
      }
    },

    rules: {
      rule_version: "v1",
      rules: [
        {
          id: "allow-small-payment",
          group: 1,
          order: 1,
          required: true,
          condition: {
            field: "amount",
            operator: "lt",
            value: 100
          },
          outcome: "ALLOW",
          actions: []
        }
      ]
    }
  };
}

function mergeSafetyTemplate(intentName) {
  return {
    schema: {
      intent: intentName,
      schema_version: "v1",
      system_fields: {
        isApproved: "boolean",
        hasNewCommitsAfterApproval: "boolean"
      }
    },

    rules: {
      rule_version: "v1",
      rules: [
        {
          id: "block-unapproved",
          group: 1,
          order: 1,
          required: true,
          condition: {
            field: "isApproved",
            operator: "eq",
            value: false
          },
          outcome: "BLOCK",
          actions: []
        }
      ]
    }
  };
}

module.exports = {
  genericTemplate,
  paymentTemplate,
  mergeSafetyTemplate
};