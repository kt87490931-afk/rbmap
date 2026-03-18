#!/usr/bin/env python3
import re, sys, subprocess
secret = subprocess.check_output(['openssl', 'rand', '-base64', '32']).decode().strip()
with open('/var/www/rbmap/.env.production', 'r') as f:
    c = f.read()
c = re.sub(r'^NEXTAUTH_SECRET=.*', 'NEXTAUTH_SECRET=' + secret, c, flags=re.M)
with open('/var/www/rbmap/.env.production', 'w') as f:
    f.write(c)
print('NEXTAUTH_SECRET updated')
