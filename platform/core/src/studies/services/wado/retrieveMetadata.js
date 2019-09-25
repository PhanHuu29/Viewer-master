import { api } from 'dicomweb-client';
import log from '../../../log';
import DICOMWeb from '../../../DICOMWeb/';
import { makePubSub } from '../../../lib/pubSub';
import { makeSeriesLoadQueue } from './seriesLoadQueue';

const INFO = Symbol('INFO');

const WADOProxy = {
  convertURL: (url, server) => {
    // TODO: Remove all WADOProxy stuff from this file
    return url;
  },
};

function parseFloatArray(obj) {
  const result = [];

  if (!obj) {
    return result;
  }

  const objs = obj.split('\\');
  for (let i = 0; i < objs.length; i++) {
    result.push(parseFloat(objs[i]));
  }

  return result;
}

/**
 * Simple cache schema for retrieved color palettes.
 */
const paletteColorCache = {
  count: 0,
  maxAge: 24 * 60 * 60 * 1000, // 24h cache?
  entries: {},
  isValidUID: function(paletteUID) {
    return typeof paletteUID === 'string' && paletteUID.length > 0;
  },
  get: function(paletteUID) {
    let entry = null;
    if (this.entries.hasOwnProperty(paletteUID)) {
      entry = this.entries[paletteUID];
      // check how the entry is...
      if (Date.now() - entry.time > this.maxAge) {
        // entry is too old... remove entry.
        delete this.entries[paletteUID];
        this.count--;
        entry = null;
      }
    }
    return entry;
  },
  add: function(entry) {
    if (this.isValidUID(entry.uid)) {
      let paletteUID = entry.uid;
      if (this.entries.hasOwnProperty(paletteUID) !== true) {
        this.count++; // increment cache entry count...
      }
      entry.time = Date.now();
      this.entries[paletteUID] = entry;
      // @TODO: Add logic to get rid of old entries and reduce memory usage...
    }
  },
};

/** Returns a WADO url for an instance
 *
 * @param studyInstanceUid
 * @param seriesInstanceUid
 * @param sopInstanceUid
 * @returns  {string}
 */
function buildInstanceWadoUrl(
  server,
  studyInstanceUid,
  seriesInstanceUid,
  sopInstanceUid
) {
  // TODO: This can be removed, since DICOMWebClient has the same function. Not urgent, though
  const params = [];

  params.push('requestType=WADO');
  params.push(`studyUID=${studyInstanceUid}`);
  params.push(`seriesUID=${seriesInstanceUid}`);
  params.push(`objectUID=${sopInstanceUid}`);
  params.push('contentType=application/dicom');
  params.push('transferSyntax=*');

  const paramString = params.join('&');

  return `${server.wadoUriRoot}?${paramString}`;
}

function buildInstanceWadoRsUri(
  server,
  studyInstanceUid,
  seriesInstanceUid,
  sopInstanceUid
) {
  return `${server.wadoRoot}/studies/${studyInstanceUid}/series/${seriesInstanceUid}/instances/${sopInstanceUid}`;
}

function buildInstanceFrameWadoRsUri(
  server,
  studyInstanceUid,
  seriesInstanceUid,
  sopInstanceUid,
  frame
) {
  const baseWadoRsUri = buildInstanceWadoRsUri(
    server,
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid
  );
  frame = frame != null || 1;

  return `${baseWadoRsUri}/frames/${frame}`;
}

/**
 * Parses the SourceImageSequence, if it exists, in order
 * to return a ReferenceSOPInstanceUID. The ReferenceSOPInstanceUID
 * is used to refer to this image in any accompanying DICOM-SR documents.
 *
 * @param instance
 * @returns {String} The ReferenceSOPInstanceUID
 */
function getSourceImageInstanceUid(instance) {
  // TODO= Parse the whole Source Image Sequence
  // This is a really poor workaround for now.
  // Later we should probably parse the whole sequence.
  var SourceImageSequence = instance['00082112'];
  if (
    SourceImageSequence &&
    SourceImageSequence.Value &&
    SourceImageSequence.Value.length
  ) {
    return SourceImageSequence.Value[0]['00081155'].Value[0];
  }
}

