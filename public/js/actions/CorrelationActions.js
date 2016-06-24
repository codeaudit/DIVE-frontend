import {
  SELECT_CORRELATION_VARIABLE,
  REQUEST_CORRELATION,
  RECEIVE_CORRELATION,
  PROGRESS_CORRELATION,
  ERROR_CORRELATION,
  REQUEST_CORRELATION_SCATTERPLOT,
  RECEIVE_CORRELATION_SCATTERPLOT,
  REQUEST_CREATE_SAVED_CORRELATION,
  RECEIVE_CREATED_SAVED_CORRELATION,
  REQUEST_CREATE_EXPORTED_CORRELATION,
  RECEIVE_CREATED_EXPORTED_CORRELATION,
} from '../constants/ActionTypes';

import { fetch, pollForTask } from './api.js';

export function selectCorrelationVariable(selectedCorrelationVariable) {
  return {
    type: SELECT_CORRELATION_VARIABLE,
    correlationVariableId: selectedCorrelationVariable,
    selectedAt: Date.now()
  }
}

function requestCorrelationDispactcher(datasetId) {
  return {
    type: REQUEST_CORRELATION
  };
}

function progressCorrelationDispatcher(data) {
  return {
    type: PROGRESS_CORRELATION,
    progress: (data.currentTask && data.currentTask.length) ? data.currentTask : data.previousTask
  };
}

function receiveCorrelationDispatcher(params, json) {
  return {
    type: RECEIVE_CORRELATION,
    data: json,
    receivedAt: Date.now()
  };
}

function errorCorrelationDispatcher(json) {
  return {
    type: ERROR_CORRELATION,
    progress: 'Error running correlations, please check console.'
  };
}

export function getCorrelations(projectId, datasetId, correlationVariables) {
  const params = {
    projectId: projectId,
    spec: {
      datasetId: datasetId,
      correlationVariables: correlationVariables
    }
  }

  return (dispatch) => {
    dispatch(requestCorrelationDispactcher());
    return fetch('/statistics/v1/correlations', {
      method: 'post',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function(json) {
      if (json.compute) {
        dispatch(pollForTask(json.taskId, REQUEST_CORRELATION, params, receiveCorrelationDispatcher, progressCorrelationDispatcher, errorCorrelationDispatcher));
      } else {
        dispatch(receiveCorrelationDispatcher(params, json));
      }
    })
    .catch(err => console.error("Error creating correlation matrix: ", err));
  };
}

function requestCorrelationScatterplotDispatcher() {
  return {
    type: REQUEST_CORRELATION_SCATTERPLOT
  };
}

function receiveCorrelationScatterplotDispatcher(json) {
  return {
    type: RECEIVE_CORRELATION_SCATTERPLOT,
    data: json,
    receivedAt: Date.now()
  };
}

export function getCorrelationScatterplot(projectId, correlationId) {
  return (dispatch) => {
    dispatch(requestCorrelationScatterplotDispatcher());
    return fetch(`/statistics/v1/correlation_scatterplot/${correlationId}?projectId=${projectId}`)
      .then(json => dispatch(receiveCorrelationScatterplotDispatcher(json)));
  };
}

function requestCreateExportedCorrelationDispatcher(action) {
  return {
    type: action
  };
}

function receiveCreatedExportedCorrelationDispatcher(action, json) {
  return {
    type: action,
    exportedCorrelationId: json.id,
    exportedSpec: json,
    receivedAt: Date.now()
  };
}

export function createExportedCorrelation(projectId, correlationId, data, saveAction = false) {
  console.log('in createExportedCorrelation', projectId, correlationId, data);
  const requestAction = saveAction ? REQUEST_CREATE_SAVED_CORRELATION : REQUEST_CREATE_EXPORTED_CORRELATION;
  const receiveAction = saveAction ? RECEIVE_CREATED_SAVED_CORRELATION : RECEIVE_CREATED_EXPORTED_CORRELATION;

  const params = {
    project_id: projectId,
    correlation_id: correlationId,
    data: data,
  }

  return dispatch => {
    console.log('dispatching');
    dispatch(requestCreateExportedCorrelationDispatcher(requestAction));
    return fetch('/exported_correlation/v1/exported_correlation', {
      method: 'post',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    }).then(response => response.json())
      .then(json => dispatch(receiveCreatedExportedCorrelationDispatcher(receiveAction, json)))
      .catch(err => console.error("Error creating exported correlation: ", err));
  };
}
