// Hand-reviewed frame crops and pivots. Jump pivots preserve a virtual standing baseline.
export const HERO_ASSETS = {
  "idle": {
    "url": "assets/hero-idle-v12.webp",
    "cols": 1,
    "rows": 1,
    "bodyHeight": 1144,
    "frames": [{"rect": [0,0,1223,1286], "pivot": [650,1221]}]
  },
  "walk": {
    "url": "assets/hero-walk-v3.webp",
    "cols": 4,
    "rows": 2,
    "bodyHeight": 450,
    "frames": [
      {
        "rect": [
          45,
          48,
          340,
          507
        ],
        "pivot": [
          219,
          503
        ]
      },
      {
        "rect": [
          439,
          49,
          717,
          508
        ],
        "pivot": [
          605,
          504
        ]
      },
      {
        "rect": [
          805,
          47,
          1078,
          508
        ],
        "pivot": [
          974,
          504
        ]
      },
      {
        "rect": [
          1186,
          47,
          1451,
          514
        ],
        "pivot": [
          1355,
          510
        ]
      },
      {
        "rect": [
          34,
          530,
          333,
          983
        ],
        "pivot": [
          218,
          979
        ]
      },
      {
        "rect": [
          425,
          530,
          714,
          987
        ],
        "pivot": [
          603,
          983
        ]
      },
      {
        "rect": [
          800,
          529,
          1082,
          989
        ],
        "pivot": [
          975,
          985
        ]
      },
      {
        "rect": [
          1187,
          530,
          1499,
          985
        ],
        "pivot": [
          1360,
          981
        ]
      }
    ]
  },
  "slash": {
    "url": "assets/hero-slash-v3.webp",
    "cols": 4,
    "rows": 2,
    "bodyHeight": 295,
    "frames": [
      {
        "rect": [
          101,
          93,
          372,
          402
        ],
        "pivot": [
          226,
          396
        ]
      },
      {
        "rect": [
          543,
          95,
          786,
          401
        ],
        "pivot": [
          691,
          395
        ]
      },
      {
        "rect": [
          981,
          74,
          1211,
          402
        ],
        "pivot": [
          1116,
          396
        ]
      },
      {
        "rect": [
          1422,
          93,
          1707,
          399
        ],
        "pivot": [
          1560,
          393
        ]
      },
      {
        "rect": [
          88,
          500,
          468,
          794
        ],
        "pivot": [
          202,
          788
        ]
      },
      {
        "rect": [
          556,
          510,
          873,
          789
        ],
        "pivot": [
          665,
          783
        ]
      },
      {
        "rect": [
          1004,
          495,
          1274,
          795
        ],
        "pivot": [
          1120,
          789
        ]
      },
      {
        "rect": [
          1434,
          498,
          1707,
          796
        ],
        "pivot": [
          1555,
          790
        ]
      }
    ]
  },
  "bolt": {
    "url": "assets/hero-bolt-v3.webp",
    "cols": 4,
    "rows": 2,
    "bodyHeight": 325,
    "frames": [
      {
        "rect": [
          126,
          91,
          360,
          429
        ],
        "pivot": [
          246,
          423
        ]
      },
      {
        "rect": [
          557,
          95,
          811,
          430
        ],
        "pivot": [
          687,
          424
        ]
      },
      {
        "rect": [
          981,
          89,
          1247,
          431
        ],
        "pivot": [
          1129,
          425
        ]
      },
      {
        "rect": [
          1421,
          87,
          1717,
          431
        ],
        "pivot": [
          1560,
          425
        ]
      },
      {
        "rect": [
          72,
          501,
          430,
          833
        ],
        "pivot": [
          229,
          827
        ]
      },
      {
        "rect": [
          516,
          498,
          890,
          834
        ],
        "pivot": [
          683,
          828
        ]
      },
      {
        "rect": [
          993,
          501,
          1252,
          837
        ],
        "pivot": [
          1136,
          831
        ]
      },
      {
        "rect": [
          1437,
          501,
          1679,
          837
        ],
        "pivot": [
          1562,
          831
        ]
      }
    ]
  },
  "rain": {
    "url": "assets/hero-rain-v3.webp",
    "cols": 4,
    "rows": 2,
    "bodyHeight": 380,
    "frames": [
      {
        "rect": [
          115,
          42,
          374,
          434
        ],
        "pivot": [
          240,
          428
        ]
      },
      {
        "rect": [
          505,
          77,
          795,
          436
        ],
        "pivot": [
          647,
          428
        ]
      },
      {
        "rect": [
          950,
          43,
          1289,
          435
        ],
        "pivot": [
          1105,
          428
        ]
      },
      {
        "rect": [
          1384,
          0,
          1688,
          435
        ],
        "pivot": [
          1560,
          428
        ]
      },
      {
        "rect": [
          90,
          439,
          334,
          884
        ],
        "pivot": [
          231,
          875
        ]
      },
      {
        "rect": [
          495,
          441,
          796,
          885
        ],
        "pivot": [
          658,
          875
        ]
      },
      {
        "rect": [
          954,
          476,
          1216,
          886
        ],
        "pivot": [
          1093,
          875
        ]
      },
      {
        "rect": [
          1410,
          486,
          1685,
          883
        ],
        "pivot": [
          1556,
          875
        ]
      }
    ]
  },
  "reaction": {
    "url": "assets/hero-jump-hurt-v4.webp",
    "cols": 4,
    "rows": 2,
    "bodyHeight": 383,
    "frames": [
      {
        "rect": [
          85,
          40,
          415,
          450
        ],
        "pivot": [
          280,
          441
        ]
      },
      {
        "rect": [
          520,
          25,
          820,
          420
        ],
        "pivot": [
          711,
          418
        ]
      },
      {
        "rect": [
          958,
          40,
          1258,
          473
        ],
        "pivot": [
          1143,
          463
        ]
      },
      {
        "rect": [
          1380,
          100,
          1710,
          475
        ],
        "pivot": [
          1578,
          480
        ]
      },
      {
        "rect": [
          85,
          490,
          370,
          877
        ],
        "pivot": [
          259,
          867
        ]
      },
      {
        "rect": [
          490,
          475,
          825,
          877
        ],
        "pivot": [
          720,
          867
        ]
      },
      {
        "rect": [
          950,
          478,
          1260,
          880
        ],
        "pivot": [
          1127,
          868
        ]
      },
      {
        "rect": [
          1400,
          475,
          1695,
          880
        ],
        "pivot": [
          1577,
          868
        ]
      }
    ]
  }
};