function getPaletteColor(server, instance, tag, lutDescriptor) {
  const numLutEntries = lutDescriptor[0];
  const bits = lutDescriptor[2];

  let uri = WADOProxy.convertURL(instance[tag].BulkDataURI, server);

  // TODO: Workaround for dcm4chee behind SSL-terminating proxy returning
  // incorrect bulk data URIs
  if (server.wadoRoot.indexOf('https') === 0 && !uri.includes('https')) {
    uri = uri.replace('http', 'https');
  }

  const config = {
    url: server.wadoRoot, //BulkDataURI is absolute, so this isn't used
    headers: DICOMWeb.getAuthorizationHeader(server),
  };
  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    BulkDataURI: uri,
  };

  const readUInt16 = (byteArray, position) => {
    return byteArray[position] + byteArray[position + 1] * 256;
  };

  const arrayBufferToPaletteColorLUT = result => {
    const arraybuffer = result[0];
    const byteArray = new Uint8Array(arraybuffer);
    const lut = [];

    for (let i = 0; i < numLutEntries; i++) {
      if (bits === 16) {
        lut[i] = readUInt16(byteArray, i * 2);
      } else {
        lut[i] = byteArray[i];
      }
    }

    return lut;
  };

  return dicomWeb.retrieveBulkData(options).then(arrayBufferToPaletteColorLUT);
}

/**
 * Fetch palette colors for instances with "PALETTE COLOR" photometricInterpretation.
 *
 * @param server {Object} Current server;
 * @param instance {Object} The retrieved instance metadata;
 * @returns {String} The ReferenceSOPInstanceUID
 */
async function getPaletteColors(server, instance, lutDescriptor) {
  let paletteUID = DICOMWeb.getString(instance['00281199']);

  return new Promise((resolve, reject) => {
    let entry;
    if (paletteColorCache.isValidUID(paletteUID)) {
      entry = paletteColorCache.get(paletteUID);

      if (entry) {
        return resolve(entry);
      }
    }

    // no entry in cache... Fetch remote data.
    const r = getPaletteColor(server, instance, '00281201', lutDescriptor);
    const g = getPaletteColor(server, instance, '00281202', lutDescriptor);
    const b = getPaletteColor(server, instance, '00281203', lutDescriptor);

    const promises = [r, g, b];

    Promise.all(promises).then(args => {
      entry = {
        red: args[0],
        green: args[1],
        blue: args[2],
      };

      // when paletteUID is present, the entry can be cached...
      entry.uid = paletteUID;
      paletteColorCache.add(entry);

      resolve(entry);
    });
  });
}

function getFrameIncrementPointer(element) {
  const frameIncrementPointerNames = {
    '00181065': 'frameTimeVector',
    '00181063': 'frameTime',
  };

  if (!element || !element.Value || !element.Value.length) {
    return;
  }

  const value = element.Value[0];
  return frameIncrementPointerNames[value];
}

function getRadiopharmaceuticalInfo(instance) {
  const modality = DICOMWeb.getString(instance['00080060']);

  if (modality !== 'PT') {
    return;
  }

  const radiopharmaceuticalInfo = instance['00540016'];
  if (
    radiopharmaceuticalInfo === undefined ||
    !radiopharmaceuticalInfo.Value ||
    !radiopharmaceuticalInfo.Value.length
  ) {
    return;
  }

  const firstPetRadiopharmaceuticalInfo = radiopharmaceuticalInfo.Value[0];
  return {
    radiopharmaceuticalStartTime: DICOMWeb.getString(
      firstPetRadiopharmaceuticalInfo['00181072']
    ),
    radionuclideTotalDose: DICOMWeb.getNumber(
      firstPetRadiopharmaceuticalInfo['00181074']
    ),
    radionuclideHalfLife: DICOMWeb.getNumber(
      firstPetRadiopharmaceuticalInfo['00181075']
    ),
  };
}

