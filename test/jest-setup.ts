import supertest from 'supertest';
import { SetupServer } from '@src/server';

// let server: SetupServer;
beforeAll(async () => {
    const server = new SetupServer();
    server.init();
    global.testRequest = supertest(server.getApp());
});

// afterAll(async () => await server.close());