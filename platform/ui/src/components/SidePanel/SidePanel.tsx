import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SwiperCore, { A11y, Controller, Navigation, Pagination, Scrollbar } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import LegacyButton from '../LegacyButton';
import Icon from '../Icon';
import IconButton from '../IconButton';
import Tooltip from '../Tooltip';

import 'swiper/css';
import 'swiper/css/navigation';
import './style.css';

const borderSize = 4;
const expandedWidth = 248;
const collapsedWidth = 25;

const baseStyle = {
  maxWidth: `${expandedWidth}px`,
  width: `${expandedWidth}px`,
};

const collapsedHideWidth = expandedWidth - collapsedWidth - borderSize;
const styleMap = {
  open: {
    left: { marginLeft: '0px' },
    right: { marginRight: '0px' },
  },
  closed: {
    left: { marginLeft: `-${collapsedHideWidth}px` },
    right: { marginRight: `-${collapsedHideWidth}px` },
  },
};

const baseClasses =
  'transition-all duration-300 ease-in-out h-100 bg-black border-black justify-start box-content flex flex-col';

const classesMap = {
  open: {
    left: `mr-1`,
    right: `ml-1`,
  },
  closed: {
    left: `mr-2 items-end`,
    right: `ml-2 items-start`,
  },
};

const openStateIconName = {
  left: 'push-left',
  right: 'push-right',
};

const position = {
  left: {
    right: 5,
  },
  right: {
    left: 5,
  },
};

const SidePanel = ({ side, className, activeTabIndex: activeTabIndexProp, tabs, onOpened }) => {
  const { t } = useTranslation('SidePanel');

  const [panelOpen, setPanelOpen] = useState();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const swiperRef = useRef() as any;
  const [swiper, setSwiper] = useState<any>();

  const prevRef = React.useRef();
  const nextRef = React.useRef();

  const openStatus = panelOpen ? 'open' : 'closed';
  const style = Object.assign({}, styleMap[openStatus][side], baseStyle);

  const ActiveComponent = tabs[activeTabIndex].content;

  useEffect(() => {
    if (panelOpen && swiper) {
      swiper.slideTo(activeTabIndex, 500);
    }
  }, [panelOpen, swiper]);

  useEffect(() => {
    if (swiper) {
      swiper.params.navigation.prevEl = prevRef.current;
      swiper.params.navigation.nextEl = nextRef.current;
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, [swiper]);

  const updatePanelOpen = useCallback((panelOpen: boolean) => {
    setPanelOpen(panelOpen);
    if (panelOpen) {
      onOpened?.();
    }
  }, []);

  const updateActiveTabIndex = useCallback(
    (activeTabIndex: number) => {
      if (activeTabIndex === null) {
        updatePanelOpen(false);
        return;
      }

      setActiveTabIndex(activeTabIndex);
      updatePanelOpen(true);
    },
    [updatePanelOpen]
  );

  useEffect(() => {
    updateActiveTabIndex(activeTabIndexProp);
  }, [activeTabIndexProp, updateActiveTabIndex]);

  const getCloseStateComponent = () => {
    const _childComponents = Array.isArray(tabs) ? tabs : [tabs];
    return (
      <>
        <div
          className={classnames(
            'bg-secondary-dark flex h-[28px] w-full cursor-pointer items-center rounded-md',
            side === 'left' ? 'justify-end pr-2' : 'justify-start pl-2'
          )}
          onClick={() => {
            updatePanelOpen(prev => !prev);
          }}
          data-cy={`side-panel-header-${side}`}
        >
          <Icon
            name={'navigation-panel-right-reveal'}
            className={classnames('text-primary-active', side === 'left' && 'rotate-180 transform')}
          />
        </div>
        <div className={classnames('mt-3 flex flex-col space-y-3')}>
          {_childComponents.map((childComponent, index) => (
            <Tooltip
              position={side === 'left' ? 'right' : 'left'}
              key={index}
              content={`${childComponent.label}`}
              className={classnames(
                'flex items-center',
                side === 'left' ? 'justify-end ' : 'justify-start '
              )}
            >
              <IconButton
                id={`${childComponent.name}-btn`}
                variant="text"
                color="inherit"
                size="initial"
                className="text-primary-active"
                onClick={() => {
                  updateActiveTabIndex(index);
                }}
              >
                <Icon
                  name={childComponent.iconName}
                  className="text-primary-active"
                  style={{
                    width: '22px',
                    height: '22px',
                  }}
                />
              </IconButton>
            </Tooltip>
          ))}
        </div>
      </>
    );
  };

  return (
    <div
      className={classnames(className, baseClasses, classesMap[openStatus][side])}
      style={style}
    >
      {panelOpen ? (
        <React.Fragment>
          {/** Panel Header with Arrow and Close Actions */}
          <div
            className={classnames(
              'flex-static bg-primary-dark flex h-9 cursor-pointer px-[10px]',
              tabs.length === 1 && 'mb-1'
            )}
            onClick={() => {
              updatePanelOpen(prev => !prev);
              // slideToActivePanel();
            }}
            data-cy={`side-panel-header-${side}`}
          >
            {/* TODO This should be redesigned to not be a button. */}
            <LegacyButton
              variant="text"
              color="inherit"
              border="none"
              rounded="none"
              className="flex-static relative flex w-full flex-row items-center px-3"
              name={tabs.length === 1 ? `${tabs[activeTabIndex].name}` : ''}
            >
              <Icon
                name={openStateIconName[side]}
                className={classnames(
                  'text-primary-active absolute',
                  side === 'left' && 'order-last'
                )}
                style={{ ...position[side] }}
              />
              {/* Todo: ass secondary label here */}
              <span className="text-primary-active">
                {tabs.length === 1 && (t(tabs[activeTabIndex].label) as string)}
              </span>
            </LegacyButton>
          </div>
          {tabs.length > 1 &&
            _getMoreThanOneTabLayout(
              swiperRef,
              setSwiper,
              prevRef,
              nextRef,
              tabs,
              activeTabIndex,
              updateActiveTabIndex
            )}
          {/** carousel navigation with the arrows */}
          {/** only show carousel nav if tabs are more than 3 tabs */}
          {tabs.length > 3 && (
            <div className="text-primary-active bg-primary-dark flex w-full justify-end gap-2 py-1 px-2">
              <button
                ref={prevRef}
                className="swiper-button-prev-custom"
              >
                <Icon
                  name={'icon-prev'}
                  className={classnames('text-primary-active')}
                />
              </button>
              <button
                ref={nextRef}
                className="swiper-button-next-custom"
              >
                <Icon
                  name={'icon-next'}
                  className={classnames('text-primary-active')}
                />
              </button>
            </div>
          )}
          <ActiveComponent />
        </React.Fragment>
      ) : (
        <React.Fragment>{getCloseStateComponent()}</React.Fragment>
      )}
    </div>
  );
};

SidePanel.defaultProps = {
  defaultComponentOpen: null,
};

SidePanel.propTypes = {
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  className: PropTypes.string,
  activeTabIndex: PropTypes.number,
  tabs: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        iconName: PropTypes.string.isRequired,
        iconLabel: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        content: PropTypes.func, // TODO: Should be node, but it keeps complaining?
      })
    ),
  ]),
  onOpened: PropTypes.func,
};

