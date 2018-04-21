import requests
import networkx as nx

SOURCE = 'gml/lesmiserables.gml'
GRAPHID = '5ad09dd33fd6fe0e8074dfe0'

def updateEdge(f, t, v):
    requests.post('http://localhost:3000/api/graphs/'+GRAPHID, data = {
        'from': f, 
        'to': t,
        'value': v
    })

def updateName(node, name):
    requests.post('http://localhost:3000/api/graphs/'+GRAPHID+'/names', data = {
        'id': node, 
        'name': name
    })

G = nx.read_gml(SOURCE)
convert = {}

print(nx.info(G))

i = 0
for node in nx.nodes(G):
    updateName(i, node)

    convert[node] = i 
    i += 1

for edge in G.edges(data=True):
    print(edge)
    f, t, data = edge
    f, t = convert[f], convert[t]
    value = data["value"]
    updateEdge(f, t, value)

print(convert)