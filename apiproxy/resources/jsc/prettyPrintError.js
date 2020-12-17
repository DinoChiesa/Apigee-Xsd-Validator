// prettyPrintError.js
// ------------------------------------------------------------------

/* jshint esversion:6, node:false, strict:implied */
/* global context */

var e = context.getVariable('error.content');
if (e) {
  try {
    e = JSON.parse(e);
    context.setVariable('error.content', JSON.stringify(e, null, 2));
  }
  catch(exc) {
    //gulp
  }
}
