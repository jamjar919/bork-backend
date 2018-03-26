import requests
from random import random, randint

for i in range(0, 100):
    print("Node", i)
    for j in range(0, 100):
        if random() < 0.01:
            requests.post('http://localhost:3000/api/graphs/5ab95ca93a7ff821f4e064da', data = {
                'from': i, 
                'to': j,
                'value': randint(0, 10)
            })