async function makeSOPInstance(server, study, instance) {
  const { studyInstanceUid } = study;
  const seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
  let series = study.seriesMap[seriesInstanceUid];

  if (!series) {
    series = {
      seriesInstanceUid,
      seriesDescription: DICOMWeb.getString(instance['0008103E']),
      modality: DICOMWeb.getString(instance['00080060']),
      seriesNumber: DICOMWeb.getNumber(instance['00200011']),
      seriesDate: DICOMWeb.getString(instance['00080021']),
      seriesTime: DICOMWeb.getString(instance['00080031']),
      instances: [],
    };
    study.seriesMap[seriesInstanceUid] = series;
    study.seriesList.push(series);
  }

  const sopInstanceUid = DICOMWeb.getString(instance['00080018']);
  const wadouri = buildInstanceWadoUrl(
    server,
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid
  );
  const baseWadoRsUri = buildInstanceWadoRsUri(
    server,
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid
  );
  const wadorsuri = buildInstanceFrameWadoRsUri(
    server,
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid
  );

  const sopInstance = {
    imageType: DICOMWeb.getString(instance['00080008']),
    sopClassUid: DICOMWeb.getString(instance['00080016']),
    modality: DICOMWeb.getString(instance['00080060']),
    sopInstanceUid,
    instanceNumber: DICOMWeb.getNumber(instance['00200013']),
    imagePositionPatient: DICOMWeb.getString(instance['00200032']),
    imageOrientationPatient: DICOMWeb.getString(instance['00200037']),
    frameOfReferenceUID: DICOMWeb.getString(instance['00200052']),
    sliceLocation: DICOMWeb.getNumber(instance['00201041']),
    samplesPerPixel: DICOMWeb.getNumber(instance['00280002']),
    photometricInterpretation: DICOMWeb.getString(instance['00280004']),
    planarConfiguration: DICOMWeb.getNumber(instance['00280006']),
    rows: DICOMWeb.getNumber(instance['00280010']),
    columns: DICOMWeb.getNumber(instance['00280011']),
    pixelSpacing: DICOMWeb.getString(instance['00280030']),
    pixelAspectRatio: DICOMWeb.getString(instance['00280034']),
    bitsAllocated: DICOMWeb.getNumber(instance['00280100']),
    bitsStored: DICOMWeb.getNumber(instance['00280101']),
    highBit: DICOMWeb.getNumber(instance['00280102']),
    pixelRepresentation: DICOMWeb.getNumber(instance['00280103']),
    smallestPixelValue: DICOMWeb.getNumber(instance['00280106']),
    largestPixelValue: DICOMWeb.getNumber(instance['00280107']),
    windowCenter: DICOMWeb.getString(instance['00281050']),
    windowWidth: DICOMWeb.getString(instance['00281051']),
    rescaleIntercept: DICOMWeb.getNumber(instance['00281052']),
    rescaleSlope: DICOMWeb.getNumber(instance['00281053']),
    rescaleType: DICOMWeb.getNumber(instance['00281054']),
    sourceImageInstanceUid: getSourceImageInstanceUid(instance),
    laterality: DICOMWeb.getString(instance['00200062']),
    viewPosition: DICOMWeb.getString(instance['00185101']),
    acquisitionDateTime: DICOMWeb.getString(instance['0008002A']),
    numberOfFrames: DICOMWeb.getNumber(instance['00280008']),
    frameIncrementPointer: getFrameIncrementPointer(instance['00280009']),
    frameTime: DICOMWeb.getNumber(instance['00181063']),
    frameTimeVector: parseFloatArray(DICOMWeb.getString(instance['00181065'])),
    sliceThickness: DICOMWeb.getNumber(instance['00180050']),
    spacingBetweenSlices: DICOMWeb.getString(instance['00180088']),
    lossyImageCompression: DICOMWeb.getString(instance['00282110']),
    derivationDescription: DICOMWeb.getString(instance['00282111']),
    lossyImageCompressionRatio: DICOMWeb.getString(instance['00282112']),
    lossyImageCompressionMethod: DICOMWeb.getString(instance['00282114']),
    echoNumber: DICOMWeb.getString(instance['00180086']),
    contrastBolusAgent: DICOMWeb.getString(instance['00180010']),
    radiopharmaceuticalInfo: getRadiopharmaceuticalInfo(instance),
    baseWadoRsUri: baseWadoRsUri,
    wadouri: WADOProxy.convertURL(wadouri, server),
    wadorsuri: WADOProxy.convertURL(wadorsuri, server),
    imageRendering: server.imageRendering,
    thumbnailRendering: server.thumbnailRendering,
  };

  // Get additional information if the instance uses "PALETTE COLOR" photometric interpretation
  if (sopInstance.photometricInterpretation === 'PALETTE COLOR') {
    const redPaletteColorLookupTableDescriptor = parseFloatArray(
      DICOMWeb.getString(instance['00281101'])
    );
    const greenPaletteColorLookupTableDescriptor = parseFloatArray(
      DICOMWeb.getString(instance['00281102'])
    );
    const bluePaletteColorLookupTableDescriptor = parseFloatArray(
      DICOMWeb.getString(instance['00281103'])
    );
    const palettes = await getPaletteColors(
      server,
      instance,
      redPaletteColorLookupTableDescriptor
    );

    if (palettes) {
      if (palettes.uid) {
        sopInstance.paletteColorLookupTableUID = palettes.uid;
      }

      sopInstance.redPaletteColorLookupTableData = palettes.red;
      sopInstance.greenPaletteColorLookupTableData = palettes.green;
      sopInstance.bluePaletteColorLookupTableData = palettes.blue;
      sopInstance.redPaletteColorLookupTableDescriptor = redPaletteColorLookupTableDescriptor;
      sopInstance.greenPaletteColorLookupTableDescriptor = greenPaletteColorLookupTableDescriptor;
      sopInstance.bluePaletteColorLookupTableDescriptor = bluePaletteColorLookupTableDescriptor;
    }
  }

  series.instances.push(sopInstance);
  return sopInstance;
}

