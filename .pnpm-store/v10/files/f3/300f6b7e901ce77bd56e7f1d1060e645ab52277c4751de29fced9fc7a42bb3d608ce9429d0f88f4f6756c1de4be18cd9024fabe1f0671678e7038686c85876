const MIN = -2147483648;
const MAX = 2147483647;
function xorshift(value) {
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return value;
}
function hashSeed(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
        hash = xorshift(hash);
    }
    return hash;
}
export function create(seed = '') {
    // Ensure that seed is a string
    seed = seed.toString();
    let value = hashSeed(seed) || 1;
    const next = () => (value = xorshift(value));
    const integer = (min, max) => {
        return Math.floor(((next() - MIN) / (MAX - MIN)) * (max + 1 - min) + min);
    };
    return {
        seed,
        next,
        bool(likelihood = 50) {
            return integer(1, 100) <= likelihood;
        },
        integer(min, max) {
            return integer(min, max);
        },
        pick(arr, fallback) {
            var _a;
            if (arr.length === 0) {
                next();
                return fallback;
            }
            return (_a = arr[integer(0, arr.length - 1)]) !== null && _a !== void 0 ? _a : fallback;
        },
        shuffle(arr) {
            // Each method call should call the `next` function only once.
            // Therefore, we use a separate instance of the PRNG here.
            const internalPrng = create(next().toString());
            // Fisher-Yates shuffle algorithm - We do not use the Array.sort method
            // because it is not stable and produces different results when used in
            // different browsers. See: https://github.com/dicebear/dicebear/issues/394
            const workingArray = [...arr];
            for (let i = workingArray.length - 1; i > 0; i--) {
                const j = internalPrng.integer(0, i);
                [workingArray[i], workingArray[j]] = [workingArray[j], workingArray[i]];
            }
            return workingArray;
        },
        string(length, characters = 'abcdefghijklmnopqrstuvwxyz1234567890') {
            // Each method call should call the `next` function only once.
            // Therefore, we use a separate instance of the PRNG here.
            const internalPrng = create(next().toString());
            let str = '';
            for (let i = 0; i < length; i++) {
                str += characters[internalPrng.integer(0, characters.length - 1)];
            }
            return str;
        },
    };
}
