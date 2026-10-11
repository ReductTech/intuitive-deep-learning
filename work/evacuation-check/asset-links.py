import requests,re
for url in ['https://quaternius.com/packs/ultimatestylizednature.html','https://quaternius.com/packs/stylizednaturemegakit.html','https://kenney.nl/assets/city-kit-industrial','https://kenney.nl/assets/nature-kit','https://kenney.nl/assets/factory-kit']:
 s=requests.get(url,timeout=30).text
 print(url)
 for href in re.findall(r'href=[\"\x27]([^\"\x27]+)',s):
  if any(k in href.lower() for k in ['drive.google','dropbox','download','zip','itch.io','mediafire']): print(href)
