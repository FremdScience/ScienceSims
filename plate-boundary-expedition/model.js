(function (root) {
  const MISSIONS = [
    {
      id: 'ember', name: 'Ember Arc', brief: 'A coastal region is experiencing earthquakes and volcanic activity. Determine what is happening underground.',
      type: 'convergent', boundaryTilt: -18, colors: ['#2b8cbe', '#f4a261'],
      stations: [
        { id: 'q', title: 'Seismic Array', layer: 'quakes', observation: 'Earthquakes become progressively deeper moving inland from the trench.', lon: -18, lat: 12 },
        { id: 'v', title: 'Volcano Observatory', layer: 'volcanoes', observation: 'A curved chain of volcanoes lies on the overriding plate.', lon: 12, lat: 25 },
        { id: 'a', title: 'Ocean Drill Site', layer: 'age', observation: 'Dense oceanic crust is moving toward a trench beside younger continental crust.', lon: -35, lat: -10 },
        { id: 'm', title: 'GPS Station', layer: 'motion', observation: 'The two plates are moving toward one another.', lon: 28, lat: -18 }
      ],
      actions: [
        ['coast', 'Prepare for strong shaking, coastal tsunami risk, and volcanic hazards.'],
        ['rift', 'Monitor a widening rift and new seafloor formation.'],
        ['slide', 'Plan mainly for shallow earthquakes along a sliding fault.']
      ], correctAction: 'coast'
    },
    {
      id: 'rift', name: 'Azure Rift', brief: 'A long valley is widening while molten material rises near its center. Explain how new crust is forming.',
      type: 'divergent', boundaryTilt: 8, colors: ['#168aad', '#52b788'],
      stations: [
        { id: 'q', title: 'Seismic Array', layer: 'quakes', observation: 'Earthquakes are shallow and cluster along the center of the rift.', lon: -20, lat: 8 },
        { id: 'v', title: 'Volcano Observatory', layer: 'volcanoes', observation: 'Basaltic eruptions occur along a linear crack.', lon: 4, lat: 30 },
        { id: 'a', title: 'Rock Dating Lab', layer: 'age', observation: 'The youngest crust is at the center; crust gets older on both sides.', lon: 24, lat: -12 },
        { id: 'm', title: 'GPS Station', layer: 'motion', observation: 'Stations on opposite sides move away from the center.', lon: -38, lat: -24 }
      ],
      actions: [
        ['coast', 'Prepare for a deep ocean trench and explosive volcanic arc.'],
        ['rift', 'Monitor shallow quakes, fissure eruptions, and ground spreading.'],
        ['slide', 'Expect only sideways motion with no new crust.']
      ], correctAction: 'rift'
    },
    {
      id: 'shear', name: 'Shear Valley', brief: 'Roads and stream channels are offset across a long fault. Determine how the plates are moving.',
      type: 'transform', boundaryTilt: 25, colors: ['#577590', '#90be6d'],
      stations: [
        { id: 'q', title: 'Seismic Array', layer: 'quakes', observation: 'Frequent shallow earthquakes form a narrow line along the fault.', lon: -26, lat: 17 },
        { id: 'v', title: 'Volcano Survey', layer: 'volcanoes', observation: 'No volcanic arc or continuous rift eruptions are present.', lon: 16, lat: 28 },
        { id: 'a', title: 'Crust Survey', layer: 'age', observation: 'Crust of similar age continues across the fault; none is created or destroyed.', lon: 32, lat: -17 },
        { id: 'm', title: 'GPS Station', layer: 'motion', observation: 'The two sides move horizontally past one another in opposite directions.', lon: -34, lat: -22 }
      ],
      actions: [
        ['coast', 'Focus on tsunami and volcanic-ash evacuation.'],
        ['rift', 'Plan for a widening basin and lava along a spreading center.'],
        ['slide', 'Strengthen structures and crossings for intense shallow shaking and surface offset.']
      ], correctAction: 'slide'
    }
  ];

  function gradeReport(mission, collectedIds, boundary, action, claim) {
    const evidenceCount = new Set(collectedIds).size;
    const enoughEvidence = evidenceCount >= 3;
    const classificationCorrect = boundary === mission.type;
    const actionCorrect = action === mission.correctAction;
    const claimReady = String(claim || '').trim().split(/\s+/).filter(Boolean).length >= 8;
    const passed = enoughEvidence && classificationCorrect && actionCorrect && claimReady;
    const points = (enoughEvidence ? 25 : evidenceCount * 5) + (classificationCorrect ? 30 : 0) + (actionCorrect ? 25 : 0) + (claimReady ? 20 : 0);
    return { passed, points, evidenceCount, enoughEvidence, classificationCorrect, actionCorrect, claimReady };
  }

  const api = { MISSIONS, gradeReport };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PlateModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
