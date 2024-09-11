import { hotkeys } from '@ohif/core';
import i18n from 'i18next';

import { id } from './id';
import toolbarButtons from './toolbarButtons';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocols: '@ohif/extension-default.hangingProtocolModule.default',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  rightPanel: '@ohif/extension-default.panelModule.measure',
};

export const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  '@ohif/extension-dicom-microscopy': '^3.0.0',
};

function modeFactory({ modeConfiguration }) {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'microscopy',
    displayName: i18n.t('Modes:Microscopy'),

    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }: withAppTypes) => {
      const { toolbarService } = servicesManager.services;

      const buttonSectionId = 'primary';
      const extensionsToolbarSection = toolbarService.getButtonSection(buttonSectionId) ?? [];
      toolbarService.addButtons(toolbarButtons);
      toolbarService.createButtonSection(buttonSectionId, [
        'MeasurementTools',
        'dragPan',
        'TagBrowser',
        ...extensionsToolbarSection.map(button => button.id),
      ]);
    },

    onModeExit: ({ servicesManager }: withAppTypes) => {
      const { toolbarService, uiDialogService, uiModalService } = servicesManager.services;

      uiDialogService.dismissAll();
      uiModalService.hide();
      toolbarService.reset();
    },

    validationTags: {
      study: [],
      series: [],
    },

    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');

      return {
        valid: modalities_list.includes('SM'),
        description: 'Microscopy mode only supports the SM modality',
      };
    },

    routes: [
      {
        path: 'microscopy',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [ohif.leftPanel],
              leftPanelClosed: true, // we have problem with rendering thumbnails for microscopy images
              rightPanelClosed: true, // we do not have the save microscopy measurements yet
              rightPanels: ['@ohif/extension-dicom-microscopy.panelModule.measure'],
              viewports: [
                {
                  namespace: '@ohif/extension-dicom-microscopy.viewportModule.microscopy-dicom',
                  displaySetsToDisplay: [
                    // Share the sop class handler with cornerstone version of it
                    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
                    '@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopySRSopClassHandler',
                  ],
                },
                {
                  namespace: dicomvideo.viewport,
                  displaySetsToDisplay: [dicomvideo.sopClassHandler],
                },
                {
                  namespace: dicompdf.viewport,
                  displaySetsToDisplay: [dicompdf.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: extensionDependencies,
    hangingProtocol: ['default'],

    sopClassHandlers: [
      '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
      '@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopySRSopClassHandler',
      dicomvideo.sopClassHandler,
      dicompdf.sopClassHandler,
    ],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
    ...modeConfiguration,
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
