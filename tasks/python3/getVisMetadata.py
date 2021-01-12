#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor
from optparse import OptionParser
import os
import json
import urllib3
import certifi
http = urllib3.PoolManager(
    cert_reqs='CERT_REQUIRED',
    ca_certs=certifi.where()
  )
prog = os.path.basename(__file__)
parser = OptionParser(usage="Usage: %s <input_file> <output_file>" % prog)
(options, args) = parser.parse_args()
input_file = args[0]
output_file = args[1]

# TODO pull from features config?
gibs_url = 'https://uat.gibs.earthdata.nasa.gov/layer-metadata/v1.0/'
use_keys = ['conceptIds']
layer_metadata = {}

def get_metadata(layer_id):
  response = http.request('GET', gibs_url + layer_id + '.json')
  layer_metadata[layer_id] = json.loads(response.data.decode('utf-8'))

  # Remove any props we don't expect to use
  metadata_keys = dict(layer_metadata[layer_id]).keys()
  for key in metadata_keys:
    if key not in use_keys:
      layer_metadata[layer_id].pop(key, None)

#MAIN
if __name__ == "__main__":
  with open(input_file, 'rt') as layer_order:
    layer_ids = json.load(layer_order).get('layerOrder')
    print('%s: Pulling vis metadata for %s layers... ' % (prog, len(layer_ids)))

  futures = []
  with ThreadPoolExecutor() as executor:
    for layer in layer_ids:
      futures.append(executor.submit(get_metadata, layer))
  for f in futures:
    try:
      # Need to call result() on each future to catch any raised exceptions
      f.result()
    except Exception as e:
      print("%s:" % (e))

  with open(output_file, "w") as fp:
    # Format of this object will determine how this data is combined into wv.json
    json.dump({ 'layers': layer_metadata}, fp, indent=2, sort_keys=True)