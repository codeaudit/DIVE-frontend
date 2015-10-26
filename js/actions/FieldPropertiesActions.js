import {
  SELECT_FIELD_PROPERTY,
  REQUEST_FIELD_PROPERTIES,
  RECEIVE_FIELD_PROPERTIES,
  SELECT_FIELD_PROPERTY_VALUE,
  SELECT_AGGREGATION_FUNCTION
} from '../constants/ActionTypes';

import { fetch } from './api.js';

function requestFieldPropertiesDispatcher() {
  return {
    type: REQUEST_FIELD_PROPERTIES,
    requestedAt: Date.now()
  };
}

function receiveFieldPropertiesDispatcher(projectId, datasetId, json) {

  const AGGREGATIONS = [
    {
      value: "ALL_TYPES",
      label: "All Types",
      selected: true
    },
    {
      value: "AVG",
      label: "mean",
      selected: false
    },
    {
      value: "MIN",
      label: "min",
      selected: false
    },
    {
      value: "MAX",
      label: "max",
      selected: false
    }
  ];

  const allValuesMenuItem = {
    selected: true,
    value: "ALL_VALUES",
    label: "All Values"
  };

  const cFieldProperties = json.fieldProperties
    .filter((property) => property.generalType == 'c')
    .map((property) => 
      new Object({
        ...property,
        selected: false,
        values: [allValuesMenuItem, ...property.uniqueValues.map((value, i) =>
          new Object({
            selected: false,
            value: `${ value }`,
            label: value
          })
        )]
      })
    );

  const qFieldProperties = json.fieldProperties
    .filter((property) => property.generalType == 'q')
    .map((property) => 
      new Object({
        ...property,
        selected: false,
        aggregations: AGGREGATIONS
      })
    );


  return {
    type: RECEIVE_FIELD_PROPERTIES,
    projectId: projectId,
    datasetId: datasetId,
    fieldProperties: [ ...cFieldProperties, ...qFieldProperties ],
    receivedAt: Date.now()
  };
}

export function fetchFieldProperties(projectId, datasetId) {
  return dispatch => {
    dispatch(requestFieldPropertiesDispatcher());
    return fetch(`/field_properties/v1/field_properties?project_id=${projectId}&dataset_id=${datasetId}`)
      .then(response => response.json())
      .then(json => dispatch(receiveFieldPropertiesDispatcher(projectId, datasetId, json)));
  };
}

function shouldFetchFieldProperties(state) {
  const fieldProperties = state.fieldProperties;
  if (fieldProperties.isFetching) {
    return false;
  }
  return true;
}

export function fetchFieldPropertiesIfNeeded(projectId, datasetId) {
  return (dispatch, getState) => {
    if (shouldFetchFieldProperties(getState())) {
      return dispatch(fetchFieldProperties(projectId, datasetId));
    }
  };
}

export function selectFieldProperty(selectedFieldPropertyId) {
  return {
    type: SELECT_FIELD_PROPERTY,
    selectedFieldPropertyId: selectedFieldPropertyId,
    receivedAt: Date.now()
  }
}

export function selectFieldPropertyValue(selectedFieldPropertyId, selectedFieldPropertyValueId) {
  return {
    type: SELECT_FIELD_PROPERTY_VALUE,
    selectedFieldPropertyId: selectedFieldPropertyId,
    selectedFieldPropertyValueId: selectedFieldPropertyValueId
  }
}

export function selectAggregationFunction(selectedFieldPropertyId, selectedFieldPropertyValueId) {
  return {
    type: SELECT_AGGREGATION_FUNCTION,
    selectedFieldPropertyId: selectedFieldPropertyId,
    selectedFieldPropertyValueId: selectedFieldPropertyValueId
  }  
}

