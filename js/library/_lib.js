/* Library registry. Each area file calls LIB_ADD({ id, title, group, order, glyph, blurb, intro, modules }).
   A lesson is { id, t, mins, body: [html paragraphs], keys: [], ex, fact, quiz: [{ q, o: [], a, why }], viz: [] }. */
window.PNODE = window.PNODE || { phases: [], mind: [], capstones: [] };
window.PNODE.library = window.PNODE.library || [];
window.LIB_ADD = function (area) { window.PNODE.library.push(area); };
