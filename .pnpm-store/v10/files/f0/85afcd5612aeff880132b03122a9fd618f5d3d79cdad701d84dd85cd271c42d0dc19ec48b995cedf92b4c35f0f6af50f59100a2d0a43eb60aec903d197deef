export function mergeScopePolicies(policyA, policyB) {
    if (policyA.length === 0 || policyB.length === 0) {
        return policyA.length
            ? policyA.map((group) => [...group])
            : policyB.map((group) => [...group]);
    }
    const groupMap = new Map();
    for (const groupA of policyA) {
        for (const groupB of policyB) {
            const merged = Array.from(new Set([...groupA, ...groupB])).sort();
            const key = merged.join(",");
            groupMap.set(key, merged);
        }
    }
    const candidates = Array.from(groupMap.values()).sort((a, b) => a.length - b.length);
    const finalGroups = [];
    for (const candidate of candidates) {
        if (!finalGroups.some((existing) => isSubset(existing, candidate))) {
            finalGroups.push(candidate);
        }
    }
    finalGroups.sort((a, b) => a.length - b.length || a.join(",").localeCompare(b.join(",")));
    return finalGroups;
}
function isSubset(subset, superset) {
    if (subset.length > superset.length) {
        return false;
    }
    const supersetSet = new Set(superset);
    return subset.every((item) => supersetSet.has(item));
}
