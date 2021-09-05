const assert = require('assert');
const localRedisConnectionString = "redis://127.0.0.1:6379/";
let redisClient;
const timeseriesType = require('../timeseries.js');
let target = null;

describe('Timeseries consumer tests', function () {

    this.beforeEach(async function () {
        redisClient = require("./get-me-redis-client")(localRedisConnectionString);
        await redisClient.flushall();
        //target = new targetType(redisClient);
    });

    this.afterEach(async function () {
        await redisClient.quit();
        redisClient = null;
    });

    it('Should write data and read it back', async function () {

        //SETUP
        const hash = (tagName) => Array.from(tagName).reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const tagToPartitionMapping = (tagName) => hash(tagName) % 10;
        const partitionToRedisMapping = (partitionName) => redisClient;
        const tagnameToTagId = hash;
        const settings = {
            "ActivityKey": "Activity",
            "SamplesPerPartitionKey": "Stats",
            "Seperator": "=",
            "MaximumTagsInOneWrite": 2000,
            "MaximumTagsInOneRead": 100,
            "MaximumTagNameLength": 200,
            "MaximumPartitionsScansInOneRead": 100,
            "PartitionTimeWidth": 5
        }
        target = new timeseriesType(tagToPartitionMapping, partitionToRedisMapping, tagnameToTagId, settings);
        const inputData = new Map();
        inputData.set("GapTag", new Map([[1n, "One"], [2n, "Two"], [10n, "Ten"], [20n, "Twenty"]]));
        inputData.set("SerialTag", new Map([[1n, "One"], [2n, "Two"], [3n, "Three"], [4n, "Four"]]));
        const ranges = new Map();
        ranges.set("GapTag", { "start": 0, "end": 100 });
        ranges.set("SerialTag", { "start": 0, "end": 100 });

        //Write
        const writeResult = await target.write(inputData);

        //Read
        const readResults = await target.read(ranges)

        //VERIFY
        assert.strictEqual(writeResult, true);
        assert.deepStrictEqual(readResults, inputData);
    });
});