/* Library registry. Each area file calls LIB_ADD({ id, title, group, order, glyph, blurb, intro, modules }).
   A lesson is { id, t, mins, body: [html paragraphs], keys: [], ex, fact, quiz: [{ q, o: [], a, why }], viz: [] }. */
window.PNODE = window.PNODE || { phases: [], mind: [], capstones: [] };
window.PNODE.library = window.PNODE.library || [];
window.LIB_ADD = function (area) { window.PNODE.library.push(area); };
/* LIB_CODE(lessonId, problems) attaches coding problems to a lesson defined in another file.
   Files named zz-*.js load last, after every area exists. */
window.LIB_CODE = function (lessonId, problems) {
  for (const a of window.PNODE.library) for (const m of a.modules) for (const l of m.lessons) {
    if (l.id === lessonId) { l.code = (l.code || []).concat(problems); return; }
  }
  console.warn("LIB_CODE: unknown lesson " + lessonId);
};
