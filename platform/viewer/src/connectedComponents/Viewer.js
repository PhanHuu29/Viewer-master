import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { MODULE_TYPES } from '@ohif/core';
import OHIF, { DICOMSR } from '@ohif/core';
import { withDialog } from '@ohif/ui';
import moment from 'moment';
import ConnectedHeader from './ConnectedHeader.js';
import ConnectedToolbarRow from './ConnectedToolbarRow.js';
import ConnectedStudyBrowser from './ConnectedStudyBrowser.js';
import ConnectedViewerMain from './ConnectedViewerMain.js';
import SidePanel from './../components/SidePanel.js';
import { extensionManager } from './../App.js';

// Contexts
import WhiteLabellingContext from '../context/WhiteLabellingContext.js';
import UserManagerContext from '../context/UserManagerContext';

import './Viewer.css';

class Viewer extends Component {
  static propTypes = {
    studies: PropTypes.arrayOf(
      PropTypes.shape({
        studyInstanceUid: PropTypes.string.isRequired,
        studyDate: PropTypes.string,
        displaySets: PropTypes.arrayOf(
          PropTypes.shape({
            displaySetInstanceUid: PropTypes.string.isRequired,
            seriesDescription: PropTypes.string,
            seriesNumber: PropTypes.number,
            instanceNumber: PropTypes.number,
            numImageFrames: PropTypes.number,
            modality: PropTypes.string.isRequired,
            images: PropTypes.arrayOf(
              PropTypes.shape({
                getImageId: PropTypes.func.isRequired,
              })
            ),
          })
        ),
      })
    ),
    studyInstanceUids: PropTypes.array,
    activeServer: PropTypes.shape({
      type: PropTypes.string,
      wadoRoot: PropTypes.string,
    }),
    onTimepointsUpdated: PropTypes.func,
    onMeasurementsUpdated: PropTypes.func,
    // window.store.getState().viewports.viewportSpecificData
    viewports: PropTypes.object.isRequired,
    // window.store.getState().viewports.activeViewportIndex
    activeViewportIndex: PropTypes.number.isRequired,
    isStudyLoaded: PropTypes.bool,
    dialog: PropTypes.object,
  };

  constructor(props) {
    super(props);

    const { activeServer } = this.props;
    const server = Object.assign({}, activeServer);

    OHIF.measurements.MeasurementApi.setConfiguration({
      dataExchange: {
        retrieve: DICOMSR.retrieveMeasurements,
        store: DICOMSR.storeMeasurements,
      },
      server,
    });

    OHIF.measurements.TimepointApi.setConfiguration({
      dataExchange: {
        retrieve: this.retrieveTimepoints,
        store: this.storeTimepoints,
        remove: this.removeTimepoint,
        update: this.updateTimepoint,
        disassociate: this.disassociateStudy,
      },
    });
  }

  state = {
    isLeftSidePanelOpen: true,
    isRightSidePanelOpen: false,
    selectedRightSidePanel: '',
    selectedLeftSidePanel: 'studies', // TODO: Don't hardcode this
    thumbnails: [],
  };

  componentWillUnmount() {
    if (this.props.dialog) {
      this.props.dialog.dismissAll();
    }
  }

  retrieveTimepoints = filter => {
    OHIF.log.info('retrieveTimepoints');

    // Get the earliest and latest study date
    let earliestDate = new Date().toISOString();
    let latestDate = new Date().toISOString();
    if (this.props.studies) {
      latestDate = new Date('1000-01-01').toISOString();
      this.props.studies.forEach(study => {
        const StudyDate = moment(study.StudyDate, 'YYYYMMDD').toISOString();
        if (StudyDate < earliestDate) {
          earliestDate = StudyDate;
        }
        if (StudyDate > latestDate) {
          latestDate = StudyDate;
        }
      });
    }

    // Return a generic timepoint
    return Promise.resolve([
      {
        timepointType: 'baseline',
        timepointId: 'TimepointId',
        studyInstanceUids: this.props.studyInstanceUids,
        PatientId: filter.PatientId,
        earliestDate,
        latestDate,
        isLocked: false,
      },
    ]);
  };

  storeTimepoints = timepointData => {
    OHIF.log.info('storeTimepoints');
    return Promise.resolve();
  };

  updateTimepoint = (timepointData, query) => {
    OHIF.log.info('updateTimepoint');
    return Promise.resolve();
  };

  removeTimepoint = timepointId => {
    OHIF.log.info('removeTimepoint');
    return Promise.resolve();
  };

  disassociateStudy = (timepointIds, StudyInstanceUID) => {
    OHIF.log.info('disassociateStudy');
    return Promise.resolve();
  };

  onTimepointsUpdated = timepoints => {
    if (this.props.onTimepointsUpdated) {
      this.props.onTimepointsUpdated(timepoints);
    }
  };

  onMeasurementsUpdated = measurements => {
    if (this.props.onMeasurementsUpdated) {
      this.props.onMeasurementsUpdated(measurements);
    }
  };

