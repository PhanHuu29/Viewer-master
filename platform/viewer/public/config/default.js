window.config = {
  // default: '/'
  routerBasename: '/dicom-viewer/',
  extensions: [],
  showStudyList: false,
  filterQueryParam: false,
  disableServersCache: true,
  disableMeasurementPanel: true,
  servers: {
    dicomWeb: [
      {
        name: 'dicom-web',
        wadoUriRoot: '/dicom-server/wado',
        qidoRoot: '/dicom-server/dicom-web',
        wadoRoot: '/dicom-server/dicom-web',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        StudiesMetadata: 'MainDicomTags',
        SeriesMetadata: "Full",
        supportsFuzzyMatching: true,
        
      },
    ],
  },
  // update the logo to the MIDRC logo
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement('a', {
        target: '_self',
        rel: 'noopener noreferrer',
        className: 'header-brand',
        href: 'https://data.midrc.org',
        style: {
          display: 'block',
          textIndent: '-9999px',
          background: 'url(../assets/midrc-logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '200px',
        },
      });
    },
  },

  // Extensions should be able to suggest default values for these?
  // Or we can require that these be explicitly set
  hotkeys: [
    // ~ Global
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['right'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['left'],
    },
    // Supported Keys: https://craig.is/killing/mice
    // ~ Cornerstone Extension
    { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
    { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
    { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Horizontally',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Vertically',
      keys: ['v'],
    },
    { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
    { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
    { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
    { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
    // clearAnnotations
    { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
    { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
    // firstImage
    // lastImage
    {
      commandName: 'previousViewportDisplaySet',
      label: 'Previous Series',
      keys: ['pagedown'],
    },
    {
      commandName: 'nextViewportDisplaySet',
      label: 'Next Series',
      keys: ['pageup'],
    },
    // ~ Cornerstone Tools
    { commandName: 'setZoomTool', label: 'Zoom', keys: ['z'] },
    // ~ Window level presets
    {
      commandName: 'windowLevelPreset1',
      label: 'W/L Preset 1',
      keys: ['1'],
    },
    {
      commandName: 'windowLevelPreset2',
      label: 'W/L Preset 2',
      keys: ['2'],
    },
    {
      commandName: 'windowLevelPreset3',
      label: 'W/L Preset 3',
      keys: ['3'],
    },
    {
      commandName: 'windowLevelPreset4',
      label: 'W/L Preset 4',
      keys: ['4'],
    },
    {
      commandName: 'windowLevelPreset5',
      label: 'W/L Preset 5',
      keys: ['5'],
    },
    {
      commandName: 'windowLevelPreset6',
      label: 'W/L Preset 6',
      keys: ['6'],
    },
    {
      commandName: 'windowLevelPreset7',
      label: 'W/L Preset 7',
      keys: ['7'],
    },
    {
      commandName: 'windowLevelPreset8',
      label: 'W/L Preset 8',
      keys: ['8'],
    },
    {
      commandName: 'windowLevelPreset9',
      label: 'W/L Preset 9',
      keys: ['9'],
    },
  ],
  cornerstoneExtensionConfig: {},
  // Following property limits number of simultaneous series metadata requests.
  // For http/1.x-only servers, set this to 5 or less to improve
  //  on first meaningful display in viewer
  // If the server is particularly slow to respond to series metadata
  //  requests as it extracts the metadata from raw files everytime,
  //  try setting this to even lower value
  // Leave it undefined for no limit, suitable for HTTP/2 enabled servers
  // maxConcurrentMetadataRequests: 5,
};
