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
  const { cycleDeploymentZone } = setupDeploymentZones(zoneLayer, deploymentZones, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY);
  const { cycleObjectiveLayout } = setupObjectives(objectiveLayer, objectiveLayouts, pxPerInchWidth, pxPerInchHeight);
  setupUIControls(stage, unitManagement, width, height);

  document.getElementById('cycle-zones').addEventListener('click', cycleDeploymentZone);
  document.getElementById('cycle-objectives').addEventListener('click', cycleObjectiveLayout);

  console.log('Drawing layers:', { width, height, centerX, centerY });
  terrainLayer.draw();
  unitLayer.draw();
};
terrainImage.onerror = function() {
  console.error('Failed to load terrain image at /assets/terrain.png');
  // Fallback: Initialize without terrain image
  const { stage, terrainLayer, objectiveLayer, zoneLayer, unitLayer, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY } = setupStage(null);
  const unitManagement = setupUnits(stage, unitLayer, units, pxPerInchWidth, pxPerInchHeight, width, height);
  const { cycleDeploymentZone } = setupDeploymentZones(zoneLayer, deploymentZones, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY);
  const { cycleObjectiveLayout } = setupObjectives(objectiveLayer, objectiveLayouts, pxPerInchWidth, pxPerInchHeight);
  setupUIControls(stage, unitManagement, width, height);

  document.getElementById('cycle-zones').addEventListener('click', cycleDeploymentZone);
  document.getElementById('cycle-objectives').addEventListener('click', cycleObjectiveLayout);

  console.log('Drawing layers without terrain:', { width, height, centerX, centerY });
  terrainLayer.draw();
  unitLayer.draw();
};
terrainImage.src = '/assets/terrain.png';