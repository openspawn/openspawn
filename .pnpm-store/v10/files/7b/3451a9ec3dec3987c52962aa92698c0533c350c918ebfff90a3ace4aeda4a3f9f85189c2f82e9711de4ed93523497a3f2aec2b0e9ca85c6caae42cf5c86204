import { Router } from 'express';
import { ConfigYaml } from '@verdaccio/types';
import Auth from '../../../../lib/auth';
export interface Profile {
    tfa: boolean;
    name: string;
    email: string;
    email_verified: boolean;
    created: string;
    updated: string;
    cidr_whitelist: string[] | null;
    fullname: string;
}
export default function (router: Router, auth: Auth, config: ConfigYaml): void;
