export default {
  name: 'Thunder Party', mode: 'battle', duel: true, aiSpeed: 0, pdir: [0, -1],
  /* the grand finale, kept gentle: a wide open hall, a bubble right in front of the start and more bubbles
     on the way to every place Volt can blink to, and they all grow back. Volt dawdles along short tracks.
     Zoom pads by the start for a fast first bump. Two crossing swirls in the corners: turn left at the start and the
     bottom-left swirl pops you out top right, right on Volt's track (and the mirror for turning right). Driving
     straight up instead collects a bubble, a star and another bubble on the way to Volt */
  boss: { type: 'volt', name: 'Volt', x: 9, y: 3.5, duel: true, hp: 3, zone: [1, 1, 17, 23],
    path: [6, 3.5, 12, 3.5], speed: 0.8,
    spots: [[5, 3.5, 13, 3.5], [3.5, 12], [14.5, 12], [5, 19.5, 13, 19.5]] },
  portals: [[2, 21, 15, 4], [15, 21, 2, 4]],
  tip: 'Party time: bump Volt three times!',
  map: [
    '##################',
    '#                #',
    '#                #',
    '#                #',
    '#   *        *   #',
    '#                #',
    '#                #',
    '#                #',
    '#        B       #',
    '#                #',
    '#                #',
    '#  B    *     B  #',
    '#                #',
    '#                #',
    '#                #',
    '#   *        *   #',
    '#                #',
    '#        B       #',
    '#                #',
    '#       ++       #',
    '#                #',
    '#        1       #',
    '#                #',
    '##################'
  ]
};
