import { units, deploymentZones, objectiveLayouts } from './config.js';
import { setupStage } from './stageSetup.js';
import { setupUnits } from './unitManagement.js';
import { setupDeploymentZones } from './deploymentZones.js';
import { setupObjectives } from './objectives.js';
import { setupUIControls } from './uiControls.js';

const terrainImage = new Image();
terrainImage.onload = function() {
  console.log('Terrain image loaded successfully');
  const { stage, terrainLayer, objectiveLayer, zoneLayer, unitLayer, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY } = setupStage(terrainImage);
  const unitManagement = setupUnits(stage, unitLayer, units, pxPerInchWidth, pxPerInchHeight, width, height);
  const { cycleDeploymentZone, getCurrentDeploymentZoneIndex } = setupDeploymentZones(zoneLayer, deploymentZones, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY);
  const { cycleObjectiveLayout, getCurrentObjectiveLayoutIndex } = setupObjectives(objectiveLayer, objectiveLayouts, pxPerInchWidth, pxPerInchHeight);
  setupUIControls(stage, unitManagement, width, height);

  document.getElementById('cycle-zones').addEventListener('click', cycleDeploymentZone);
  document.getElementById('cycle-objectives').addEventListener('click', cycleObjectiveLayout);

  // Save state to localStorage
  function saveState() {
    const state = {
      units: units.map(unit => ({ ...unit })), // Deep copy units
      unitInstances: unitManagement.getUnitInstances(),
    };
    localStorage.setItem('diva_state', JSON.stringify(state));
    console.log('State saved:', state);
  }

  // Load state from localStorage
  function loadState() {
    const savedState = localStorage.getItem('diva_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        units.length = 0;
        state.units.forEach(unit => units.push(unit));
        unitManagement.refreshRoster(state.units);
        unitManagement.loadUnitInstances(state.unitInstances);
        console.log('State loaded:', state);
        terrainLayer.draw();
        zoneLayer.draw();
        objectiveLayer.draw();
        unitLayer.draw();
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }

  // Clear roster and save empty state
  function clearRoster() {
    units.length = 0; // Clear the units array
    unitManagement.refreshRoster([]); // Refresh roster with empty array
    unitLayer.removeChildren(); // Clear all units from the canvas
    unitLayer.draw();
    localStorage.setItem('diva_state', JSON.stringify({ units: [], unitInstances: [] })); // Save empty state
    console.log('Roster cleared and empty state saved');
    alert('Roster cleared successfully!');
  }

  // Initialize with saved state
  loadState();

  // Save state on button click
  document.getElementById('save-state').addEventListener('click', () => {
    saveState();
    alert('State saved successfully!');
  });

  // Clear roster on button click
  document.getElementById('clear-roster').addEventListener('click', () => {
    clearRoster();
  });

  console.log('Drawing layers:', { width, height, centerX, centerY });
  terrainLayer.draw();
  unitLayer.draw();
};
terrainImage.onerror = function() {
  console.error('Failed to load terrain image at /assets/terrain.png');
  // Fallback: Initialize without terrain image
  const { stage, terrainLayer, objectiveLayer, zoneLayer, unitLayer, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY } = setupStage(null);
  const unitManagement = setupUnits(stage, unitLayer, units, pxPerInchWidth, pxPerInchHeight, width, height);
  const { cycleDeploymentZone, getCurrentDeploymentZoneIndex } = setupDeploymentZones(zoneLayer, deploymentZones, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY);
  const { cycleObjectiveLayout, getCurrentObjectiveLayoutIndex } = setupObjectives(objectiveLayer, objectiveLayouts, pxPerInchWidth, pxPerInchHeight);
  setupUIControls(stage, unitManagement, width, height);

  document.getElementById('cycle-zones').addEventListener('click', cycleDeploymentZone);
  document.getElementById('cycle-objectives').addEventListener('click', cycleObjectiveLayout);

  // Save state to localStorage
  function saveState() {
    const state = {
      units: units.map(unit => ({ ...unit })), // Deep copy units
      unitInstances: unitManagement.getUnitInstances(),
    };
    localStorage.setItem('diva_state', JSON.stringify(state));
    console.log('State saved:', state);
  }

  // Load state from localStorage
  function loadState() {
    const savedState = localStorage.getItem('diva_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        units.length = 0;
        state.units.forEach(unit => units.push(unit));
        unitManagement.refreshRoster(state.units);
        unitManagement.loadUnitInstances(state.unitInstances);
        console.log('State loaded:', state);
        terrainLayer.draw();
        zoneLayer.draw();
        objectiveLayer.draw();
        unitLayer.draw();
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }

  // Clear roster and save empty state
  function clearRoster() {
    units.length = 0; // Clear the units array
    unitManagement.refreshRoster([]); // Refresh roster with empty array
    unitLayer.removeChildren(); // Clear all units from the canvas
    unitLayer.draw();
    localStorage.setItem('diva_state', JSON.stringify({ units: [], unitInstances: [] })); // Save empty state
    console.log('Roster cleared and empty state saved');
    alert('Roster cleared successfully!');
  }

  // Initialize with saved state
  loadState();

  // Save state on button click
  document.getElementById('save-state').addEventListener('click', () => {
    saveState();
    alert('State saved successfully!');
  });

  // Clear roster on button click
  document.getElementById('clear-roster').addEventListener('click', () => {
    clearRoster();
  });

  console.log('Drawing layers without terrain:', { width, height, centerX, centerY });
  terrainLayer.draw();
  unitLayer.draw();
};
terrainImage.src = '/diva/assets/terrain.png';