  componentDidMount() {
    const { studies, isStudyLoaded } = this.props;
    const { TimepointApi, MeasurementApi } = OHIF.measurements;
    const currentTimepointId = 'TimepointId';

    const timepointApi = new TimepointApi(currentTimepointId, {
      onTimepointsUpdated: this.onTimepointsUpdated,
    });

    const measurementApi = new MeasurementApi(timepointApi, {
      onMeasurementsUpdated: this.onMeasurementsUpdated,
    });

    this.currentTimepointId = currentTimepointId;
    this.timepointApi = timepointApi;
    this.measurementApi = measurementApi;

    if (studies) {
      const PatientId = studies[0] && studies[0].PatientId;

      timepointApi.retrieveTimepoints({ PatientId });
      if (isStudyLoaded) {
        this.measurementApi.retrieveMeasurements(PatientId, [
          currentTimepointId,
        ]);
      }
      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies),
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { studies, isStudyLoaded } = this.props;
    if (studies !== prevProps.studies) {
      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies),
      });
    }
    if (isStudyLoaded && isStudyLoaded !== prevProps.isStudyLoaded) {
      const PatientId = studies[0] && studies[0].PatientId;
      const { currentTimepointId } = this;

      this.timepointApi.retrieveTimepoints({ PatientId });
      this.measurementApi.retrieveMeasurements(PatientId, [currentTimepointId]);
    }
  }

  render() {
    let VisiblePanelLeft, VisiblePanelRight;
    const panelExtensions = extensionManager.modules[MODULE_TYPES.PANEL];

    panelExtensions.forEach(panelExt => {
      panelExt.module.components.forEach(comp => {
        if (comp.id === this.state.selectedRightSidePanel) {
          VisiblePanelRight = comp.component;
        } else if (comp.id === this.state.selectedLeftSidePanel) {
          VisiblePanelLeft = comp.component;
        }
      });
    });

    return (
      <>
        {/* HEADER */}
        <WhiteLabellingContext.Consumer>
          {whiteLabelling => (
            <UserManagerContext.Consumer>
              {userManager => (
                <ConnectedHeader home={false} userManager={userManager}>
                  {whiteLabelling.logoComponent}
                </ConnectedHeader>
              )}
            </UserManagerContext.Consumer>
          )}
        </WhiteLabellingContext.Consumer>

        {/* TOOLBAR */}
        <ConnectedToolbarRow
          isLeftSidePanelOpen={this.state.isLeftSidePanelOpen}
          isRightSidePanelOpen={this.state.isRightSidePanelOpen}
          selectedLeftSidePanel={
            this.state.isLeftSidePanelOpen
              ? this.state.selectedLeftSidePanel
              : ''
          }
          selectedRightSidePanel={
            this.state.isRightSidePanelOpen
              ? this.state.selectedRightSidePanel
              : ''
          }
          handleSidePanelChange={(side, selectedPanel) => {
            const sideClicked = side && side[0].toUpperCase() + side.slice(1);
            const openKey = `is${sideClicked}SidePanelOpen`;
            const selectedKey = `selected${sideClicked}SidePanel`;
            const updatedState = Object.assign({}, this.state);

            const isOpen = updatedState[openKey];
            const prevSelectedPanel = updatedState[selectedKey];
            // RoundedButtonGroup returns `null` if selected button is clicked
            const isSameSelectedPanel =
              prevSelectedPanel === selectedPanel || selectedPanel === null;

            updatedState[selectedKey] = selectedPanel || prevSelectedPanel;

            const isClosedOrShouldClose = !isOpen || isSameSelectedPanel;
            if (isClosedOrShouldClose) {
              updatedState[openKey] = !updatedState[openKey];
            }

            this.setState(updatedState);
          }}
          studies={this.props.studies}
        />

        {/*<ConnectedStudyLoadingMonitor studies={this.props.studies} />*/}
        {/*<StudyPrefetcher studies={this.props.studies} />*/}

        {/* VIEWPORTS + SIDEPANELS */}
        <div className="FlexboxLayout">
          {/* LEFT */}
          <SidePanel from="left" isOpen={this.state.isLeftSidePanelOpen}>
            {VisiblePanelLeft ? (
              <VisiblePanelLeft
                viewports={this.props.viewports}
                activeIndex={this.props.activeViewportIndex}
              />
            ) : (
              <ConnectedStudyBrowser
                studies={this.state.thumbnails}
                studyMetadata={this.props.studies}
              />
            )}
          </SidePanel>

          {/* MAIN */}
          <div className={classNames('main-content')}>
            <ConnectedViewerMain studies={this.props.studies} />
          </div>

          {/* RIGHT */}
          <SidePanel from="right" isOpen={this.state.isRightSidePanelOpen}>
            {VisiblePanelRight && (
              <VisiblePanelRight
                viewports={this.props.viewports}
                activeIndex={this.props.activeViewportIndex}
              />
            )}
          </SidePanel>
        </div>
      </>
    );
  }
}

export default withDialog(Viewer);

/**
 * What types are these? Why do we have "mapping" dropped in here instead of in
 * a mapping layer?
 *
 * TODO[react]:
 * - Add sorting of display sets
 * - Add showStackLoadingProgressBar option
 *
 * @param {Study[]} studies
 * @param {DisplaySet[]} studies[].displaySets
 */
const _mapStudiesToThumbnails = function(studies) {
  return studies.map(study => {
    const { StudyInstanceUID } = study;

    const thumbnails = study.displaySets.map(displaySet => {
      const {
        displaySetInstanceUid,
        SeriesDescription,
        SeriesNumber,
        InstanceNumber,
        numImageFrames,
      } = displaySet;

      let imageId;
      let altImageText;

      if (displaySet.Modality && displaySet.Modality === 'SEG') {
        // TODO: We want to replace this with a thumbnail showing
        // the segmentation map on the image, but this is easier
        // and better than what we have right now.
        altImageText = 'SEG';
      } else if (displaySet.images && displaySet.images.length) {
        const imageIndex = Math.floor(displaySet.images.length / 2);

        imageId = displaySet.images[imageIndex].getImageId();
      } else {
        altImageText = displaySet.Modality ? displaySet.Modality : 'UN';
      }

      return {
        imageId,
        altImageText,
        displaySetInstanceUid,
        SeriesDescription,
        SeriesNumber,
        InstanceNumber,
        numImageFrames,
      };
    });

    return {
      StudyInstanceUID,
      thumbnails,
    };
  });
};
