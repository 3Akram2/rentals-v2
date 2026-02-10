import { readFileSync, existsSync } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { render } from 'ejs';
import { BASE_DIRECTORY } from 'src/main';
import { preflightLogger } from 'src/shared/preflight.logger';

function loadYamlFile(filePath) {
    if (!filePath) {
        return {};
    }
    //logger is not available at this moment
    filePath = path.resolve(filePath);
    if (existsSync(filePath)) {
        preflightLogger.info(`loading configuration file: ${filePath}`);
        try {
            const configTemplate = readFileSync(filePath, 'utf8');
            const configString = render(configTemplate);
            return yaml.load(configString) as Record<string, any>;
        } catch (error) {
            preflightLogger.warn(error);
            return {};
        }
    } else {
        preflightLogger.info(`configuration file not exists: ${filePath}`);
        return {};
    }
}

function mergeWithBase(base, source) {
    for (const key of Object.keys(source)) {
        if (base[key] && typeof source[key] === 'object') {
            base[key] = { ...base[key], ...source[key] };
        } else {
            base[key] = source[key];
        }
    }
}

export default () => {
    // put config.yaml at app base, supply absolute path to yaml file or fallback to empty object
    // CONFIG=/absolute/path/to/config.yaml npm run start
    const INSTANCE = process.env.INSTANCE || 'main-1';

    const baseConfigProduction = loadYamlFile(path.join(BASE_DIRECTORY, 'app-config/config.yaml'));

    const mainConfigProduction = loadYamlFile(path.join(BASE_DIRECTORY, 'runtime/config/config.yaml'));
    const instanceConfigProduction = loadYamlFile(path.join(BASE_DIRECTORY, `runtime/config/config.${INSTANCE}.yaml`));
    const envConfig = loadYamlFile(process.env.CONFIG);

    const options = baseConfigProduction;

    mergeWithBase(options, mainConfigProduction);
    mergeWithBase(options, instanceConfigProduction);
    mergeWithBase(options, envConfig);

    return options;
};
