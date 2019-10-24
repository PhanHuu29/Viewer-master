import { connect } from 'react-redux';
import { DownloadDialog } from '@ohif/ui';
import b64toBlob from '../lib/utils/b64toBlob';

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;

const mapStateToProps = (state, ownProps) => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom: activeEnabledElement } = viewportSpecificData[activeViewportIndex] || {};

  return {
    minimumSize: MINIMUM_SIZE,
    defaultSize: DEFAULT_SIZE,
    canvasClass: "cornerstone-canvas",
    onClose: ownProps.toggleDownloadDialog,
    activeViewport: activeEnabledElement,
    enableViewport: viewportElement => {
      if (viewportElement) {
        cornerstone.enable(viewportElement);
      }
    },
    disableViewport: viewportElement => {
      if (viewportElement) {
        cornerstone.disable(viewportElement);
      }
    },
    updateViewportPreview: (viewportElement, downloadCanvas, fileType) =>
      new Promise(resolve => {
        cornerstone.fitToWindow(viewportElement);

        viewportElement.addEventListener('cornerstoneimagerendered', function updateViewport(event) {
          const enabledElement = cornerstone.getEnabledElement(event.target).element;
          const type = 'image/' + fileType;
          const dataUrl = downloadCanvas.toDataURL(type, 1);

          let newWidth = enabledElement.offsetHeight;
          let newHeight = enabledElement.offsetWidth;

          if (newWidth > DEFAULT_SIZE || newHeight > DEFAULT_SIZE) {
            const multiplier = DEFAULT_SIZE / Math.max(newWidth, newHeight);
            newHeight *= multiplier;
            newWidth *= multiplier;
          }

          resolve({ dataUrl, width: newWidth, height: newHeight });

          viewportElement.removeEventListener('cornerstoneimagerendered', updateViewport);
        });
      }),
    loadImage: (activeViewport, viewportElement, width, height) =>
      new Promise(resolve => {
        if (activeViewport && viewportElement) {
          const enabledElement = cornerstone.getEnabledElement(activeViewport);
          const viewport = Object.assign({}, enabledElement.viewport);
          delete viewport.scale;
          viewport.translation = {
            x: 0,
            y: 0
          };

          cornerstone.loadImage(enabledElement.image.imageId)
            .then(image => {
              cornerstone.displayImage(viewportElement, image);
              cornerstone.setViewport(viewportElement, viewport);
              cornerstone.resize(viewportElement, true);

              const MAX_TEXTURE_SIZE = 16384;
              const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
              const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

              resolve({ image, width: newWidth, height: newHeight });
            });
        }
      }),
    toggleAnnotations: (toggle, viewportElement) => {
      cornerstoneTools.store.state.tools.forEach(({ name }) => {
        if (toggle) {
          cornerstoneTools.setToolEnabledForElement(viewportElement, name);
        } else {
          cornerstoneTools.setToolDisabledForElement(viewportElement, name);
        }
      });
    },
    downloadBlob: (filename, fileType, viewportElement, downloadCanvas) => {
      const file = `${filename}.${fileType}`;
      const mimetype = `image/${fileType}`;

      /* Handles JPEG images for IE11 */
      if (downloadCanvas.msToBlob && fileType === 'jpeg') {
        const image = downloadCanvas.toDataURL(mimetype, 1);
        const blob = b64toBlob(image.replace('data:image/jpeg;base64,', ''), mimetype);
        return window.navigator.msSaveBlob(blob, file);
      }

      return cornerstoneTools.SaveAs(viewportElement, file, mimetype);
    }
  }
};

const ConnectedDownloadDialog = connect(
  mapStateToProps,
  null
)(DownloadDialog);

export default ConnectedDownloadDialog;
