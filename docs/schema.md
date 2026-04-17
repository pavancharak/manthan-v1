\# Schema



Schema defines required structure of Decision Input.



\## Responsibilities



\- Define required fields

\- Define types

\- Define structure



\## Validation Rules



\- Missing required field → ESCALATE

\- Invalid type → REJECT

\- Extra field → REJECT



\## Example



{

&#x20; "fields": {

&#x20;   "amount": "number",

&#x20;   "userId": "string"

&#x20; },

&#x20; "required": \["amount", "userId"]

}

