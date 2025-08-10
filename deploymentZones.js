export function setupDeploymentZones(zoneLayer, deploymentZones, width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY) {
  let currentZoneIndex = 0;

  function drawDeploymentZone() {
    zoneLayer.removeChildren();
    const zone = deploymentZones[currentZoneIndex];

    zone.lines.forEach(line => {
      const points = line.points(width, height, pxPerInchWidth, pxPerInchHeight, centerX, centerY);

      const konvaLine = new Konva.Line({
        points: points,
        stroke: line.stroke,
        strokeWidth: line.strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
        closed: !!line.isCircle // closes shape if it's a circle
      });

      zoneLayer.add(konvaLine);
    });

    zoneLayer.draw();
    document.getElementById('cycle-zones').textContent = `Deployment Zone: ${zone.name}`;
    console.log('Drawing deployment zone:', zone.name, 'Lines:', zone.lines);
  }


  function cycleDeploymentZone() {
    currentZoneIndex = (currentZoneIndex + 1) % deploymentZones.length;
    console.log('Cycling deployment zone to:', deploymentZones[currentZoneIndex].name);
    drawDeploymentZone();
  }

  function getCurrentZoneIndex() {
      return currentZoneIndex;
    }

    function setCurrentZoneIndex(index) {
      currentZoneIndex = index % deploymentZones.length;
      drawDeploymentZone();
    }

    drawDeploymentZone();
    return { cycleDeploymentZone, getCurrentZoneIndex, setCurrentZoneIndex };

}
