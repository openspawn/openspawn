"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpolateEnvironmentVariablesToIndex = interpolateEnvironmentVariablesToIndex;
function interpolateEnvironmentVariablesToIndex(contents, deployUrl) {
    const environmentVariables = getClientEnvironment(deployUrl || '');
    return interpolateEnvironmentVariables(contents, environmentVariables);
}
const NX_PREFIX = /^NX_PUBLIC_/i;
function isNxEnvironmentKey(x) {
    return NX_PREFIX.test(x);
}
function getClientEnvironment(deployUrl) {
    return Object.keys(process.env)
        .filter(isNxEnvironmentKey)
        .reduce((env, key) => {
        env[key] = process.env[key];
        return env;
    }, {
        NODE_ENV: process.env.NODE_ENV || 'development',
        DEPLOY_URL: deployUrl || process.env.DEPLOY_URL || '',
    });
}
function interpolateEnvironmentVariables(documentContents, environmentVariables) {
    let temp = documentContents;
    for (const [key, value] of Object.entries(environmentVariables)) {
        temp = temp.replace(new RegExp(`%${key}%`, 'g'), value);
    }
    return temp;
}
