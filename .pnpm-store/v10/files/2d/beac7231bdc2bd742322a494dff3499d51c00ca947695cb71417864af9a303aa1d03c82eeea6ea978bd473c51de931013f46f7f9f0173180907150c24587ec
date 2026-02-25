export function stripTypeModifiers(type) {
    return type.replaceAll("!", "").replaceAll("[", "").replaceAll("]", "");
}
export function stripNonNull(type) {
    return type.replace(/\!$/, "");
}
export function stripList(type) {
    return type.replace(/^\[/, "").replace(/\]$/, "");
}
export function isNonNull(type) {
    return type.endsWith("!");
}
export function isList(type) {
    return type.endsWith("]");
}
