import getClosestInstanceInfo, {
  getPointProjection,
} from './getClosestInstanceInfo';
import { utilities as csUtils } from '@cornerstonejs/core';

function toArray(x) {
  return Array.isArray(x) ? x : [x];
}

const codeMeaningEquals = codeMeaningName => {
  return contentItem => {
    return contentItem.ConceptNameCodeSequence.CodeMeaning === codeMeaningName;
  };
};

function uid() {
  let uid = '2.25.' + Math.floor(1 + Math.random() * 9);
  for (let index = 0; index < 38; index++) {
    uid = uid + Math.floor(Math.random() * 10);
  }
  return uid;
}

const TRACKING_IDENTIFIER = 'Tracking Identifier';
const REPORT = 'Imaging Measurements';
const GROUP = 'Measurement Group';
const TRACKING_IDENTIFIER_CODE = '112040';

export function convertSCOORD3DAnnotationsInMeasurementGroups(
  measurementGroup,
  displaySets
) {
  const cornerstoneTag = 'Cornerstone3DTools@^0.1.0';
  const toolName = 'ArrowAnnotate';
  const newlyGeneratedMeasurementGroups = [];
  const measurementGroupContentSequence = toArray(
    measurementGroup.ContentSequence
  );
  const SCOORDContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'SCOORD'
  );
  const SCOORD3DContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'SCOORD3D'
  );
  const NUMContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'NUM'
  );
  if (!NUMContentItems.length) {
    if (SCOORDContentItems.length) {
      measurementGroupContentSequence[
        Object.keys(measurementGroupContentSequence).length
      ] = {
        ConceptNameCodeSequence: {
          ...SCOORDContentItems[0].ConceptNameCodeSequence,
        },
        ContentSequence: SCOORDContentItems,
        ValueType: 'NUM',
      };
      return {
        cornerstoneTag: 'Cornerstone3DTools@^0.1.0',
        toolName: 'PlanarFreehandROI',
      };
    } else if (SCOORD3DContentItems.length) {
      // search SCOORD3D item
      let scoord3DIndex = -1;
      for (let i = 0; i < measurementGroupContentSequence.length; i++) {
        if (measurementGroupContentSequence[i].ValueType === 'SCOORD3D') {
          scoord3DIndex = i;
          break;
        }
      }
      // search TrackingIdentifier Item item
      let trackIDIndex = -1;
      for (let i = 0; i < measurementGroupContentSequence.length; i++) {
        if (
          measurementGroupContentSequence[i].ConceptNameCodeSequence
            .CodeValue === TRACKING_IDENTIFIER_CODE
        ) {
          trackIDIndex = i;
          break;
        }
      }

      const measurementGroupMatrix = Object.assign({}, measurementGroup);
      const contentSequenceMatrix = [...measurementGroup.ContentSequence];
      const SCOORD3DContentItemsClone = [...SCOORD3DContentItems];
      const trackingIdentifierContentItemsClone = {
        ...measurementGroupContentSequence[trackIDIndex],
      };
      const frameOfReference =
        SCOORD3DContentItems[0].ReferencedFrameOfReferenceUID;
      const closestInstanceInfos = getClosestInstanceInfo(
        SCOORD3DContentItems[0].GraphicData,
        frameOfReference,
        displaySets
      );

      for (let i = 0; i < closestInstanceInfos.length; i++) {
        const closestInstanceInfo = closestInstanceInfos[i];
        const SOPClassUID = closestInstanceInfo.instance.SOPClassUID;
        const SOPInstanceUID = closestInstanceInfo.instance.SOPInstanceUID;
        const point = getPointProjection(
          SCOORD3DContentItems[0].GraphicData,
          closestInstanceInfo.instance
        );
        const imagePoint = csUtils.worldToImageCoords(
          closestInstanceInfo.instance.imageId,
          point
        );

        const newSCOORDContentItem = {
          RelationshipType: 'CONTAINS',
          ValueType: 'SCOORD',
          ConceptNameCodeSequence: {
            CodeValue: '111030',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Image Region',
          },
          ContentSequence: {
            ReferencedSOPSequence: {
              ReferencedSOPClassUID: SOPClassUID,
              ReferencedSOPInstanceUID: SOPInstanceUID,
            },
            RelationshipType: 'SELECTED FROM',
            ValueType: 'IMAGE',
            ConceptNameCodeSequence: {
              CodeValue: '111040',
              CodingSchemeDesignator: 'DCM',
              CodeMeaning: 'Original Source',
            },
          },
          PixelOriginInterpretation: 'VOLUME',
          GraphicData: imagePoint,
          GraphicType: 'POINT',
        };
        let contentSequence;
        if (i === 0) {
          measurementGroupContentSequence[
            Object.keys(measurementGroupContentSequence).length
          ] = {
            ConceptNameCodeSequence:
              SCOORD3DContentItems[0].ConceptNameCodeSequence,
            ContentSequence: newSCOORDContentItem,
            ValueType: 'NUM',
          };
          contentSequence = measurementGroupContentSequence;
          SCOORD3DContentItems[0].ValueType = 'SCOORD';
          SCOORD3DContentItems[0].ContentSequence = {
            ...SCOORD3DContentItems[0].ContentSequence,
            ReferencedSOPSequence: {
              ReferencedSOPClassUID: SOPClassUID,
              ReferencedSOPInstanceUID: SOPInstanceUID,
            },
          };
        } else {
          const measurementGroupClone = Object.assign(
            {},
            measurementGroupMatrix
          );
          measurementGroupClone.ContentSequence = [...contentSequenceMatrix];
          contentSequence = toArray(measurementGroupClone.ContentSequence);
          contentSequence[Object.keys(contentSequence).length] = {
            ConceptNameCodeSequence:
              SCOORD3DContentItems[0].ConceptNameCodeSequence,
            ContentSequence: newSCOORDContentItem,
            ValueType: 'NUM',
          };
          contentSequence[scoord3DIndex] = { ...SCOORD3DContentItemsClone[0] };
          contentSequence[scoord3DIndex].ContentSequence = {
            ...SCOORD3DContentItems[0].ContentSequence,
            ReferencedSOPSequence: {
              ReferencedSOPClassUID: SOPClassUID,
              ReferencedSOPInstanceUID: SOPInstanceUID,
            },
          };
          contentSequence[trackIDIndex] = {
            ...trackingIdentifierContentItemsClone,
            UID: uid(),
          };

          newlyGeneratedMeasurementGroups.push(measurementGroupClone);
        }
        // add TrackingIdentifier in the new measurement group
        const TrackingIdentifierGroup = contentSequence.find(
          contentItem =>
            contentItem.ConceptNameCodeSequence.CodeMeaning ===
            TRACKING_IDENTIFIER
        );

        const mappedTrackingIdentifier = `${cornerstoneTag}:${toolName}`;
        TrackingIdentifierGroup.TextValue = mappedTrackingIdentifier;
      }
    }
  }
  return newlyGeneratedMeasurementGroups;
}

export function convertSCOORD3DAnnotations(dataset, displaySets) {
  // Identify the Imaging Measurements
  const imagingMeasurementContent = toArray(dataset.ContentSequence).find(
    codeMeaningEquals(REPORT)
  );

  let additionalMeasurementGroups = [];
  // Retrieve the Measurements themselves
  const measurementGroups = toArray(
    imagingMeasurementContent.ContentSequence
  ).filter(codeMeaningEquals(GROUP));
  measurementGroups.forEach(measurementGroup => {
    const newlyGeneratedMeasurementGroups =
      convertSCOORD3DAnnotationsInMeasurementGroups(
        measurementGroup,
        displaySets
      );
    additionalMeasurementGroups = additionalMeasurementGroups.concat(
      newlyGeneratedMeasurementGroups
    );
  });
  additionalMeasurementGroups.map(group =>
    imagingMeasurementContent.ContentSequence.push(group)
  );
}
