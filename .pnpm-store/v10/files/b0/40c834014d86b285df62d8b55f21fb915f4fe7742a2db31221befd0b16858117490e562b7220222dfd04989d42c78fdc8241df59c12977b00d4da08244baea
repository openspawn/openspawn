import { Router } from 'express';
import { Config, Manifest } from '@verdaccio/types';
import Auth from '../../../lib/auth';
import Storage from '../../../lib/storage';
export type PackcageExt = Manifest & {
    author: any;
    dist?: {
        tarball: string;
    };
};
declare function addPackageWebApi(storage: Storage, auth: Auth, config: Config): Router;
export default addPackageWebApi;
