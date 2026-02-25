// @see https://www.regular-expressions.info/unicode.html
export function getInitials(seed, discardAtSymbol = true) {
    let input = seed;
    // Optionally discard everything after `@`-symbol
    if (discardAtSymbol) {
        input = seed.replace(/@.*/, '');
    }
    // Remove common apostrophes
    input = input.replace(/[`´‘’'ʼ]/g, '');
    const matches = input.match(/(\p{L}[\p{L}\p{M}]*)/gu);
    if (!matches) {
        // Re-run without discarding `@`-symbol, if no matches
        return discardAtSymbol ? getInitials(seed, false) : '';
    }
    if (matches.length === 1) {
        return matches[0].match(/^(?:\p{L}\p{M}*){1,2}/u)[0].toUpperCase();
    }
    const firstCharacter = matches[0].match(/^(?:\p{L}\p{M}*)/u)[0];
    const secondCharacter = matches[matches.length - 1].match(/^(?:\p{L}\p{M}*)/u)[0];
    return (firstCharacter + secondCharacter).toUpperCase();
}
