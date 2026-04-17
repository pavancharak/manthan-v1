import { Schema, DecisionInput } from "../core/types";

export function validateInput(schema: Schema, input: DecisionInput) {
const errors: string[] = [];
let isComplete = true;

for (const key of Object.keys(input)) {
if (!schema.fields[key]) {
return {
isValid: false,
isComplete: false,
errors: [`Unexpected field: ${key}`],
};
}
}

for (const [field, config] of Object.entries(schema.fields)) {
const value = input[field];

```
if (config.required && value === undefined) {
  isComplete = false;
  continue;
}

if (value !== undefined && typeof value !== config.type) {
  return {
    isValid: false,
    isComplete: false,
    errors: [`Invalid type for ${field}`],
  };
}
```

}

return { isValid: true, isComplete, errors };
}
