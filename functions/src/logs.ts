/*
 * Copyright 2021 Algolia
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from 'firebase-functions';
import config from './config';

export const obfuscatedConfig = {
  ...config,
  algoliaAPIKey: '********',
};

export const init = () => {
  logger.info('Initializing extension with configuration', obfuscatedConfig);
};

export const start = () => {
  logger.info('Started extension execution with configuration', obfuscatedConfig);
};

export const warn = (...args: any) => {
  logger.warn(args);
};

export const error = (err: Error) => {
  logger.error('Error when performing Algolia index', err);
};

export const info = (...args: any) => {
  if (obfuscatedConfig.verboseLogs) logger.info(args);
};

export const debug = (...args: any) => {
  if (obfuscatedConfig.verboseLogs) logger.debug(args);
};

export const createIndex = (id: string, data: object) => {
  logger.info(`Creating new Algolia index for document ${ id }`, data);
};

export const updateIndex = (id: string, data: object) => {
  logger.info(`Updating existing Algolia index for document ${ id }`, data);
};

export const deleteIndex = (id: string) => {
  logger.info(`Deleting existing Algolia index for document ${ id }`);
};

export const fieldNotExist = (field: string) => {
  logger.warn(`The field "${ field }" was specified in the extension config but was not found on collection data.`);
};

export const fullIndexingComplete = (successCount: number, errorCount: number) => {
  logger.info(`Finished full indexing data. ${ successCount } translations succeeded, ${ errorCount } errors.`);
};

export const enqueueNext = (offset: number) => {
  logger.info(`About to enqueue next task, starting at offset ${ offset }`,);
};
