import { writable } from 'svelte/store';
import { addSection } from './src/lib/songStore.js';

const songStore = writable({
  name: "Test",
  sections: [ { name: "intro", nMeasures: 4 } ],
  parts: [ { name: "bass", performances: [ { file: "intro.mid" } ] } ]
});

let currentState;
songStore.subscribe(s => currentState = s);

console.log("Before:", currentState.sections.length);
songStore.set(addSection(currentState, 1));
console.log("After:", currentState.sections.length);
