#!/usr/bin/env -S python3 -W ignore

import random
import json


width = 400
height = 300

# [
#     [{"type": "ore", "quantity": 13245}, {"type": "water", "quantity": 5000}, null],
#     [null, {"type": "ore", "quantity": 4000}, {"type": "ore", "quantity": 8000}],
#     [{"type": "water", "quantity": 3000}, null, {"type": "ore", "quantity": 10000}]
# ]

data = [None] * height
types = ["ore", "water"]
density = 0.1

for y in range(height):
    row = [None] * width
    data[y] = row
    for x in range(width):
        if random.random() > density:
            continue

        cell = {
            "type": random.choice(types),
            "value": int(random.random() * 10000)
        }
        row[x] = cell

with open("map-data.json", "wt") as file:
    json.dump(data, file, indent=4)

