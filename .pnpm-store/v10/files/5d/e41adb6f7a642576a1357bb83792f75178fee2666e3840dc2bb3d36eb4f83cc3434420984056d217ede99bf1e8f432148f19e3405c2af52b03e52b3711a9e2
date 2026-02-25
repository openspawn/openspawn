import { RemoteUser } from '@verdaccio/types';
/**
 * All logged users will have by default the group $all and $authenticate
 */
export declare const defaultLoggedUserRoles: string[];
/**
 *
 */
export declare const defaultNonLoggedUserRoles: string[];
/**
 * Create a RemoteUser object
 * @return {Object} \{ name: xx, pluginGroups: [], real_groups: [] \}
 */
export declare function createRemoteUser(name: string, pluginGroups: string[]): RemoteUser;
/**
 * Builds an anonymous remote user in case none is logged in.
 * @return {Object} \{ name: xx, groups: [], real_groups: [] \}
 */
export declare function createAnonymousRemoteUser(): RemoteUser;
