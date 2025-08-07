export function setupObjectives(objectiveLayer, objectiveLayouts, pxPerInchWidth, pxPerInchHeight) {
  let currentObjectiveIndex = 0;

  function drawObjectiveLayout() {
    objectiveLayer.removeChildren();
    const layout = objectiveLayouts[currentObjectiveIndex];
    layout.objectives.forEach(obj => {
      const radiusCircle = new Konva.Circle({
        x: obj.x * pxPerInchWidth,
        y: obj.y * pxPerInchHeight,
        radius: obj.radius * pxPerInchWidth,
        stroke: 'orange',
        strokeWidth: 2,
        fill: 'rgba(255, 165, 0, 0.2)'
      });
      const markerCircle = new Konva.Circle({
        x: obj.x * pxPerInchWidth,
        y: obj.y * pxPerInchHeight,
        radius: 0.5 * pxPerInchWidth,
        fill: 'orange'
      });
      objectiveLayer.add(radiusCircle, markerCircle);
    });
    objectiveLayer.draw();
    document.getElementById('cycle-objectives').textContent = `Objectives: ${layout.name}`;
    console.log('Drawing objective layout:', layout.name);
  }

  function cycleObjectiveLayout() {
    currentObjectiveIndex = (currentObjectiveIndex + 1) % objectiveLayouts.length;
    console.log('Cycling objectives to:', objectiveLayouts[currentObjectiveIndex].name);
    drawObjectiveLayout();
  }

  drawObjectiveLayout();
  return { cycleObjectiveLayout };
}