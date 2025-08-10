import { units, baseSizes } from './config.js';

export function setupUIControls(stage, unitManagement, width, height) {
  const sidebar = document.getElementById('sidebar');
  const rosterList = document.getElementById('roster-list');
  let draggedUnit = null;

  // Create Clear Roster button
  const clearRosterButton = document.createElement('button');
  clearRosterButton.id = 'clear-roster';
  clearRosterButton.textContent = 'Clear Roster';
  document.getElementById('controls').appendChild(clearRosterButton);

  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  document.getElementById('toggle-drag-mode').addEventListener('click', () => {
    unitManagement.updateDragMode(!document.getElementById('toggle-drag-mode').textContent.includes('Group'));
  });

  rosterList.addEventListener('click', e => {
    if (e.target.classList.contains('roster-item') || e.target.closest('.roster-item')) {
      const rosterItem = e.target.classList.contains('roster-item') ? e.target : e.target.closest('.roster-item');
      document.querySelectorAll('.roster-item').forEach(item => item.classList.remove('selected'));
      rosterItem.classList.add('selected');
      unitManagement.setSelectedUnitName(rosterItem.dataset.unitId);
      console.log('Selected roster unit:', unitManagement.getSelectedUnitName());
    }
  });

  rosterList.addEventListener('dragstart', e => {
    if (e.target.classList.contains('roster-item')) {
      draggedUnit = e.target.dataset.unitId;
      e.target.classList.add('dragging');
      console.log('Dragging roster item:', draggedUnit);
    }
  });

  rosterList.addEventListener('dragend', e => {
    if (e.target.classList.contains('roster-item')) {
      e.target.classList.remove('dragging');
      draggedUnit = null;
    }
  });

  stage.container().addEventListener('dragover', e => {
    e.preventDefault();
  });

  const isDesktop = !('ontouchstart' in window || navigator.maxTouchPoints > 0);

  stage.container().addEventListener('drop', e => {
    e.preventDefault();
    if (draggedUnit) {
      if (isDesktop) {
        console.log('Desktop drop: Spawning unit at canvas center:', draggedUnit);
        unitManagement.addUnit(draggedUnit);
      } else {
        const rect = stage.container().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log('Mobile drop: Dropped unit:', draggedUnit, 'at position:', { x, y });
        unitManagement.addUnit(draggedUnit, x, y);
      }
      draggedUnit = null;
    }
  });

  document.getElementById('spawn-unit').addEventListener('click', () => {
    const selectedUnitId = unitManagement.getSelectedUnitName();
    if (selectedUnitId) {
      console.log('Spawning unit from button:', selectedUnitId);
      unitManagement.addUnit(selectedUnitId);
    } else {
      console.warn('No unit selected for spawning');
    }
  });

  document.getElementById('import-list').addEventListener('click', () => {
    document.getElementById('import-popup').style.display = 'flex';
  });

  document.getElementById('cancel-import').addEventListener('click', () => {
    document.getElementById('import-popup').style.display = 'none';
    document.getElementById('unit-list-input').value = '';
  });

  document.getElementById('confirm-import').addEventListener('click', async () => {
    const input = document.getElementById('unit-list-input').value.trim();
    if (input) {
      const newUnits = await parseUnitList(input);
      updateUnits(newUnits);
      unitManagement.refreshRoster(newUnits);
      document.getElementById('import-popup').style.display = 'none';
      document.getElementById('unit-list-input').value = '';
      console.log('Imported and updated units:', newUnits);
    } else {
      console.warn('No unit list provided for import');
    }
  });

  stage.container().addEventListener('contextmenu', e => e.preventDefault());

  // Levenshtein distance function to calculate string similarity
  function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // Deletion
          matrix[j - 1][i] + 1, // Insertion
          matrix[j - 1][i - 1] + indicator // Substitution
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  // Calculate similarity score (0-100) based on Levenshtein distance
  function similarityScore(a, b) {
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 100; // Both empty strings
    const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    return Math.round((1 - distance / maxLength) * 100);
  }

  async function parseUnitList(input) {
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    const newUnits = [];
    const colors = ['purple', 'blue', 'green', 'red', 'yellow', 'orange', 'cyan', 'magenta', 'brown', 'gray'];
    let colorIndex = 0;
    let unitIdCounter = 0; // Counter for unique unit IDs

    // Wait for baseSizes to load
    const baseSizesData = await baseSizes;
    console.log('baseSizes loaded for parsing:', baseSizesData);

    lines.forEach(line => {
      // Match unit name and optional model count (e.g., "5x Legionaries")
      const match = line.match(/^(?:(\d+)x\s*)?([^\(]+)(?:\s*\(\d+pts\))?(?::.*)?$/i);
      if (match) {
        const modelCount = parseInt(match[1]) || 1;
        let unitName = match[2].trim();
        console.log(`Parsing unit: ${unitName}, modelCount: ${modelCount}`);

        // Try exact match first
        let baseSize = baseSizesData[unitName];

        // If no exact match, use fuzzy matching
        if (!baseSize) {
          const baseSizeKeys = Object.keys(baseSizesData);
          let bestMatch = null;
          let bestScore = 0;

          for (const key of baseSizeKeys) {
            const score = similarityScore(unitName, key);
            if (score >= 85 && score > bestScore) {
              bestMatch = key;
              bestScore = score;
            }
          }

          if (bestMatch) {
            console.log(`Fuzzy matched ${unitName} to ${bestMatch} with score ${bestScore}`);
            unitName = bestMatch; // Use the matched name
            baseSize = baseSizesData[bestMatch];
          } else {
            console.warn(`No base size found for ${unitName} (no fuzzy match >= 85%)`);
            return; // Skip unit if no match
          }
        } else {
          console.log(`Found exact base size for ${unitName}: ${baseSize}`);
        }

        let unit = {
          id: `unit_${unitIdCounter++}`, // Unique ID
          name: unitName,
          modelCount,
          color: colors[colorIndex % colors.length],
          baseSize
        };
        colorIndex++;

        // Parse base size and assign shape and dimensions
        if (baseSize === 'Hull') {
          unit.shape = 'rectangle';
          unit.width = 150 / 25.4; // 150 mm to inches
          unit.height = 100 / 25.4; // 100 mm to inches
          console.log(`Unit ${unitName} assigned rectangle shape (Hull): ${unit.width}x${unit.height} inches`);
        } else if (baseSize.toLowerCase().includes('flying')) {
          unit.shape = 'rectangle';
          unit.width = 130 / 25.4; // 130 mm to inches
          unit.height = 100 / 25.4; // 100 mm to inches
          console.log(`Unit ${unitName} assigned rectangle shape (Flying): ${unit.width}x${unit.height} inches`);
        } else {
          const sizeMatch = baseSize.match(/^(\d+)(?:x(\d+))?\s*mm$/);
          if (sizeMatch) {
            const size1 = parseInt(sizeMatch[1]) / 25.4; // Convert mm to inches
            if (sizeMatch[2]) {
              // Ellipse (e.g., 140x80 mm)
              const size2 = parseInt(sizeMatch[2]) / 25.4;
              unit.shape = 'ellipse';
              unit.radiusX = size1 / 2; // Width / 2
              unit.radiusY = size2 / 2; // Height / 2
            } else {
              // Circle (e.g., 40 mm)
              unit.shape = 'circle';
              unit.radius = size1 / 2; // Diameter / 2
            }
            console.log(`Unit ${unitName} processed with shape: ${unit.shape}`);
          } else {
            console.warn(`Invalid base size format for ${unitName}: ${baseSize}`);
          }
        }
        newUnits.push(unit);
      } else {
        console.warn(`Invalid unit format: ${line}`);
      }
    });

    return newUnits;
  }

  function updateUnits(newUnits) {
    units.length = 0; // Clear existing units
    newUnits.forEach(unit => units.push(unit));
  }
}