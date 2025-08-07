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
    if (e.target.classList.contains('roster-item')) {
      document.querySelectorAll('.roster-item').forEach(item => item.classList.remove('selected'));
      e.target.classList.add('selected');
      unitManagement.setSelectedUnitName(e.target.dataset.unitName);
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

  // Detect if running on desktop (mouse) vs. mobile (touch)
  const isDesktop = !('ontouchstart' in window || navigator.maxTouchPoints > 0);

  stage.container().addEventListener('drop', e => {
    e.preventDefault();
    if (draggedUnit) {
      if (isDesktop) {
        // On desktop, spawn at canvas center
        console.log('Desktop drop: Spawning unit at canvas center:', draggedUnit);
        unitManagement.addUnit(draggedUnit);
      } else {
        // On mobile, spawn at drop point or center if invalid
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

  stage.container().addEventListener('contextmenu', e => e.preventDefault());
}