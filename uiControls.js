import { units, baseSizes } from './config.js';

export function setupUIControls(stage, unitManagement, width, height) {
  const sidebar = document.getElementById('sidebar');
  const rosterList = document.getElementById('roster-list');
  let draggedUnit = null;

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
      unitManagement.setSelectedUnitName(rosterItem.dataset.unitName);
      console.log('Selected roster unit:', unitManagement.getSelectedUnitName());
    }
  });

  rosterList.addEventListener('dragstart', e => {
    if (e.target.classList.contains('roster-item')) {
      draggedUnit = e.target.dataset.unitName;
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
    const selectedUnitName = unitManagement.getSelectedUnitName();
    if (selectedUnitName) {
      console.log('Spawning unit from button:', selectedUnitName);
      unitManagement.addUnit(selectedUnitName);
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

  document.getElementById('confirm-import').addEventListener('click', () => {
    const input = document.getElementById('unit-list-input').value.trim();
    if (input) {
      const newUnits = parseUnitList(input);
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

  function parseUnitList(input) {
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    const newUnits = [];
    const colors = ['purple', 'blue', 'green', 'red', 'yellow', 'orange', 'cyan', 'magenta', 'brown', 'gray'];
    let colorIndex = 0;

    lines.forEach(line => {
      // Match unit name and optional model count (e.g., "5x Legionaries")
      const match = line.match(/^(?:(\d+)x\s*)?([^\(]+)(?:\s*\(\d+pts\))?(?::.*)?$/i);
      if (match) {
        const modelCount = parseInt(match[1]) || 1;
        const unitName = match[2].trim();
        const baseSize = baseSizes[unitName];
        if (baseSize) {
          let unit = {
            name: unitName,
            modelCount,
            color: colors[colorIndex % colors.length],
            baseSize
          };
          colorIndex++;
          
          // Parse base size and assign shape and dimensions
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
          } else {
            console.warn(`Invalid base size format for ${unitName}: ${baseSize}`);
          }
          newUnits.push(unit);
        } else {
          console.warn(`No base size found for ${unitName}`);
        }
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