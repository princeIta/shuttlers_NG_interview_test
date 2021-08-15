import axios from "axios"
import exp from "constants";
import express from 'express';
import http, { Server } from 'http';
import { AddressInfo } from "net";
import { io, Socket } from "socket.io-client";
import loadExpress from '../src/loaders/express';
import loadSocket from "../src/loaders/socket"
import repository, { Asset } from "../src/repository"

jest.setTimeout(20000)

const createPartialDone = (count: number, done: () => void) => {
    let i = 0;
    return () => {
        if (++i === count) {
            done();
        }
    };
};

function createCoord(lat: number, lon: number, distance: number, bearing: number = 20) {
    let radius = 6371e3, // meters
        angularDistance = Number(distance) / radius, // angular distance in radians
        b = toRad(Number(bearing)),
        lat1 = toRad(lat),
        lon1 = toRad(lon);

    let lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(b));

    let lon2 = lon1 + Math.atan2(Math.sin(b) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));

    // normalise to -180..+180°
    lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

    return [toDeg(lat2), toDeg(lon2)];
}

function toDeg(n: number) { return n * 180 / Math.PI; }
function toRad(n: number) { return n * Math.PI / 180; }

describe("socket e2e test", function () {
    let httpServer: Server,
        clientA: Socket,
        clientB: Socket,
        clientC: Socket,
        PORT: number,
        assets: Array<Asset>

    beforeEach(function (done) {
        assets = [
            { id: 1, lat: 36.84754, lon: -56.02496, },
            { id: 2, lat: -13.42203, lon: -107.76352, },
            { id: 3, lat: -35.74252, lon: 158.25625, },
        ]

        repository.data.assets = assets
        done()
    })

    describe("Asset position update", function () {
        beforeEach(function (done) {
            const app = express();
            httpServer = http.createServer(app)
            loadExpress(app);
            loadSocket(httpServer)
            httpServer.listen(() => {
                PORT = (httpServer.address() as AddressInfo).port;
                done()
            });
        })

        test("Should return updated position of an asset", function (done) {
            axios.put(`http://localhost:${PORT}/position/1`, {
                pos: {
                    lat: -65.61432,
                    lon: 89.88
                }
            }).then((res) => {
                const data = res.data

                expect(res.status).toBe(200)
                expect(data.lat).toBe(-65.61432)
                expect(data.lon).toBe(89.88)
                done()
            })
        })

        afterEach(function () {
            httpServer.close();
        });
    })

    describe("rebroadcast of asset position every 5 seconds", function () {
        let tA1: number
        let tB1: number
        beforeEach(function (done) {
            const partialDone = createPartialDone(2, done);
            const app = express();
            httpServer = http.createServer(app)
            loadExpress(app);
            loadSocket(httpServer)
            httpServer.listen(() => {
                PORT = (httpServer.address() as AddressInfo).port;
                tA1 = Date.now()
                clientA = io(`http://localhost:${PORT}`, {
                    query: {
                        assets: "1",
                        lat: "-16.43831",
                        lon: "100.63566"
                    }
                });
                clientA.on("connect", partialDone)

                tB1 = Date.now()
                clientB = io(`http://localhost:${PORT}`, {
                    query: {
                        assets: "3",
                        lat: "43.34531",
                        lon: "30.52325"
                    }
                });
                clientB.on("connect", partialDone)
            });
        })

        afterEach(function () {
            httpServer.close();
            clientA.disconnect();
            clientB.disconnect();
        });

        test("Should receive a rebroadcast of the position of asset 1 at approximately 5 seconds interval", function (done) {
            const partialDone = createPartialDone(2, done)
            clientA.on("position-update", data => {
                const t1 = tA1
                const t2 = Date.now()
                tA1 = t2
                expect(data.lat).toBe(assets[0].lat)
                expect(data.lon).toBe(assets[0].lon)
                expect(t2 - t1).toBeGreaterThan(4700)
                partialDone()
            })
        })

        test("Should receive a rebroadcast of the position of asset 3 at approximately 5 seconds interval", (done) => {
            const partialDone = createPartialDone(2, done)
            clientB.on("position-update", data => {
                const t1 = tB1
                const t2 = Date.now()
                tB1 = t2
                expect(data.lat).toBe(assets[2].lat)
                expect(data.lon).toBe(assets[2].lon)
                expect(t2 - t1).toBeGreaterThan(4700)
                partialDone()
            })
        })
    })

    describe("Clients get updates for only assets they are interested in", () => {
        beforeEach(function (done) {
            const app = express();
            httpServer = http.createServer(app)
            loadExpress(app);
            loadSocket(httpServer)
            httpServer.listen(() => {
                PORT = (httpServer.address() as AddressInfo).port;
                clientA = io(`http://localhost:${PORT}`, {
                    query: {
                        assets: "1,2",
                        lat: "-16.43831",
                        lon: "100.63566"
                    }
                });
                clientA.on("connect", done)
            });
        })

        afterEach(function () {
            httpServer.close();
            clientA.disconnect();
            clientB.disconnect();
        });

        test("clientA recieves update only on asset 1 and asset 2", done => {
            const partialDone = createPartialDone(3, done)

            clientA.on("position-update", (data) => {
                const assetId = data.id
                const assetOneId = assets[0].id
                const assetTwoId = assets[1].id

                expect([assetOneId, assetTwoId]).toContain(assetId)

                partialDone()
            })
        })

        test("clientA will not receive update on asset 3", done => {
            const partialDone = createPartialDone(3, done)

            clientA.on("position-update", (data) => {
                const assetId = data.id
                const assetThreeId = assets[2].id

                expect(assetId).not.toEqual(assetThreeId)

                partialDone()
            })
        })
    })

    describe("Asset proximity", () => {
        const clientACoord = {
            lat: "-16.43831",
            lon: "100.63566"
        }
        const clientBCoord = {
            lat: "-16.43831",
            lon: "100.63566"
        }
        const clientCCoord = {
            lat: "5.02287",
            lon: "-37.12724"
        }

        const latLonHundredMetersFrom_A_B = createCoord(+clientACoord.lat, +clientACoord.lon, 100)
        const latLonFiftyMetersFrom_A_B = createCoord(+clientACoord.lat, +clientACoord.lon, 50)
        const latLonFifteenMetersFrom_A_B = createCoord(+clientACoord.lat, +clientACoord.lon, 15)
        const latLonZeroMetersFrom_A_B = createCoord(+clientACoord.lat, +clientACoord.lon, 0)

        beforeEach(function (done) {
            const partialDone = createPartialDone(3, done);
            const app = express();
            httpServer = http.createServer(app)
            loadExpress(app);
            loadSocket(httpServer)
            httpServer.listen(() => {
                PORT = (httpServer.address() as AddressInfo).port;
                clientA = io(`http://localhost:${PORT}`, {
                    query: {
                        assets: "1",
                        ...clientACoord
                    }
                });
                clientA.on("connect", partialDone)

                clientB = io(`http://localhost:${PORT}`, {
                    query: {
                        assets: "1, 3",
                        ...clientBCoord
                    }
                });
                clientB.on("connect", partialDone)

                clientC = io(`http://localhost:${PORT}`, {
                    query: {
                        assets: "2,3",
                        ...clientCCoord
                    }
                });
                clientC.on("connect", partialDone)
            });
        })

        afterEach(function () {
            httpServer.close();
            clientA.disconnect();
            clientB.disconnect();
        });

        test("ClientA and clientB should get proximity message from asset 1 for a distance of 100meters away from asset", (done) => {
            const partialDone = createPartialDone(2, done)
            axios.put(`http://localhost:${PORT}/position/1`, {
                pos: {
                    lat: latLonHundredMetersFrom_A_B[0],
                    lon: latLonHundredMetersFrom_A_B[1]
                }
            })

            clientA.on("proximity", (data) => {
                expect(data.id).toBe(assets[0].id)
                partialDone()
            })

            clientB.on("proximity", (data) => {
                expect(data.id).toBe(assets[0].id)
                partialDone()
            })
        })

        test("ClientA and clientB should get proximity message from asset 1 for a distance of 50meters away from asset", (done) => {
            const partialDone = createPartialDone(2, done)
            axios.put(`http://localhost:${PORT}/position/1`, {
                pos: {
                    lat: latLonFiftyMetersFrom_A_B[0],
                    lon: latLonFiftyMetersFrom_A_B[1]
                }
            })

            clientA.on("proximity", (data) => {
                expect(data.id).toBe(assets[0].id)
                partialDone()
            })

            clientB.on("proximity", (data) => {
                expect(data.id).toBe(assets[0].id)
                partialDone()
            })
        })

        test("ClientA and clientB should get proximity message from asset 1 for a distance same as asset", (done) => {
            const partialDone = createPartialDone(2, done)
            axios.put(`http://localhost:${PORT}/position/1`, {
                pos: {
                    lat: latLonZeroMetersFrom_A_B[0],
                    lon: latLonZeroMetersFrom_A_B[1]
                }
            })

            const socketCallback: (type: string, fn: any) => any = jest.fn()

            clientC.on("proximity", socketCallback)

            clientA.on("proximity", (data) => {
                expect(data.id).toBe(assets[0].id)
                expect(socketCallback).not.toHaveBeenCalled()
                partialDone()
            })

            clientB.on("proximity", (data) => {
                expect(data.id).toBe(assets[0].id)
                expect(socketCallback).not.toHaveBeenCalled()
                expect(socketCallback).not.toHaveBeenCalled()
                partialDone()
            })
        })

        test("ClientA should not get a proximity message from asset 1 for a distance of 15 meters away from asset", (done) => {

            const onProximityMock = jest.fn()
            clientA.on("proximity", onProximityMock)

            axios.put(`http://localhost:${PORT}/position/1`, {
                pos: {
                    lat: latLonFifteenMetersFrom_A_B[0],
                    lon: latLonFifteenMetersFrom_A_B[1]
                }
            }).then((res) => {
                const data = res.data

                expect(res.status).toBe(200)
                expect(data.lat).toBe(latLonFifteenMetersFrom_A_B[0])
                expect(data.lon).toBe(latLonFifteenMetersFrom_A_B[1])

                expect(onProximityMock).not.toHaveBeenCalled()
                done()
            })
        })
    })
})