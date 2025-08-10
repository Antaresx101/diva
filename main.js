import { units, deploymentZones, objectiveLayouts, terrainCategories } from './config.js';
import { setupStage } from './stageSetup.js';
import { setupUnits } from './unitManagement.js';
import { setupDeploymentZones } from './deploymentZones.js';
import { setupObjectives } from './objectives.js';
import { setupUIControls } from './uiControls.js';

let currentCategory = Object.keys(terrainCategories)[0]; // Default to first category
let currentTerrain = terrainCategories[currentCategory][0]; // Default to first terrain in category
const terrainImage = new Image();
terrainImage.onload = function() {
  console.log('Terrain image loaded successfully:', currentTerrain);
  initApp(terrainImage);
};
terrainImage.onerror = function() {
  console.error('Failed to load terrain image at /diva/assets/' + currentTerrain);
  initApp(null);
};
terrainImage.src = '/diva/assets/' + currentTerrain;

function initApp(terrainImage) {
  const { stage, terrainLayer, objectiveLayer, zoneLayer, unitLayer, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY, setTerrainImage } = setupStage(terrainImage);
  const unitManagement = setupUnits(stage, unitLayer, units, pxPerInchWidth, pxPerInchHeight, width, height);
  const { cycleDeploymentZone, getCurrentZoneIndex, setCurrentZoneIndex } = setupDeploymentZones(zoneLayer, deploymentZones, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY);
  const { cycleObjectiveLayout, getCurrentObjectiveIndex, setCurrentObjectiveIndex } = setupObjectives(objectiveLayer, objectiveLayouts, pxPerInchWidth, pxPerInchHeight);
  setupUIControls(stage, unitManagement, width, height);

  document.getElementById('cycle-zones').addEventListener('click', cycleDeploymentZone);
  document.getElementById('cycle-objectives').addEventListener('click', cycleObjectiveLayout);

  // Populate category dropdown
  const categorySelect = document.getElementById('category-select');
  Object.keys(terrainCategories).forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category.replaceAll("_"," ").replace("WTC ","WTC - ");
    categorySelect.appendChild(option);
  });
  categorySelect.value = currentCategory;

  // Populate terrain dropdown based on category
  const terrainSelect = document.getElementById('terrain-select');
  function updateTerrainDropdown(category) {
    terrainSelect.innerHTML = ''; // Clear existing options
    terrainCategories[category].forEach(terrain => {
      const option = document.createElement('option');
      option.value = terrain;
      option.textContent = terrain.replace('.png', '').replace("WTC_","").replace("GW_","");
      terrainSelect.appendChild(option);
    });
    // Set default terrain if available, else first in category
    currentTerrain = terrainCategories[category].includes(currentTerrain) ? currentTerrain : terrainCategories[category][0];
    terrainSelect.value = currentTerrain;
  }
  updateTerrainDropdown(currentCategory);

  // Handle category change
  categorySelect.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    updateTerrainDropdown(currentCategory);
    // Load first terrain of new category
    currentTerrain = terrainCategories[currentCategory][0];
    terrainSelect.value = currentTerrain;
    const newTerrainImage = new Image();
    newTerrainImage.onload = () => {
      setTerrainImage(newTerrainImage);
      console.log('Terrain updated to:', currentTerrain);
    };
    newTerrainImage.onerror = () => {
      console.error('Failed to load new terrain:', currentTerrain);
      setTerrainImage(null);
    };
    newTerrainImage.src = '/diva/assets/' + currentTerrain;
  });

  // Handle terrain change
  terrainSelect.addEventListener('change', (e) => {
    currentTerrain = e.target.value;
    const newTerrainImage = new Image();
    newTerrainImage.onload = () => {
      setTerrainImage(newTerrainImage);
      console.log('Terrain updated to:', currentTerrain);
    };
    newTerrainImage.onerror = () => {
      console.error('Failed to load new terrain:', currentTerrain);
      setTerrainImage(null);
    };
    newTerrainImage.src = '/diva/assets/' + currentTerrain;
  });


  // PWA install prompt logic
  let deferredPrompt = null;
  const installButton = document.getElementById('install-app');

  // Check if the app is already installed
  function checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      console.log('App is running in standalone mode');
      installButton.style.display = 'none';
      return true;
    }
    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then(apps => {
        if (apps.length > 0) {
          console.log('App is already installed');
          installButton.style.display = 'none';
        }
      });
    }
    return false;
  }

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Prevent default browser prompt
    deferredPrompt = e; // Store prompt
    if (!checkIfInstalled()) {
      installButton.style.display = 'inline-block'; // Show button
      console.log('Install prompt available');
    }
  });

  // Handle install button click
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show install prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      if (outcome === 'accepted') {
        installButton.style.display = 'none'; // Hide button after install
        console.log('User accepted the install prompt');
      }
      deferredPrompt = null; // Clear prompt
    }
  });

  // Hide button if app is already installed
  window.addEventListener('appinstalled', () => {
    installButton.style.display = 'none';
    console.log('App was installed, hiding install button');
    deferredPrompt = null;
  });

  // Initial check for installed state
  checkIfInstalled();


  // Save state to localStorage
  function saveState() {
    const state = {
      units: units.map(unit => ({ ...unit })),
      unitInstances: unitManagement.getUnitInstances(),
      currentCategory: currentCategory,
      currentTerrain: currentTerrain,
      currentZoneIndex: getCurrentZoneIndex(),
      currentObjectiveIndex: getCurrentObjectiveIndex()
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

        // Restore category and terrain
        if (state.currentCategory && terrainCategories[state.currentCategory]) {
          currentCategory = state.currentCategory;
          categorySelect.value = currentCategory;
          updateTerrainDropdown(currentCategory);
          if (state.currentTerrain && terrainCategories[currentCategory].includes(state.currentTerrain)) {
            currentTerrain = state.currentTerrain;
            terrainSelect.value = currentTerrain;
            const restoredTerrainImage = new Image();
            restoredTerrainImage.onload = () => {
              setTerrainImage(restoredTerrainImage);
            };
            restoredTerrainImage.src = '/diva/assets/' + currentTerrain;
          } else {
            currentTerrain = terrainCategories[currentCategory][0];
            terrainSelect.value = currentTerrain;
            const restoredTerrainImage = new Image();
            restoredTerrainImage.onload = () => {
              setTerrainImage(restoredTerrainImage);
            };
            restoredTerrainImage.src = '/diva/assets/' + currentTerrain;
          }
        }

        // Restore indices
        if (typeof state.currentZoneIndex === 'number') {
          setCurrentZoneIndex(state.currentZoneIndex);
        }
        if (typeof state.currentObjectiveIndex === 'number') {
          setCurrentObjectiveIndex(state.currentObjectiveIndex);
        }

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
    units.length = 0;
    unitManagement.refreshRoster([]);
    unitLayer.removeChildren();
    unitLayer.draw();
    currentCategory = Object.keys(terrainCategories)[0];
    currentTerrain = terrainCategories[currentCategory][0];
    categorySelect.value = currentCategory;
    updateTerrainDropdown(currentCategory);
    terrainSelect.value = currentTerrain;
    const defaultTerrainImage = new Image();
    defaultTerrainImage.onload = () => {
      setTerrainImage(defaultTerrainImage);
    };
    defaultTerrainImage.src = '/diva/assets/' + currentTerrain;
    localStorage.setItem('diva_state', JSON.stringify({ 
      units: [], 
      unitInstances: [], 
      currentCategory: currentCategory, 
      currentTerrain: currentTerrain, 
      currentZoneIndex: 0, 
      currentObjectiveIndex: 0 
    }));
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
}

