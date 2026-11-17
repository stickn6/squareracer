export default {
  name: 'Snowball', mode: 'battle', duel: true, aiSpeed: 0, pdir: [0, -1],
  /* a gentle snowball fight: one slow snowball at a time with long breaks between throws,
     and bubbles that grow back, so a child can ignore the ice and just chase Frost.
     Frost skates slowly along the top; after the first bump he blinks to the bottom track */
  boss: { type: 'frost', name: 'Frost', x: 9, y: 3, duel: true, hp: 2, zone: [1, 1, 17, 23],
    path: [5, 3, 13, 3], speed: 1.4,
    gaps: [3.6, 4.0], reaim: [2.0, 2.4], fans: [1, 1],
    spots: [[5, 3, 13, 3], [5, 19.5, 13, 19.5]] },
  /* one 'zoom tube' straight up the middle: going up it pops the child out just under Frost's
     top track; after the first bump Frost blinks to the bottom, and going down it pops the child
     out just above his bottom track, so the tube helps in both rounds. Two stars sit right on
     that route (just before the tube mouth and just after the top exit); four more are treats */
  portals: [[9, 18, 9, 6]],
  tip: 'Zoom through the swirl and bump Frost two times!',
  map: [
    '##################',
    '#                #',
    '#                #',
    '#                #',
    '#                #',
    '#        *       #',
    '#  *          *  #',
    '#                #',
    '#                #',
    '#  B          B  #',
    '#                #',
    '#                #',
    '#                #',
    '#                #',
    '#                #',
    '#                #',
    '#   *        *   #',
    '#                #',
    '#                #',
    '#        *       #',
    '#        B       #',
    '#        1       #',
    '#                #',
    '##################'
  ]
};
