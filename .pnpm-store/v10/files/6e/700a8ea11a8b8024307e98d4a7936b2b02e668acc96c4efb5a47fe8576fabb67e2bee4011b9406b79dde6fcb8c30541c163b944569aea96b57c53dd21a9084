import * as _ from './escape.js';
export function xml(style) {
    var _a, _b, _c, _d, _e, _f, _g;
    const title = (_a = style.meta) === null || _a === void 0 ? void 0 : _a.title;
    const creator = (_b = style.meta) === null || _b === void 0 ? void 0 : _b.creator;
    const source = (_c = style.meta) === null || _c === void 0 ? void 0 : _c.source;
    const license = (_e = (_d = style.meta) === null || _d === void 0 ? void 0 : _d.license) === null || _e === void 0 ? void 0 : _e.url;
    const rights = text(style);
    if (!title && !creator && !source && !license && !rights) {
        return '';
    }
    // https://nsteffel.github.io/dublin_core_generator/generator.html
    return ('<metadata' +
        ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
        ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        ' xmlns:dcterms="http://purl.org/dc/terms/">' +
        '<rdf:RDF>' +
        '<rdf:Description>' +
        (title ? `<dc:title>${_.xml(title)}</dc:title>` : '') +
        (creator ? `<dc:creator>${_.xml(creator)}</dc:creator>` : '') +
        (source
            ? `<dc:source xsi:type="dcterms:URI">${_.xml((_g = (_f = style.meta) === null || _f === void 0 ? void 0 : _f.source) !== null && _g !== void 0 ? _g : '')}</dc:source>`
            : '') +
        (license
            ? `<dcterms:license xsi:type="dcterms:URI">${_.xml(license)}</dcterms:license>`
            : '') +
        (rights ? `<dc:rights>${_.xml(rights)}</dc:rights>` : '') +
        '</rdf:Description>' +
        '</rdf:RDF>' +
        '</metadata>');
}
export function text(style) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    let title = ((_a = style.meta) === null || _a === void 0 ? void 0 : _a.title) ? `„${(_b = style.meta) === null || _b === void 0 ? void 0 : _b.title}”` : 'Design';
    let creator = `„${(_d = (_c = style.meta) === null || _c === void 0 ? void 0 : _c.creator) !== null && _d !== void 0 ? _d : 'Unknown'}”`;
    if ((_e = style.meta) === null || _e === void 0 ? void 0 : _e.source) {
        title += ` (${style.meta.source})`;
    }
    let result = '';
    if (((_g = (_f = style.meta) === null || _f === void 0 ? void 0 : _f.license) === null || _g === void 0 ? void 0 : _g.name) !== 'MIT' &&
        ((_h = style.meta) === null || _h === void 0 ? void 0 : _h.creator) !== 'DiceBear' &&
        ((_j = style.meta) === null || _j === void 0 ? void 0 : _j.title)) {
        result += 'Remix of ';
    }
    result += `${title} by ${creator}`;
    if ((_l = (_k = style.meta) === null || _k === void 0 ? void 0 : _k.license) === null || _l === void 0 ? void 0 : _l.name) {
        result += `, licensed under „${(_o = (_m = style.meta) === null || _m === void 0 ? void 0 : _m.license) === null || _o === void 0 ? void 0 : _o.name}”`;
        if ((_q = (_p = style.meta) === null || _p === void 0 ? void 0 : _p.license) === null || _q === void 0 ? void 0 : _q.url) {
            result += ` (${style.meta.license.url})`;
        }
    }
    return result;
}
