// TODO: Pull in IWebClientApi from @ohif/core
// TODO: Use constructor to create an instance of IWebClientApi
// TODO: Use existing DICOMWeb configuration (previously, appConfig, to configure instance)

import { createDicomWebApi } from './DicomWebDataSource/index.js';
import { createDicomJSONApi } from './DicomJSONDataSource/index.js';
import { createDicomLocalApi } from './DicomLocalDataSource/index.js';
import { createDicomWebProxyApi } from './DicomWebProxyDataSource/index';
import { createMergeDataSourceApi } from './MergeDataSource/index';
import { createDicomUrlApi } from './DicomUrlDataSource/index.js';

/**
 *
 */
function getDataSourcesModule() {
  return [
    {
      name: 'dicomweb',
      type: 'webApi',
      createDataSource: createDicomWebApi,
    },
    {
      name: 'dicomwebproxy',
      type: 'webApi',
      createDataSource: createDicomWebProxyApi,
    },
    {
      name: 'dicomjson',
      type: 'jsonApi',
      createDataSource: createDicomJSONApi,
    },
    {
      name: 'dicomlocal',
      type: 'localApi',
      createDataSource: createDicomLocalApi,
    },
    {
      name: 'merge',
      type: 'mergeApi',
      createDataSource: createMergeDataSourceApi,
    },
    {
      name: 'dicomurl',
      type: 'dicomjson',
      createDataSource: createDicomUrlApi,
    },
  ];
}

export default getDataSourcesModule;