function createStudy(server, anInstance) {
  // TODO: Pass a reference ID to the server instead of including the URLs here
  return makePubSub({
    seriesList: [],
    seriesMap: Object.create(null),
    seriesLoadQueue: null,
    wadoUriRoot: server.wadoUriRoot,
    wadoRoot: server.wadoRoot,
    qidoRoot: server.qidoRoot,
    patientName: DICOMWeb.getName(anInstance['00100010']),
    patientId: DICOMWeb.getString(anInstance['00100020']),
    patientAge: DICOMWeb.getNumber(anInstance['00101010']),
    patientSize: DICOMWeb.getNumber(anInstance['00101020']),
    patientWeight: DICOMWeb.getNumber(anInstance['00101030']),
    accessionNumber: DICOMWeb.getString(anInstance['00080050']),
    studyDate: DICOMWeb.getString(anInstance['00080020']),
    modalities: DICOMWeb.getString(anInstance['00080061']),
    studyDescription: DICOMWeb.getString(anInstance['00081030']),
    imageCount: DICOMWeb.getString(anInstance['00201208']),
    studyInstanceUid: DICOMWeb.getString(anInstance['0020000D']),
    institutionName: DICOMWeb.getString(anInstance['00080080']),
  });
}

function addInstancesToStudy(server, study, instanceList) {
  return Promise.all(
    instanceList.map(function(instance) {
      return makeSOPInstance(server, study, instance);
    })
  );
}

/**
 * Parses result data from a WADO search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param server
 * @param instanceList
 * @resolves {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
async function createStudyFromInstanceList(server, instanceList) {
  if (Array.isArray(instanceList) && instanceList.length > 0) {
    const anInstance = instanceList[0];
    if (anInstance) {
      const study = createStudy(server, anInstance);
      await addInstancesToStudy(server, study, instanceList);
      return study;
    }
  }
  return null;
}

/**
 * Retrieve Study MetaData from a DICOM server using a WADO call
 *
 * @param server
 * @param studyInstanceUid
 * @returns {Promise}
 */
async function RetrieveMetadata(server, studyInstanceUid) {
  return (server.enableStudyLazyLoad
    ? lazyLoadStudyMetadata
    : loadStudyMetadata)(server, studyInstanceUid);
}

async function loadStudyMetadata(server, studyInstanceUID) {
  const dicomWeb = new api.DICOMwebClient({
    url: server.wadoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server),
  });
  return dicomWeb
    .retrieveStudyMetadata({ studyInstanceUID })
    .then(result => createStudyFromInstanceList(server, result));
}

async function lazyLoadStudyMetadata(server, studyInstanceUid) {
  const seriesIds = await searchStudySeries(server, studyInstanceUid);
  if (seriesIds) {
    const dicomWeb = new api.DICOMwebClient({
      url: server.wadoRoot,
      headers: DICOMWeb.getAuthorizationHeader(server),
    });
    const seriesLoadQueue = makeSeriesLoadQueue(
      dicomWeb,
      studyInstanceUid,
      seriesIds
    );
    const firstSeries = await seriesLoadQueue.dequeue();
    if (firstSeries && firstSeries.instances) {
      const study = await createStudyFromInstanceList(
        server,
        firstSeries.instances
      );
      if (study) {
        setQueueListeners(server, study, seriesLoadQueue);
        return study;
      }
    }
  }
  return null;
}

function setQueueListeners(server, study, seriesLoadQueue) {
  study.seriesLoadQueue = seriesLoadQueue;
  // Series Loaded Event
  seriesLoadQueue.subscribe(seriesLoadQueue.EVENT_SERIES_LOADED, function(
    series
  ) {
    if (series && series.instances) {
      addInstancesToStudy(server, study, series.instances).then(
        function() {
          study.publish(
            'seriesAdded',
            study.seriesMap[series.seriesInstanceUID]
          );
        },
        function(error) {
          log.error(
            '[retrieveMetadata] failed to add instance to study on async series load',
            error
          );
        }
      );
    }
  });
}

async function searchStudySeries(server, studyInstanceUID) {
  const dicomWeb = new api.DICOMwebClient({
    url: server.qidoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server),
  });
  const seriesList = await dicomWeb.searchForSeries({ studyInstanceUID });
  return Array.isArray(seriesList) && seriesList.length > 0
    ? seriesList
        .sort(seriesSortingCriteria)
        .map(series => getSeriesInfo(series).seriesInstanceUid)
    : null;
}

function seriesSortingCriteria(a, b) {
  return getSeriesInfo(a).seriesNumber - getSeriesInfo(b).seriesNumber;
}

function getSeriesInfo(series) {
  let info = series[INFO];
  if (!info) {
    info = Object.freeze({
      modality: DICOMWeb.getString(series['00080060']),
      seriesInstanceUid: DICOMWeb.getString(series['0020000E']),
      seriesNumber: DICOMWeb.getNumber(series['00200011']),
    });
    series[INFO] = info;
  }
  return info;
}

export default RetrieveMetadata;
