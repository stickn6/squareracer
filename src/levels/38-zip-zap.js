export default {
  name: 'Zip Zap', mode: 'race', aiSpeed: 2.4, pdir: [-1, 0],
  boss: { type: 'volt', name: 'Volt', x: 10, y: 14.5, patrol: [8.5, 11.5], speed: 0.6, r: 7.4, idle: 2.6, charge: 1.2, first: [2.2, 3.0], zone: [1, 7, 19, 21] },
  /* zig, zap, zoom: the square starts rolling left along the bottom lane into the blue portal, pops out at the right
     end of the lane above, still heading left, rolls into the pink portal and pops out in the top strip, still
     heading left, straight into the red corner. Every portal sits on the line the square already rolls along, so
     no steering and no timing is needed; pressing up anywhere in the top strip also wins. Volt's big ring fills
     the middle room (the long way round) but stops just short of the lanes and the top strip.
     The lanes are 3 tall on purpose: after an up/down press the square still lands on the portal row most of the time.
     Spawns sit one tile clear of every wall (a spawn touching a wall gets pushed through it on the first step). */
  portals: [[3, 27, 17, 23], [3, 23, 17, 4]],
  tip: 'Zip into the blue swirl, then the pink one!',
  map: [
    '####################',
    '#FFFFFFFFFFFFFFFFFF#',
    '#FFFFFFFFFFFFFFFFFF#',
    '#FFF               #',
    '#FFF         *     #',
    '#FFF               #',
    '#FFF  *        *   #',
    '#########   ########',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#                  #',
    '#               3  #',
    '#                  #',
    '#  #################',
    '#                  #',
    '#      *     *     #',
    '#                  #',
    '####################',
    '#                  #',
    '#       *   B  1 2 #',
    '#                  #',
    '####################'
  ]
};
