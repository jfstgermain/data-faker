import loggerHelper from 'lib-logger-helper';
import * as jsf from 'json-schema-faker';
import * as refParser from 'json-schema-ref-parser';
import * as _ from 'lodash';
import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';

const logger = loggerHelper.logger().child({module});

// See:
// http://chancejs.com/
// https://github.com/Marak/faker.js

/**
 * Loads a json-schema and resolves external references.  Convenient if some definitions need
 * to be modified programatically at runtime.
 * @param  {string} rootDataRelativePath the relative path to the `src/` or `dist/` directory
 * @param  {string} schemaFileName       the json-schema definition filename
 * @return {Promise}                     a promise returning the json-schema object value when resolved
 */
export function loadJsonSchema(rootDataRelativePath: string, schemaFileName: string): Promise<any> {
    const fullDataPath = path.resolve(path.dirname(__filename), '../../', rootDataRelativePath) + '/';
    logger.error({fullDataPath});
    const currWorkingDir = process.cwd();

    // TODO: the change in the current working dir is a temp dirty fix until
    // I figure out how to pass a base dir
    process.chdir(fullDataPath);
    return refParser.dereference(schemaFileName, {})
        .then(function(schema) {
            process.chdir(currWorkingDir);

            return schema;
        });
}

/**
 * Creates fake data objects based on the json schema path passed as param
 * @param  {string}   rootDataRelativePath the relative path to the `src/` or `dist/` directory
 * @param  {string}   schemaFileName       the json-schema definition filename
 * @param  {number}   times=1              the number of data samples to be generated
 * @return {Promise}                       a promise returning an Array value when resolved
 */
export function fakeDataFromSchemaPath(rootDataRelativePath: string,
                                       schemaFileName: string,
                                       times: number = 1): Promise<any> {
    return loadJsonSchema(rootDataRelativePath, schemaFileName)
        .then(function(schema) {
            // console.log(JSON.stringify(schema, null, 2));
            return fakeDataFromSchemaObj(schema, times);
        });
}

/**
 * Creates fake data objects according to rules passed in as a json schema object instance
 * @param  {Object} schema  the json-schema instance object
 * @param  {number} times=1 the number of data generation loops
 * @return {Array}          an array of generated fake data
 */
export function fakeDataFromSchemaObj(schema: Object, times: number = 1): any[] {
    return _.times(times, () => jsf(schema));
}

export function fakeDataFromSchemaPathToFile(destFilePath: string,
                                             rootDataRelativePath: string,
                                             schemaFileName: string,
                                             times: number = 1): Promise<any> {
    return fakeDataFromSchemaPath(rootDataRelativePath, schemaFileName, times).then((data) => {
        return fs.writeFile(destFilePath, util.inspect(data, {depth: null}) , 'utf-8');
    });
}
// save test data to a file...
// fakeDataFromSchemaPathToFile('/tmp/test-data.json', 'test/unit/data', 'purchase-requisition-model.yaml', 1);
