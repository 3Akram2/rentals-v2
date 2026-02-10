import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import * as fs from 'fs';
import { AppLoggerService } from './app-logger/app-logger.service';
import { AppModule } from './app.module';
import { preflightLogger } from './shared/preflight.logger';
import { networkInterfaces } from 'os';
import { default as helmet } from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { API, BASE_API, Loggers } from './shared/constants';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const BASE_DIRECTORY = __dirname;

async function bootstrap() {
    preflightLogger.info('===================== APPLICATION STARTING =====================');
    preflightLogger.info(`NODE_VERSION: ${process.version}`);
    preflightLogger.info(`Current Working Directory ${process.cwd()}`);
    preflightLogger.info(`Base Directory ${BASE_DIRECTORY}`);

    //by default it is 2, so file mode 0o777 will end up as 0o775
    process.umask(0);

    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
        // httpsOptions: buildHTTPSOptions(),
    });
    //wait for loading configuration
    await ConfigModule.envVariablesLoaded;

    app.setGlobalPrefix(API);

    setupMiddleware(app);

    setupSwagger(app);

    //setup logger
    app.useLogger(app.get(AppLoggerService));

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            // forbidNonWhitelisted: true,
        }),
    );
    //start listening
    const configService = app.get(ConfigService);
    await app.listen(configService.get('server').port, () => logServerListeningMessage(app));
}

export function getSSL() {
    const keysDirPath = path.resolve(process.env.SSL_KEYS || __dirname + '/runtime/keys');
    if (!fs.existsSync(keysDirPath)) {
        fs.mkdirSync(keysDirPath, { recursive: true });
    }
    const privateKeyFile = path.resolve(keysDirPath, 'privatekey.pem');
    const certFile = path.resolve(keysDirPath, 'cert.pem');
    return { privateKeyFile, certFile, keysDirPath };
}

function buildHTTPSOptions(): HttpsOptions {
    const options: HttpsOptions = {};

    const { certFile, privateKeyFile, keysDirPath } = getSSL();

    if (fs.existsSync(privateKeyFile) && fs.existsSync(certFile)) {
        options.key = fs.readFileSync(privateKeyFile);
        options.cert = fs.readFileSync(certFile);
        //https://node.readthedocs.io/en/latest/api/tls/
        //https://radiostud.io/nodeexpress-application-over-https/
        //nmap --script ssl-enum-ciphers -p 3030 localhost
        options.ciphers = 'EECDH+AESGCM'; //export NODE_OPTIONS=--tls-cipher-list='EECDH+AESGCM'
        options.honorCipherOrder = true;
    } else {
        preflightLogger.info(
            `NO SSL Support: please make sure that '${keysDirPath}' includes privatekey.pem and cert.pem files to enable HTTPS.`,
        );
    }
    return options;
}

function setupMiddleware(app: INestApplication) {
    const configService = app.get(ConfigService);
    const logger = new Logger(Loggers.MainApp_Middlewares);

    const expressApp = app as NestExpressApplication;
    if (expressApp.useBodyParser) {
        const expressBodyLimit = configService.get('server').expressBodyLimit || '50mb';
        // app.use(json({ limit: expressBodyLimit }));
        // app.use(urlencoded({ extended: true, limit: expressBodyLimit }));
        expressApp.useBodyParser('json', { limit: expressBodyLimit });
        expressApp.useBodyParser('urlencoded', {
            extended: true,
            limit: expressBodyLimit,
        } as undefined);
    }
    if (typeof configService.get('server').helmet === 'object') {
        app.use(helmet(configService.get('server').helmet));
        logger.verbose(`helmet middleware enabled`);
        logger.debug(`helmet configuration: ${JSON.stringify(configService.get('server').helmet)}`);
    } else if (configService.get('server').helmet === 'default') {
        app.use(helmet({ contentSecurityPolicy: false, frameguard: false }));
        logger.verbose(`helmet middleware enabled using default configuration`);
    } else {
        logger.verbose(`helmet middleware disabled`);
    }

    if (typeof configService.get('server').cors === 'object') {
        app.enableCors(configService.get('server').cors);
        logger.verbose(`CORS middleware enabled`);
        logger.debug(`CORS configuration: ${JSON.stringify(configService.get('server').cors)}`);
    } else if (configService.get('server').cors === 'default') {
        app.enableCors({
            exposedHeaders: ['Content-Disposition'],
            allowedHeaders: '*',
            origin: '*',
            credentials: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });
        logger.verbose(`CORS middleware enabled using default configuration`);
    } else {
        logger.verbose(`CORS middleware disabled`);
    }

    if (configService.get('server').compression) {
        app.use(compression());
        logger.verbose(`compression middleware enabled`);
    } else {
        logger.verbose(`compression middleware disabled`);
    }

    app.use(cookieParser('63fdbcdd85d4eee543a496df'));

    const appLoggerService = app.get(AppLoggerService);
    if (appLoggerService.isAccessLoggerActive()) {
        logger.log(`access-log middleware enabled.`);
        app.use(appLoggerService.accessLoggerMiddleware.bind(appLoggerService));
    }
}

function setupSwagger(app: INestApplication) {
    const configService = app.get(ConfigService);
    const logger: Logger = new Logger(Loggers.ApiDocumentation);
    const config = configService.get('api-documentation');
    if (!config || !config.published) {
        logger.warn('api-documentation endpoint is not published');
        return;
    }
    const documentBuilder = new DocumentBuilder()
        .setTitle(config.title)
        .setDescription(config.description)
        .setVersion('1.0')
        .addBearerAuth();

    const documentConfig = documentBuilder.build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup(`${BASE_API}${config.root}`, app, document);
    logger.log(`documentation published at: ${BASE_API}${config.root}, ${BASE_API}${config.root}-json`);
}

function logServerListeningMessage(app: INestApplication) {
    const protocol = app.getHttpAdapter().getHttpServer().cert ? 'https' : 'http';
    const configService = app.get(ConfigService);
    const port = configService.get('server').port;

    const logger = new Logger(Loggers.MainApp);
    const nets = networkInterfaces();
    const results = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    logger.log(`server started on ${protocol}://localhost:${port}`);
    results.forEach((ip) => {
        logger.log(`                  ${protocol}://${ip}:${port}`);
    });
}

process.env.TZ = 'UTC';

bootstrap();
