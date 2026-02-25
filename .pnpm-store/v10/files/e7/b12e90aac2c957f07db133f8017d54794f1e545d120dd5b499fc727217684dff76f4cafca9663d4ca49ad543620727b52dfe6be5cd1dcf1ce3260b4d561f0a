export declare enum EncryptionMethod {
    md5 = "md5",
    sha1 = "sha1",
    crypt = "crypt",
    blowfish = "blowfish",
    sha256 = "sha256",
    sha512 = "sha512"
}
/**
 * Create salt
 * @param {EncryptionMethod} type The type of salt: md5, blowfish (only some linux
 * distros), sha256 or sha512. Default is sha512.
 * @returns {string} Generated salt string
 */
export declare function createSalt(type?: EncryptionMethod): string;
/**
 * Crypt(3) password and data encryption.
 * @param {string} key user's typed password
 * @param {string} salt Optional salt, for example SHA-512 use "$6$salt$".
 * @returns {string} A generated hash in format $id$salt$encrypted
 * @see https://en.wikipedia.org/wiki/Crypt_(C)
 */
export default function crypt3(key: string, salt?: string): string;
