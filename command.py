import requests
from random import random, randint

for i in range(0, 100):
    print("Node", i)
    for j in range(0, 100):
        if random() < 0.1:
            requests.post('http://localhost:3000/api/graphs/5ac1171819ebb61d4c98714c', data = {
                'from': i, 
                'to': j,
                'value': randint(-10, 10)
            })
