import algoliasearch from 'algoliasearch';
import * as functionsTestInit from 'firebase-functions-test';
import mockedEnv from 'mocked-env';
import { mocked } from 'ts-jest/utils';
import { mockConsoleInfo } from './__mocks__/console';
import testDocument, { testReleaseDate } from './data/document';

jest.mock('algoliasearch');

const defaultEnvironment = {
  PROJECT_ID: 'fake-project',
  LOCATION: 'us-central1',
  ALGOLIA_APP_ID: 'algolia-app-id',
  ALGOLIA_API_KEY: '********',
  ALGOLIA_INDEX_NAME: 'algolia-index-name',
  COLLECTION_PATH: 'movies',
  FIELDS: ''
};

export const mockExport = (document, data) => {
  const ref = require('../src/index').executeIndexOperation;
  let functionsTest = functionsTestInit();

  const wrapped = functionsTest.wrap(ref);
  return wrapped(document, data);
};

let restoreEnv;
let functionsTest = functionsTestInit();

describe('extension', () => {
  const mockedAlgoliasearch = mocked(algoliasearch, true);
  const mockedAddAlgoliaAgent = jest.fn();

  const mockedPartialUpdateObject = jest.fn();
  const mockedSaveObject = jest.fn();
  const mockedDeleteObject = jest.fn();
  const mockedInitIndex = jest.fn((): {
    deleteObject: jest.Mock<any, any>;
    saveObject: jest.Mock<any, any>;
    partialUpdateObject: jest.Mock<any, any>
  } => ({
    saveObject: mockedSaveObject,
    deleteObject: mockedDeleteObject,
    partialUpdateObject: mockedPartialUpdateObject
  }));

  // @ts-ignore
  mockedAlgoliasearch.mockReturnValue({
    addAlgoliaAgent: mockedAddAlgoliaAgent,
    // @ts-ignore
    initIndex: mockedInitIndex
  });

  let config;
  beforeEach(() => {
    restoreEnv = mockedEnv(defaultEnvironment);
    config = require('../src/config').default;
  });

  describe('functions.executeIndexOperation', () => {
    let functionsConfig;

    beforeEach(async () => {
      jest.clearAllMocks();
      functionsTest = functionsTestInit();
      functionsConfig = config;
    });

    test('functions runs with an update on non indexable field', async () => {
      restoreEnv = mockedEnv(defaultEnvironment);
      config = require('../src/config').default;

      const beforeSnapshot = functionsTest.firestore.makeDocumentSnapshot(testDocument, 'document/1');
      const afterSnapshot = functionsTest.firestore.makeDocumentSnapshot({
        ...testDocument,
        title: 'The Prison'
      }, 'document/1');

      const documentChange = functionsTest.makeChange(
        beforeSnapshot,
        afterSnapshot
      );

      const data = {};
      const callResult = await mockExport(documentChange, data);

      expect(callResult).toBeUndefined();
      expect(mockConsoleInfo).toBeCalledTimes(3);
      expect(mockConsoleInfo).toBeCalledWith(
        'Started extension execution with configuration',
        functionsConfig
      );
      const payload = {
        ...testDocument,
        'objectID': afterSnapshot.id,
        'title': afterSnapshot.data().title,
        'awards': [
          'awards/1'
        ],
        'meta': {
          'releaseDate': testReleaseDate.getTime()
        },
        'lastmodified': {
          '_operation': 'IncrementSet',
          'value': expect.any(Number)
        }
      }
      expect(mockConsoleInfo).toBeCalledWith(
        `Updating existing Algolia index for document ${ afterSnapshot.id }`,
        payload
      );
      expect(mockedPartialUpdateObject).toBeCalledWith(payload, { createIfNotExists: true });
    });

    test('functions runs with an update with falsy values', async () => {
      const beforeSnapshot = functionsTest.firestore.makeDocumentSnapshot(testDocument, 'document/1');
      const afterSnapshot = functionsTest.firestore.makeDocumentSnapshot({
        ...testDocument,
        popular: false,
        rating: 0
      }, 'document/1');

      const documentChange = functionsTest.makeChange(
        beforeSnapshot,
        afterSnapshot
      );

      const data = {};
      const callResult = await mockExport(documentChange, data);

      expect(callResult).toBeUndefined();
      expect(mockConsoleInfo).toBeCalledTimes(2);
      expect(mockConsoleInfo).toBeCalledWith(
        'Started extension execution with configuration',
        functionsConfig
      );
      const payload = {
        ...testDocument,
        'objectID': afterSnapshot.id,
        'title': afterSnapshot.data().title,
        'awards': [
          'awards/1'
        ],
        'meta': {
          'releaseDate': testReleaseDate.getTime()
        },
        'popular': false,
        'rating': 0,
        'lastmodified': {
          '_operation': 'IncrementSet',
          'value': expect.any(Number)
        }
      }
      expect(mockConsoleInfo).toBeCalledWith(
        `Updating existing Algolia index for document ${ afterSnapshot.id }`,
        payload
      );
      expect(mockedPartialUpdateObject).toBeCalledWith(payload, { createIfNotExists: true });
    });

    test('functions runs with an update with removed value', async () => {
      const beforeSnapshot = functionsTest.firestore.makeDocumentSnapshot(testDocument, 'document/1');

      const modifiedDocument = {
        ...testDocument
      };
      // Remove attribute to simulate firebase attribute removal
      delete modifiedDocument.popular;

      const afterSnapshot = functionsTest.firestore.makeDocumentSnapshot({
        ...modifiedDocument,
        rating: 0
      }, 'document/1');

      afterSnapshot.ref.get = function() {
        return new Promise((resolve) => {
          resolve(afterSnapshot);
        });
      }

      const documentChange = functionsTest.makeChange(
        beforeSnapshot,
        afterSnapshot
      );

      const data = {};
      const callResult = await mockExport(documentChange, data);

      expect(callResult).toBeUndefined();
      expect(mockConsoleInfo).toBeCalledTimes(2);
      expect(mockConsoleInfo).toBeCalledWith(
        'Started extension execution with configuration',
        functionsConfig
      );
      const payload = {
        ...modifiedDocument,
        'objectID': afterSnapshot.id,
        'title': afterSnapshot.data().title,
        'awards': [
          'awards/1'
        ],
        'meta': {
          'releaseDate': testReleaseDate.getTime()
        },
        'rating': 0,
        'lastmodified': {
          '_operation': 'IncrementSet',
          'value': expect.any(Number)
        }
      }
      expect(mockConsoleInfo).toBeCalledWith(
        `Updating existing Algolia index for document ${ afterSnapshot.id }`,
        payload
      );
      expect(mockedSaveObject).toBeCalledWith(payload);
    });
  });

});
