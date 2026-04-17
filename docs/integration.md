\# Integration



\## SDK Example



import { executeDecisionInput } from "../execution/sdk";



const result = executeDecisionInput({

&#x20; input,

&#x20; context: {

&#x20;   schema,

&#x20;   rule\_set

&#x20; }

});



\## API



POST /evaluate



Body:

{

&#x20; decision\_input,

&#x20; schema,

&#x20; rule\_set

}



\## Use Cases



\- GitHub PR Gate

\- Payment validation

\- Access control

