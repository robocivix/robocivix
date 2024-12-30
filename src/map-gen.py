#!/usr/bin/env -S python3 -W ignore

import random
import json

CHUNK_SIZE = 16
width = 48
height = 32

# [
#     [{"type": "ore", "quantity": 13245}, {"type": "water", "quantity": 5000}, null],
#     [null, {"type": "ore", "quantity": 4000}, {"type": "ore", "quantity": 8000}],
#     [{"type": "water", "quantity": 3000}, null, {"type": "ore", "quantity": 10000}]
# ]

data = {}
types = ["ore", "water"]
density = 0.1

for cy in range(height):
    for cx in range(width):
        chunk = [None] * CHUNK_SIZE
        chunk_key = f'{cx},{cy}'
        data[chunk_key] = chunk

        for y in range(CHUNK_SIZE):
            row = chunk[y] = [None] * CHUNK_SIZE
            for x in range(CHUNK_SIZE):
                if random.random() > density:
                    continue

                cell = {
                    "type": random.choice(types),
                    "value": int(random.random() * 10000)
                }
                row[x] = cell

with open("data/map-data.json", "wt") as file:
    json.dump(data, file, indent=4)

