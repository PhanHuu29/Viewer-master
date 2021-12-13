import React, { useEffect, useContext, useRef } from 'react';
import '../AITriggerComponent.css';
import Jobs from './Jobs';
import { connect } from 'react-redux';
import axios from 'axios';
import { JobsContext } from '../../../context/JobsContext';
import circularLoading from './utils/circular-loading.json';
import { useLottie } from "lottie-react";

const TextureFeature = props => {
  const [jobs, setJobs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user, viewport } = props;
  const access_token = user.access_token;
  const email = user.profile.email;
  const series = viewport.viewportSpecificData[0].SeriesInstanceUID;
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const instancesRef = useRef();

  const options = {
    animationData: circularLoading,
    loop: true,
    autoplay: true,
  };

  const { View: Loader } = useLottie(options);


  const client = axios.create({
    baseURL: 'https://radcadapi.thetatech.ai',
    timeout: 90000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${access_token}`;
    return config;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      getJobs();
    }, 2000);
    return () => clearInterval(interval);
  }, [getJobs]);

  // getting all jobs for the current series being displayed in viewport
  const getJobs = async () => {
    try {
      await client
        .get(`/jobs?series=${series}&email=${email}`)
        .then(response => {
          instancesRef.current = response.data.instances;
          setJobs([...response.data.jobs]);
          setIsLoading(false);
        });
    } catch (err) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const removeOverlay = () => {
    setOverlayStatus(false);
  };

  return (
    <div className="component">
      <div className="title-header">Texture Features</div>

      {isLoading && (
        <div className="loader">
          { Loader }
        </div>
      )}

      {overlayStatus && (
        <div>
          <br></br>
          <label>
            <div className="triggerButton">
              <button onClick={removeOverlay} className="syncButton">
                Remove Overlay
              </button>
              <br></br>
            </div>
          </label>
        </div>
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="accordion">
          {jobs.map((data, index) => (
            <Jobs
              key={index}
              user={user}
              viewport={viewport}
              series={series}
              data={data}
              instances={instancesRef.current}
            />
          ))}
        </div>
      )}

      {!isLoading && jobs.length <= 0 && (
        <div className="accordion">
          <p>
            There are current no jobs created. Kindly select the AiTrigger
            button on the toolbar to begin the job creation process
          </p>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    viewport: state.viewports,
  };
};

const ConnectedTextureFeature = connect(
  mapStateToProps,
  null
)(TextureFeature);

export default ConnectedTextureFeature;
