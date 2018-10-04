import AppState from '../state';
import { ACTIONS } from '../actions/types';
import { AnyAction, SetAreaAction, ReceiveDataAction, ResetSelectAction, SetMessageAction } from '../actions';
import * as MapUtils from '../utils/map';

export default (prevState: AppState, action: AnyAction) => {
  switch (action.type) {
    case ACTIONS.SET_AREA_ID:
      const setAreaIdAction = action as SetAreaAction;
      const areaLevel = MapUtils.mapAreaIdToAreaLevel(setAreaIdAction.areaId) as MapUtils.AREA_LEVEL;

      return {
        ...prevState,
        areaId: setAreaIdAction.areaId,
        areaLevel,
        nextAreaLevel: MapUtils.mapAreaLevelToNextAreaLevel(areaLevel)
      };
    case ACTIONS.SET_MESSAGE:
      const setMessageAction = action as SetMessageAction;
      return {
        ...prevState,
        message: setMessageAction.message
      };
    case ACTIONS.RECEIVE_ELECTION_RESULTS:
      return prevState;
    case ACTIONS.RECEIVE_GEODATA:
      return prevState;
    case ACTIONS.RECEIVE_DATA_FOR_AREA:
      const receiveGeodataAction = action as ReceiveDataAction;
      const key = receiveGeodataAction.topojson.key;
      const geometries = receiveGeodataAction.topojson.objects[key].geometries;
      let nextAreaLevel = prevState.nextAreaLevel;
      
      switch (nextAreaLevel) {
        case MapUtils.AREA_LEVEL.LAN:
          return {
            ...prevState,
            lan: withSort(MapUtils.mapTopojsonToAreas(geometries))
          };
        case MapUtils.AREA_LEVEL.KOMMUN:
          return {
            ...prevState,
            kommun: withSort(MapUtils.mapTopojsonToAreas(geometries))
          };
        case MapUtils.AREA_LEVEL.VALKRETS:
          return {
            ...prevState,
            valkrets: withSort(MapUtils.mapTopojsonToAreas(geometries))
          };
        case MapUtils.AREA_LEVEL.VALDISTRIKT:
          return {
            ...prevState,
            valdistrikt: withSort(MapUtils.mapTopojsonToAreas(geometries))
          };
        default:
          return prevState;
      }
    case ACTIONS.RESET_SELECT:
      const resetSelectAction = action as ResetSelectAction;
      let kommun = prevState.kommun;
      let valkrets = prevState.valkrets;
      let valdistrikt = prevState.valdistrikt;

      // fall throughs are intentional here - we want to reset all subsequent levels for a given level
      // lan -> kommun -> valkrets -> valdistrikt

      // tslint:disable:no-switch-case-fall-through
      switch (resetSelectAction.areaLevel) {
        case MapUtils.AREA_LEVEL.LAN:
          kommun = [];
        case MapUtils.AREA_LEVEL.KOMMUN:
          valkrets = [];
        case MapUtils.AREA_LEVEL.VALKRETS:
          valdistrikt = [];
        default:
          return { ...prevState, kommun, valdistrikt, valkrets };
      }
    default:
      return prevState;
  }
};

const withSort = (areas: MapUtils.Area[]) =>
  areas.sort((a: MapUtils.Area, b: MapUtils.Area) => {
    const aName = a.name.toLocaleLowerCase();
    const bName = b.name.toLocaleLowerCase();
    if (aName > bName) {
      return 1;
    }

    if (aName < bName) {
      return -1;
    }
    return 0;
  });