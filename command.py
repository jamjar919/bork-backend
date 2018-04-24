import requests
from random import random, randint

sets = [
    (0,5),
    (5, 10),
    (10, 15),
    (15, 20)
]

gid = '5addf311649c0b1f3c73e466'

MAKE_BETWEEN_PARTITIONS = True

for s in sets:
    for i in range(s[0], s[1]):
        print("Node", i)
        for j in range(s[0], s[1]):
            if random() < 0.75:
                requests.post('http://localhost:3000/api/graphs/'+gid, data = {
                    'from': i, 
                    'to': j,
                    'value': randint(-3, 10)
                })

if MAKE_BETWEEN_PARTITIONS:
    optcut = 0;
    for s1 in sets:
        for i in range(s1[0], s1[1]):
            print("Node", i)
            for s2 in sets:
                for j in range(s2[0], s2[1]):
                    if random() < 0.1:
                        val = randint(-3, 5)
                        optcut += val
                        requests.post('http://localhost:3000/api/graphs/'+gid, data = {
                            'from': i, 
                            'to': j,
                            'value': val
                        })
    print(optcut)