function _getMoreThanOneTabLayout(
  swiperRef: any,
  setSwiper: React.Dispatch<any>,
  prevRef: React.MutableRefObject<undefined>,
  nextRef: React.MutableRefObject<undefined>,
  tabs: any,
  activeTabIndex: any,
  updateActiveTabIndex
) {
  return (
    <div
      className="flex-static collapse-sidebar relative"
      style={{
        backgroundColor: '#06081f',
      }}
    >
      <div className="w-full">
        <Swiper
          onInit={(core: SwiperCore) => {
            swiperRef.current = core.el;
          }}
          simulateTouch={false}
          modules={[Navigation, Pagination, Scrollbar, A11y, Controller]}
          slidesPerView={3}
          spaceBetween={5}
          onSwiper={swiper => setSwiper(swiper)}
          navigation={{
            prevEl: prevRef?.current,
            nextEl: nextRef?.current,
          }}
        >
          {tabs.map((obj, index) => (
            <SwiperSlide key={index}>
              <div
                className={classnames(
                  index === activeTabIndex ? 'bg-secondary-main text-white' : 'text-aqua-pale',
                  'flex cursor-pointer flex-col items-center justify-center  rounded-[4px] px-4 py-1 text-center hover:text-white'
                )}
                key={index}
                onClick={() => {
                  updateActiveTabIndex(index);
                }}
                data-cy={`${obj.name}-btn`}
              >
                <span>
                  <Icon
                    name={obj.iconName}
                    className={classnames(
                      index === activeTabIndex ? 'text-white' : 'text-primary-active'
                    )}
                    style={{
                      width: '22px',
                      height: '22px',
                    }}
                  />
                </span>
                <span className="mt-[5px] select-none whitespace-nowrap text-[10px] font-medium">
                  {obj.label}
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default SidePanel;
